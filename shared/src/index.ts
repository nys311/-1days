// NOTE: these are explicit named re-exports, not `export * from "./x"`. TypeScript compiles
// `export *` to a dynamic runtime copy loop, which bundlers that statically analyze CommonJS
// output (Rollup/Vite, used by the client) cannot see through — named re-exports compile to a
// static `Object.defineProperty(exports, "name", ...)` that they can detect. `actions.ts` is
// the only module with zero runtime values (pure types), so it's safe to leave as `export *`.

export type {
  CardDef,
  CardInstance,
  DefeatedBaseRoleEntry,
  PersonaStats,
  PlayerState,
  ServerState,
  Winner,
  PendingReaction,
  GameState,
} from "./types";
export {
  CardType,
  ActionSubtype,
  KitSubtype,
  BaseRoleId,
  PersonaId,
  PlayerStatus,
  CardFace,
  CardLocation,
  RoundPhase,
  ServerCheckStep,
  SeatKind,
  BotLevel,
} from "./types";

export { CARD_CATALOG, PERSONA_CATALOG, DRAW_PILE_COMPOSITION, KERN_STACK_DEF_IDS, getCardDef } from "./cards";

export { BASE_ROLE_DISTRIBUTION, NON_INSPECTOR_PERSONAS, getBaseRoleDistribution } from "./roles";

export * from "./actions";

export type {
  VisibleCard,
  VisiblePlayer,
  PlayerView,
  EngineCreateGameRequestPlayer,
  EngineCreateGameRequest,
  EngineActionRequest,
  EngineActionResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  QuickJoinRequest,
  QuickJoinResponse,
  AddBotRequest,
  LobbyStateSeat,
  LobbyState,
  NotifyPayload,
  RegisterBotSeatRequest,
  ErrorPayload,
} from "./http";
export { SOCKET_EVENTS } from "./http";

// `AppTokenPayload` is type-only (erased at compile time) so it's safe to re-export here.
// `signAppToken`/`verifyAppToken` pull in the Node-only `jsonwebtoken` package at runtime —
// deliberately NOT re-exported here so the client's barrel import never bundles it. Backend
// services import them from the "@minus1days/shared/auth" subpath instead (see package.json exports).
export type { AppTokenPayload } from "./auth";
