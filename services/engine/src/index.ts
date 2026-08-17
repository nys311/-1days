import cors from "cors";
import express from "express";
import { EngineActionRequest, EngineCreateGameRequest } from "@minus1days/shared";
import { env } from "./env";
import { applyAction } from "./resolve";
import { createInitialState } from "./setup";
import { notifySubscribers } from "./notify";
import { afterMutation, createRoom, getRoom } from "./store";
import { RuleError } from "./util";
import { buildPlayerView } from "./view";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "engine" }));

app.post("/games/:roomId", (req, res) => {
  const body = req.body as EngineCreateGameRequest;
  try {
    const state = createInitialState(req.params.roomId, body.players);
    createRoom(state, body.subscriberUrls ?? []);
    notifySubscribers(body.subscriberUrls ?? [], { roomId: req.params.roomId, reason: "GAME_STARTED" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message });
  }
});

app.post("/games/:roomId/actions", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ ok: false, error: "room_not_found" });
  const body = req.body as EngineActionRequest;
  try {
    applyAction(room.state, body.playerId, body.action);
    afterMutation(req.params.roomId);
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof RuleError ? err.message : "internal_error";
    if (!(err instanceof RuleError)) console.error("[engine] unexpected error", err);
    res.status(400).json({ ok: false, error: message });
  }
});

app.get("/games/:roomId/view/:playerId", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  res.json(buildPlayerView(room.state, req.params.playerId));
});

/** Internal-only: full ground truth (no hidden-info sanitization), used by matchmaking to record match history. */
app.get("/games/:roomId/summary", (req, res) => {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "room_not_found" });
  const { state } = room;
  res.json({
    roomId: state.roomId,
    winner: state.winner,
    players: state.players.map((p) => ({
      id: p.id,
      seatIndex: p.seatIndex,
      seatKind: p.seatKind,
      botLevel: p.botLevel,
      baseRole: p.baseRole,
      personaId: p.personaId,
      status: p.status,
    })),
  });
});

app.listen(env.PORT, () => console.log(`[engine] listening on :${env.PORT}`));
