import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fetch from "node-fetch";
import { getPrisma } from "@minus1days/db";
import {
  AddBotRequest,
  AppTokenPayload,
  CreateRoomRequest,
  EngineCreateGameRequest,
  JoinRoomRequest,
  NotifyPayload,
  QuickJoinRequest,
  SeatKind,
} from "@minus1days/shared";
import { verifyAppToken } from "@minus1days/shared/dist/cjs/auth";
import { env } from "./env";
import { addBot, createRoom, getRoom, getRoomByCode, joinRoom, markStarted, quickJoin, toLobbyState } from "./lobby";

const prisma = getPrisma();
const app = express();
app.use(cors());
app.use(express.json());

interface AuthedRequest extends Request {
  user?: AppTokenPayload;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    req.user = verifyAppToken(token, env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "matchmaking" }));

app.post("/rooms", requireAuth, async (req: AuthedRequest, res) => {
  const body = req.body as CreateRoomRequest;
  const room = createRoom(req.user!.userId, body.displayName || req.user!.displayName, body.maxPlayers);
  await prisma.room.create({
    data: { id: room.roomId, code: room.code, maxPlayers: room.maxPlayers, hostUserId: req.user!.userId },
  });
  res.json({ roomId: room.roomId, code: room.code, playerId: req.user!.userId });
});

app.post("/rooms/:code/join", requireAuth, async (req: AuthedRequest, res) => {
  const room = getRoomByCode(req.params.code);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  try {
    const body = req.body as JoinRoomRequest;
    joinRoom(room, req.user!.userId, body.displayName || req.user!.displayName);
    res.json({ roomId: room.roomId, playerId: req.user!.userId });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post("/queue/join", requireAuth, async (req: AuthedRequest, res) => {
  const body = req.body as QuickJoinRequest;
  const { room } = quickJoin(req.user!.userId, body.displayName || req.user!.displayName);
  const existing = await prisma.room.findUnique({ where: { id: room.roomId } });
  if (!existing) {
    await prisma.room.create({
      data: { id: room.roomId, code: room.code, maxPlayers: room.maxPlayers, hostUserId: room.hostUserId },
    });
  }
  res.json({ status: "matched", roomId: room.roomId, playerId: req.user!.userId });
});

app.post("/rooms/:roomId/bots", requireAuth, (req: AuthedRequest, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  if (room.hostUserId !== req.user!.userId) return res.status(403).json({ error: "not_host" });
  try {
    const body = req.body as AddBotRequest;
    addBot(room, body.botLevel);
    res.json(toLobbyState(room));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.get("/rooms/:roomId/lobby", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  res.json(toLobbyState(room));
});

app.post("/rooms/:roomId/start", requireAuth, async (req: AuthedRequest, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  if (room.hostUserId !== req.user!.userId) return res.status(403).json({ error: "not_host" });
  if (room.seats.length < 2) return res.status(400).json({ error: "need_at_least_2_players" });

  const hasBots = room.seats.some((s) => s.seatKind === SeatKind.BOT);
  const subscriberUrls = [env.GATEWAY_URL, env.SELF_URL, ...(hasBots ? [env.BOTS_URL] : [])];

  const createReq: EngineCreateGameRequest = {
    roomId: room.roomId,
    players: room.seats.map((s) => ({
      id: s.playerId,
      displayName: s.displayName,
      seatIndex: s.seatIndex,
      seatKind: s.seatKind,
      botLevel: s.botLevel,
    })),
    subscriberUrls,
  };

  const engineRes = await fetch(`${env.ENGINE_URL}/games/${room.roomId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(createReq),
  });
  if (!engineRes.ok) {
    const errBody = await engineRes.json().catch(() => ({}));
    return res.status(400).json({ error: (errBody as any).error ?? "engine_create_failed" });
  }

  for (const seat of room.seats.filter((s) => s.seatKind === SeatKind.BOT)) {
    fetch(`${env.BOTS_URL}/internal/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomId: room.roomId, playerId: seat.playerId, botLevel: seat.botLevel, engineUrl: env.ENGINE_URL }),
    }).catch((err) => console.error("[matchmaking] bot register failed", err.message));
  }

  markStarted(room);
  await prisma.room.update({ where: { id: room.roomId }, data: { status: "PLAYING", startedAt: new Date() } });
  res.json({ ok: true });
});

app.post("/internal/notify", async (req, res) => {
  const payload = req.body as NotifyPayload;
  res.json({ ok: true }); // ack immediately; do the DB work async
  if (payload.reason !== "GAME_OVER") return;
  try {
    const summaryRes = await fetch(`${env.ENGINE_URL}/games/${payload.roomId}/summary`);
    if (!summaryRes.ok) return;
    const summary = (await summaryRes.json()) as {
      roomId: string;
      winner: { faction: string } | null;
      players: { id: string; seatIndex: number; seatKind: string; botLevel?: string; baseRole: string | null; personaId: string | null; status: string }[];
    };
    const room = await prisma.room.findUnique({ where: { id: payload.roomId } });
    if (!room || room.status === "FINISHED") return;

    const winnerFaction = summary.winner?.faction ?? null;
    const match = await prisma.matchHistory.create({
      data: {
        roomId: payload.roomId,
        winnerFaction,
        startedAt: room.startedAt ?? room.createdAt,
        endedAt: new Date(),
      },
    });

    for (const p of summary.players) {
      const isBot = p.seatKind === "BOT";
      const won =
        winnerFaction === "WHITEHAT_INSPECTOR"
          ? p.baseRole === "WHITEHAT" || p.baseRole === "INSPECTOR"
          : winnerFaction === "BLACKHAT"
            ? p.baseRole === "BLACKHAT"
            : winnerFaction === "INSIDER"
              ? p.baseRole === "INSIDER"
              : false;

      await prisma.matchParticipant.create({
        data: {
          matchId: match.id,
          userId: isBot ? null : p.id,
          seatIndex: p.seatIndex,
          seatKind: p.seatKind,
          botLevel: p.botLevel ?? null,
          baseRole: p.baseRole,
          personaId: p.personaId,
          result: won ? "WIN" : "LOSS",
        },
      });

      if (!isBot) {
        await prisma.userStats.upsert({
          where: { userId: p.id },
          update: { gamesPlayed: { increment: 1 }, wins: { increment: won ? 1 : 0 }, losses: { increment: won ? 0 : 1 } },
          create: { userId: p.id, gamesPlayed: 1, wins: won ? 1 : 0, losses: won ? 0 : 1 },
        });
      }
    }

    await prisma.room.update({ where: { id: payload.roomId }, data: { status: "FINISHED", endedAt: new Date() } });
  } catch (err) {
    console.error("[matchmaking] failed to record match history", err);
  }
});

app.listen(env.PORT, () => console.log(`[matchmaking] listening on :${env.PORT}`));
