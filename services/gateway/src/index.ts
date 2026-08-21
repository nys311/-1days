import cors from "cors";
import express from "express";
import { createServer } from "http";
import fetch from "node-fetch";
import { Server, Socket } from "socket.io";
import { AppTokenPayload, ErrorPayload, NotifyPayload, SOCKET_EVENTS } from "@minus1days/shared";
import { verifyAppToken } from "@minus1days/shared/dist/cjs/auth";
import { attachSocketToRoom, detachSocket, getConn, getSocketsForRoom } from "./connections";
import { env } from "./env";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true, service: "gateway" }));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: env.CORS_ORIGIN } });

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("missing_token"));
  try {
    const user = verifyAppToken(token, env.JWT_SECRET);
    (socket.data as { user: AppTokenPayload }).user = user;
    next();
  } catch {
    next(new Error("invalid_token"));
  }
});

function sendError(socket: Socket, code: string, message: string) {
  const payload: ErrorPayload = { code, message };
  socket.emit(SOCKET_EVENTS.ERROR, payload);
}

async function forwardJson(path: string, base: string, token: string, method: string, body?: unknown) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error ?? `request_failed_${res.status}`);
  return json as any;
}

async function pushLobbyState(roomId: string): Promise<{ started: boolean } | null> {
  try {
    const lobby = (await fetch(`${env.MATCHMAKING_URL}/rooms/${roomId}/lobby`).then((r) => r.json())) as { started: boolean };
    for (const socketId of getSocketsForRoom(roomId)) {
      io.to(socketId).emit(SOCKET_EVENTS.LOBBY_STATE, lobby);
    }
    return lobby;
  } catch (err) {
    console.error("[gateway] pushLobbyState failed", err);
    return null;
  }
}

async function pushGameStateTo(socketId: string, roomId: string, playerId: string) {
  try {
    const view = await fetch(`${env.ENGINE_URL}/games/${roomId}/view/${playerId}`).then((r) => r.json());
    io.to(socketId).emit(SOCKET_EVENTS.GAME_STATE, view);
  } catch (err) {
    console.error("[gateway] pushGameStateTo failed for", playerId, err);
  }
}

async function pushGameState(roomId: string) {
  for (const socketId of getSocketsForRoom(roomId)) {
    const conn = getConn(socketId);
    if (!conn) continue;
    await pushGameStateTo(socketId, roomId, conn.playerId);
  }
}

app.post("/internal/notify", (req, res) => {
  const payload = req.body as NotifyPayload;
  res.json({ ok: true });
  if (payload.reason === "GAME_STATE" || payload.reason === "GAME_STARTED" || payload.reason === "GAME_OVER") {
    pushGameState(payload.roomId);
  }
});

io.on("connection", (socket: Socket) => {
  const user = (socket.data as { user: AppTokenPayload }).user;
  const token = socket.handshake.auth.token as string;

  socket.on(SOCKET_EVENTS.QUICK_JOIN, async (payload: { displayName?: string }, ack?: (res: unknown) => void) => {
    try {
      const result = await forwardJson("/queue/join", env.MATCHMAKING_URL, token, "POST", {
        displayName: payload?.displayName || user.displayName,
      });
      attachSocketToRoom(socket.id, result.roomId, result.playerId);
      socket.join(`room:${result.roomId}`);
      const lobby = await pushLobbyState(result.roomId);
      if (lobby?.started) await pushGameStateTo(socket.id, result.roomId, result.playerId);
      ack?.(result);
    } catch (err) {
      sendError(socket, "quick_join_failed", (err as Error).message);
      ack?.(undefined);
    }
  });

  socket.on(SOCKET_EVENTS.CREATE_ROOM, async (payload: { displayName?: string; maxPlayers: number }, ack?: (res: unknown) => void) => {
    try {
      const result = await forwardJson("/rooms", env.MATCHMAKING_URL, token, "POST", {
        displayName: payload?.displayName || user.displayName,
        maxPlayers: payload.maxPlayers,
      });
      attachSocketToRoom(socket.id, result.roomId, result.playerId);
      socket.join(`room:${result.roomId}`);
      await pushLobbyState(result.roomId);
      ack?.(result);
    } catch (err) {
      sendError(socket, "create_room_failed", (err as Error).message);
      ack?.(undefined);
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, async (payload: { displayName?: string; code: string }, ack?: (res: unknown) => void) => {
    try {
      const result = await forwardJson(`/rooms/${payload.code}/join`, env.MATCHMAKING_URL, token, "POST", {
        displayName: payload?.displayName || user.displayName,
      });
      attachSocketToRoom(socket.id, result.roomId, result.playerId);
      socket.join(`room:${result.roomId}`);
      const lobby = await pushLobbyState(result.roomId);
      // Rejoining a room that already started (e.g. after a disconnect) — the lobby screen has
      // no way to progress from here, so hand the socket the live game state directly.
      if (lobby?.started) await pushGameStateTo(socket.id, result.roomId, result.playerId);
      ack?.(result);
    } catch (err) {
      sendError(socket, "join_room_failed", (err as Error).message);
      ack?.(undefined);
    }
  });

  socket.on(SOCKET_EVENTS.ADD_BOT, async (payload: { roomId: string; botLevel: string }) => {
    try {
      await forwardJson(`/rooms/${payload.roomId}/bots`, env.MATCHMAKING_URL, token, "POST", { botLevel: payload.botLevel });
      await pushLobbyState(payload.roomId);
    } catch (err) {
      sendError(socket, "add_bot_failed", (err as Error).message);
    }
  });

  socket.on(SOCKET_EVENTS.START_GAME, async (payload: { roomId: string }) => {
    try {
      await forwardJson(`/rooms/${payload.roomId}/start`, env.MATCHMAKING_URL, token, "POST", {});
      await pushLobbyState(payload.roomId);
      await pushGameState(payload.roomId);
    } catch (err) {
      sendError(socket, "start_failed", (err as Error).message);
    }
  });

  socket.on(SOCKET_EVENTS.GAME_ACTION, async (payload: { roomId: string; action: unknown }) => {
    const conn = getConn(socket.id);
    if (!conn || conn.roomId !== payload.roomId) return sendError(socket, "not_in_room", "Bạn chưa ở trong bàn này.");
    try {
      await fetch(`${env.ENGINE_URL}/games/${payload.roomId}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ playerId: conn.playerId, action: payload.action }),
      }).then(async (r) => {
        const json = (await r.json()) as { ok: boolean; error?: string };
        if (!r.ok || !json.ok) throw new Error(json.error ?? "action_failed");
      });
    } catch (err) {
      sendError(socket, "action_failed", (err as Error).message);
    }
  });

  socket.on("disconnect", () => {
    detachSocket(socket.id);
  });
});

httpServer.listen(env.PORT, () => console.log(`[gateway] listening on :${env.PORT}`));
