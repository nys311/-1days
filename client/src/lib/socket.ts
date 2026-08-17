import { io, Socket } from "socket.io-client";
import {
  SOCKET_EVENTS,
  type GameAction,
  type LobbyState,
  type PlayerView,
  type ErrorPayload,
  type CreateRoomRequest,
  type CreateRoomResponse,
  type JoinRoomResponse,
  type QuickJoinRequest,
  type QuickJoinResponse,
  type AddBotRequest,
  type BotLevel,
} from "@minus1days/shared";
import { GATEWAY_URL } from "./config";
import { useGameStore } from "../store/useGameStore";

// Thin wrapper around one Socket.IO connection to the gateway. All game/lobby state
// updates flow into the zustand store from here — components never touch the socket
// directly except through the helper functions below.

let socket: Socket | null = null;

function bindStoreListeners(s: Socket) {
  const store = useGameStore.getState;
  s.on("connect", () => store().setSocketConnected(true));
  s.on("disconnect", () => store().setSocketConnected(false));
  s.on(SOCKET_EVENTS.LOBBY_STATE, (state: LobbyState) => store().setLobbyState(state));
  s.on(SOCKET_EVENTS.GAME_STATE, (view: PlayerView) => store().setPlayerView(view));
  s.on(SOCKET_EVENTS.ERROR, (err: ErrorPayload) => store().setError(err));
}

/** Opens (or re-opens) the gateway connection, authenticated with the app session token. */
export function connectSocket(token: string): Socket {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = io(GATEWAY_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  bindStoreListeners(socket);
  return socket;
}

export function disconnectSocket(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  useGameStore.getState().setSocketConnected(false);
}

export function getSocket(): Socket {
  if (!socket) throw new Error("Chưa kết nối tới máy chủ — vui lòng đăng nhập lại.");
  return socket;
}

export function isSocketReady(): boolean {
  return !!socket?.connected;
}

// ---------------------------------------------------------------------------
// Ack-style request helpers.
//
// ASSUMPTION (flagged for backend reconciliation): the gateway acknowledges these
// lobby:* emits via a standard socket.io ack callback carrying the matching
// *Response DTO from shared/src/http.ts. If the gateway instead only communicates
// results via `lobby:state`/`error` broadcasts, this still degrades gracefully —
// the promise just resolves `undefined` after the timeout and the UI keeps working
// off the next `lobby:state` push (the source of truth either way).
// ---------------------------------------------------------------------------

function emitWithAck<Req, Res>(event: string, payload: Req, timeoutMs = 6000): Promise<Res | undefined> {
  return new Promise((resolve) => {
    const s = getSocket();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(undefined);
      }
    }, timeoutMs);
    s.emit(event, payload, (res: Res) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(res);
      }
    });
  });
}

export function quickJoin(req: QuickJoinRequest) {
  return emitWithAck<QuickJoinRequest, QuickJoinResponse>(SOCKET_EVENTS.QUICK_JOIN, req);
}

export function createRoom(req: CreateRoomRequest) {
  return emitWithAck<CreateRoomRequest, CreateRoomResponse>(SOCKET_EVENTS.CREATE_ROOM, req);
}

// ASSUMPTION: shared's `JoinRoomRequest` only carries `displayName` — joining by a
// shareable room code needs the code too, so we extend the payload locally with
// `code`. Reconcile the field name with the gateway implementation.
export interface JoinRoomByCodeRequest {
  code: string;
  displayName: string;
}
export function joinRoom(req: JoinRoomByCodeRequest) {
  return emitWithAck<JoinRoomByCodeRequest, JoinRoomResponse>(SOCKET_EVENTS.JOIN_ROOM, req);
}

// ASSUMPTION: once inside a room, subsequent lobby/game emits carry `roomId`
// explicitly — mirroring the spec's explicit `game:action` shape
// (`{ roomId, action }`) — rather than relying on implicit per-socket room state.
export function addBot(roomId: string, seatIndex: number, botLevel: BotLevel): void {
  getSocket().emit(SOCKET_EVENTS.ADD_BOT, {
    roomId,
    seatIndex,
    botLevel,
  } satisfies { roomId: string; seatIndex: number } & AddBotRequest);
}

export function startGame(roomId: string): void {
  getSocket().emit(SOCKET_EVENTS.START_GAME, { roomId });
}

export function sendAction(roomId: string, action: GameAction): void {
  getSocket().emit(SOCKET_EVENTS.GAME_ACTION, { roomId, action });
}
