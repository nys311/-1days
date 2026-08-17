import { GameAction } from "./actions";
import {
  BaseRoleId,
  BotLevel,
  CardFace,
  CardLocation,
  CardType,
  DefeatedBaseRoleEntry,
  PersonaId,
  PlayerStatus,
  SeatKind,
  Winner,
} from "./types";

/** A card as seen by ONE viewer: defId is null when hidden from them (see visibility rules in DESIGN.md). */
export interface VisibleCard {
  instanceId: string;
  defId: string | null;
  revealedType: CardType | null; // coarse type, visible on the face-down "outer face" even when defId is hidden
  face: CardFace;
  location: CardLocation;
  ownerId?: string | null;
}

export interface VisiblePlayer {
  id: string;
  displayName: string;
  seatIndex: number;
  seatKind: SeatKind;
  botLevel?: BotLevel;
  baseRole: BaseRoleId | null; // null if hidden (not revealed and not you)
  baseRoleRevealed: boolean;
  personaId: PersonaId | null; // personas are always public
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  techLevel: number;
  status: PlayerStatus;
  isAudit: boolean;
  defeatedBaseRoles: DefeatedBaseRoleEntry[];
  handCount: number; // always the count; card identities only for `you`
  hand: VisibleCard[]; // full identities if this is `you`, otherwise empty
  payloadZone: VisibleCard[];
  kitZone: VisibleCard[];
  connected: boolean;
}

export interface PlayerView {
  roomId: string;
  you: string; // your player id
  round: number;
  phase: string;
  currentPlayerId: string | null;
  players: VisiblePlayer[];
  server: { hp: number; maxHp: number; zone: VisibleCard[] };
  kern: { remaining: number; claimed: VisibleCard[] };
  drawPileCount: number;
  usedPileCount: number;
  pendingReaction:
    | {
        id: string;
        kind: "SERVER_ATTACK" | "KERN_ATTACK" | "PLAYER_ATTACK";
        attackerId: string;
        targetId: string | null;
        deadlineMs: number;
      }
    | null;
  winner: Winner;
  log: string[];
  legalActionHint: string[]; // human-readable hints for the UI action bar
}

// ---------- Engine service REST contract ----------

export interface EngineCreateGameRequestPlayer {
  id: string;
  displayName: string;
  seatIndex: number;
  seatKind: SeatKind;
  botLevel?: BotLevel;
}

export interface EngineCreateGameRequest {
  roomId: string;
  players: EngineCreateGameRequestPlayer[];
  subscriberUrls: string[]; // webhook base URLs notified on every state change
}

export interface EngineActionRequest {
  playerId: string;
  action: GameAction;
}

export interface EngineActionResponse {
  ok: boolean;
  error?: string;
}

// ---------- Matchmaking service REST contract ----------

export interface CreateRoomRequest {
  displayName: string;
  maxPlayers: number; // 2-8, cap on the room
}

export interface CreateRoomResponse {
  roomId: string;
  code: string;
  playerId: string;
}

export interface JoinRoomRequest {
  displayName: string;
}

export interface JoinRoomResponse {
  roomId: string;
  playerId: string;
}

export interface QuickJoinRequest {
  displayName: string;
}

export interface QuickJoinResponse {
  status: "queued" | "matched";
  roomId?: string;
  playerId?: string;
}

export interface AddBotRequest {
  botLevel: BotLevel;
}

export interface LobbyStateSeat {
  playerId: string;
  displayName: string;
  seatIndex: number;
  seatKind: SeatKind;
  botLevel?: BotLevel;
  isHost: boolean;
  connected: boolean;
}

export interface LobbyState {
  roomId: string;
  code: string;
  maxPlayers: number;
  seats: LobbyStateSeat[];
  started: boolean;
}

// ---------- Cross-service webhook ping ----------

/** Fire-and-forget notification: "something changed in this room, go pull the latest view." */
export interface NotifyPayload {
  roomId: string;
  reason: "LOBBY_UPDATE" | "GAME_STATE" | "GAME_STARTED" | "GAME_OVER";
}

// ---------- Bots service registration ----------

export interface RegisterBotSeatRequest {
  roomId: string;
  playerId: string;
  botLevel: BotLevel;
  engineUrl: string;
}

// ---------- Socket.IO event contract (client <-> gateway) ----------

export const SOCKET_EVENTS = {
  QUICK_JOIN: "lobby:quickJoin",
  CREATE_ROOM: "lobby:createRoom",
  JOIN_ROOM: "lobby:joinRoom",
  ADD_BOT: "lobby:addBot",
  START_GAME: "lobby:start",
  LOBBY_STATE: "lobby:state",
  GAME_ACTION: "game:action",
  GAME_STATE: "game:state",
  ERROR: "error",
} as const;

export interface ErrorPayload {
  code: string;
  message: string;
}
