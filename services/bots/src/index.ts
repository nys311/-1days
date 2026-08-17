import cors from "cors";
import express from "express";
import fetch from "node-fetch";
import { GameAction, NotifyPayload, PlayerView, RegisterBotSeatRequest } from "@minus1days/shared";
import { env } from "./env";
import { getBotsForRoom, registerBot } from "./registry";
import { STRATEGIES } from "./strategies";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "bots" }));

app.post("/internal/register", (req, res) => {
  const body = req.body as RegisterBotSeatRequest;
  registerBot(body);
  res.json({ ok: true });
});

const runningRooms = new Set<string>();
const dirtyRooms = new Set<string>();

app.post("/internal/notify", (req, res) => {
  const payload = req.body as NotifyPayload;
  res.json({ ok: true });
  tick(payload.roomId).catch((err) => console.error("[bots] tick failed", err));
});

async function fetchView(engineUrl: string, roomId: string, playerId: string): Promise<PlayerView> {
  const r = await fetch(`${engineUrl}/games/${roomId}/view/${playerId}`);
  return r.json() as Promise<PlayerView>;
}

async function submitAction(engineUrl: string, roomId: string, playerId: string, action: GameAction) {
  const r = await fetch(`${engineUrl}/games/${roomId}/actions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ playerId, action }),
  });
  const json = (await r.json()) as { ok: boolean; error?: string };
  if (!json.ok) console.warn(`[bots] action rejected for ${playerId}: ${json.error}`);
  return json.ok;
}

async function tick(roomId: string) {
  if (runningRooms.has(roomId)) {
    dirtyRooms.add(roomId);
    return;
  }
  runningRooms.add(roomId);
  try {
    const seats = getBotsForRoom(roomId);
    if (seats.length === 0) return;
    const engineUrl = seats[0].engineUrl;

    for (let guard = 0; guard < 200; guard++) {
      let didSomething = false;
      for (const seat of seats) {
        const view = await fetchView(engineUrl, roomId, seat.playerId);
        if (view.winner) return;
        const strategy = STRATEGIES[seat.botLevel];

        if (view.pendingReaction && view.pendingReaction.attackerId !== seat.playerId) {
          const reactionAction = strategy.decideReaction(view, seat.playerId);
          if (reactionAction) {
            await submitAction(engineUrl, roomId, seat.playerId, reactionAction);
            didSomething = true;
            continue;
          }
        }
        if (view.currentPlayerId === seat.playerId) {
          const action = strategy.decideTurnAction(view, seat.playerId);
          if (action) {
            await submitAction(engineUrl, roomId, seat.playerId, action);
            didSomething = true;
          }
        }
      }
      if (!didSomething) break;
    }
  } finally {
    runningRooms.delete(roomId);
    if (dirtyRooms.has(roomId)) {
      dirtyRooms.delete(roomId);
      tick(roomId).catch((err) => console.error("[bots] re-tick failed", err));
    }
  }
}

app.listen(env.PORT, () => console.log(`[bots] listening on :${env.PORT}`));
