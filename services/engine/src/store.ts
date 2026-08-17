import { GameState } from "@minus1days/shared";
import { notifySubscribers } from "./notify";
import { resolveReactionNow } from "./reactions";
import { makeLogger } from "./util";

interface RoomEntry {
  state: GameState;
  subscriberUrls: string[];
  reactionTimer: NodeJS.Timeout | null;
}

const rooms = new Map<string, RoomEntry>();

export function createRoom(state: GameState, subscriberUrls: string[]) {
  rooms.set(state.roomId, { state, subscriberUrls, reactionTimer: null });
  scheduleReactionTimeoutIfNeeded(state.roomId);
}

export function getRoom(roomId: string): RoomEntry | undefined {
  return rooms.get(roomId);
}

export function requireRoom(roomId: string): RoomEntry {
  const room = rooms.get(roomId);
  if (!room) throw new Error(`Unknown room: ${roomId}`);
  return room;
}

/** Call after every mutation: (re)schedules the reaction-window timeout and pings subscribers. */
export function afterMutation(roomId: string) {
  const room = requireRoom(roomId);
  if (room.reactionTimer) {
    clearTimeout(room.reactionTimer);
    room.reactionTimer = null;
  }
  scheduleReactionTimeoutIfNeeded(roomId);
  notifySubscribers(room.subscriberUrls, {
    roomId,
    reason: room.state.winner ? "GAME_OVER" : "GAME_STATE",
  });
}

function scheduleReactionTimeoutIfNeeded(roomId: string) {
  const room = requireRoom(roomId);
  const reaction = room.state.pendingReaction;
  if (!reaction) return;
  const delay = Math.max(0, reaction.deadlineMs - Date.now());
  room.reactionTimer = setTimeout(() => {
    const r = rooms.get(roomId);
    if (!r || r.state.pendingReaction?.id !== reaction.id) return;
    resolveReactionNow(r.state, makeLogger(r.state));
    r.reactionTimer = null;
    afterMutation(roomId);
  }, delay);
}
