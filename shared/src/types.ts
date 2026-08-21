// Core enums and types shared by server (rules engine) and client (presentation).
// IMPORTANT: this file carries no art/theme/image fields — those live only in the
// client's theme layer. The server only ever deals in ids + rule data below.

export enum CardType {
  BASE_ROLE = "BASE_ROLE",
  PERSONA = "PERSONA",
  ACTION = "ACTION",
  KIT = "KIT",
  FLAG = "FLAG", // THE KERN win-condition objects
  TOKEN = "TOKEN", // unique non-deck tokens, e.g. the Inspector's physical Audit card
}

export enum ActionSubtype {
  ATTACK = "ATTACK",
  DEFEND = "DEFEND",
  DENY = "DENY", // Rut Dien
  LUCKY = "LUCKY",
  PHISHING = "PHISHING",
  RANSOMWARE = "RANSOMWARE",
  ZERODAY = "ZERODAY",
  BITCOIN = "BITCOIN",
  INCIDENT_RESPONSE = "INCIDENT_RESPONSE",
  // THE KERN special action cards
  KERN_COERCE = "KERN_COERCE", // Dan chu
  KERN_BAD_LUCK = "KERN_BAD_LUCK", // Van xui
  KERN_CAESAR = "KERN_CAESAR", // Quyen nang cua Caesar
}

export enum KitSubtype {
  ENERGY_DRINK = "ENERGY_DRINK", // Bo huc: +1 max energy
  UPGRADE = "UPGRADE", // Nang cap: +1 tech level
  KERN_SUPER_UPGRADE = "KERN_SUPER_UPGRADE", // Sieu nang cap: max tech level
}

export enum BaseRoleId {
  INSPECTOR = "INSPECTOR",
  WHITEHAT = "WHITEHAT",
  BLACKHAT = "BLACKHAT",
  INSIDER = "INSIDER", // "gray" / Gian diep
}

export enum PersonaId {
  INSPECTOR = "INSPECTOR",
  BOB = "BOB",
  ALICE = "ALICE",
  BOOLE = "BOOLE",
  TURING = "TURING",
  LOVELACE = "LOVELACE",
  KEVIN = "KEVIN",
  HELLMAN = "HELLMAN",
  EVE = "EVE",
}

export enum PlayerStatus {
  ALIVE = "ALIVE",
  DOWN = "404",
}

export enum CardFace {
  FACE_DOWN = "FACE_DOWN", // up bai / HTTPS
  FACE_UP = "FACE_UP", // ngua bai / HTTP
}

export enum CardLocation {
  DRAW_PILE = "DRAW_PILE",
  USED_PILE = "USED_PILE",
  HAND = "HAND",
  PAYLOAD_ZONE = "PAYLOAD_ZONE",
  KIT_ZONE = "KIT_ZONE",
  KERN_STACK = "KERN_STACK",
  KERN_CLAIMED = "KERN_CLAIMED",
  SERVER_ZONE = "SERVER_ZONE",
  BASE_ROLE_SLOT = "BASE_ROLE_SLOT",
  PERSONA_SLOT = "PERSONA_SLOT",
  DEFEATED_SHOWCASE = "DEFEATED_SHOWCASE",
}

export enum RoundPhase {
  DRAW = "DRAW", // Boc bai
  PREPARE = "PREPARE", // Chuan bi
  DECRYPT = "DECRYPT", // Giai ma
  AUDIT_RECLAIM = "AUDIT_RECLAIM", // Rut la Audit (Inspector only)
  ACTION = "ACTION", // Hanh dong
  REWARD = "REWARD", // Nhan thuong
  DISCARD = "DISCARD", // Bo bai
  END_TURN = "END_TURN",
}

export enum ServerCheckStep {
  SHUFFLE_PAYLOAD = "SHUFFLE_PAYLOAD",
  DECRYPT = "DECRYPT",
  UPGRADE = "UPGRADE",
}

export enum SeatKind {
  HUMAN = "HUMAN",
  BOT = "BOT",
  EMPTY = "EMPTY",
}

export enum BotLevel {
  RANDOM = "RANDOM",
  RULE = "RULE",
  ALPHA_BETA = "ALPHA_BETA",
}

/** Static rules-data for one card definition in the catalog (no art/copy beyond a short name). */
export interface CardDef {
  id: string; // stable catalog id, e.g. "ATTACK_4"
  type: CardType;
  subtype?: ActionSubtype | KitSubtype;
  name: string; // short name shown on the face (front)
  value?: number; // ATTACK point 1-6, etc.
  description: string; // full rules text, shown only in the click-through modal
}

/** One physical copy of a card in play. */
export interface CardInstance {
  instanceId: string;
  defId: string;
  face: CardFace;
  location: CardLocation;
  ownerId?: string | null; // player id currently holding/owning it, if any
}

export interface DefeatedBaseRoleEntry {
  name: string;
  baseRole: BaseRoleId;
}

export interface PersonaStats {
  id: PersonaId;
  name: string;
  title: string;
  quote: string;
  hp: number;
  energy: number; // max energy
  techLevel: number; // starting tech level
  abilityText: string;
}

export interface PlayerState {
  id: string;
  displayName: string;
  seatIndex: number;
  seatKind: SeatKind;
  botLevel?: BotLevel;
  baseRole: BaseRoleId | null;
  baseRoleRevealed: boolean;
  personaId: PersonaId | null;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  techLevel: number;
  status: PlayerStatus;
  isAudit: boolean;
  defeatedBaseRoles: DefeatedBaseRoleEntry[];
  hand: CardInstance[];
  payloadZone: CardInstance[];
  kitZone: CardInstance[];
  connected: boolean;
}

/**
 * SERVER and THE KERN are the same shared table-center object, not two separate targets —
 * "SERVER" is the mechanical name (HP, queued attacks); "THE KERN" is the hidden loot cache
 * inside it (2 FLAG + 4 special cards). Every unblocked face-up attack against it both damages
 * its HP and cracks one loot card loose for the attacker; drawing a FLAG this way is Black Hat's
 * actual win condition.
 */
export interface ServerState {
  hp: number;
  maxHp: number;
  zone: CardInstance[]; // face-down attack cards queued against it
  lootStack: CardInstance[]; // remaining shuffled Kern cards, index 0 = top
  lootClaimed: CardInstance[];
}

export type Winner =
  | { faction: "WHITEHAT_INSPECTOR"; reason: string }
  | { faction: "BLACKHAT"; reason: string }
  | { faction: "INSIDER"; reason: string }
  | null;

export interface PendingReaction {
  id: string;
  kind: "SERVER_ATTACK" | "PLAYER_ATTACK";
  attackerId: string;
  targetId: string | null; // null for the server/kern
  attackCardInstanceId: string;
  attackDefId: string;
  totalAttackValue: number;
  allowDefend: boolean; // false for SERVER_ATTACK (only DENY can stop it)
  deadlineMs: number; // epoch ms
  defendTotal: number;
  denied: boolean;
}

export interface GameState {
  roomId: string;
  players: PlayerState[];
  currentPlayerId: string; // whose player-phase or inspector-phase it is
  turnOrder: string[]; // player ids for this round, Inspector last if present
  round: number;
  phase: RoundPhase | ServerCheckStep | "LOBBY" | "GAME_OVER";
  server: ServerState;
  drawPile: CardInstance[];
  usedPile: CardInstance[];
  pendingReaction: PendingReaction | null;
  lastAuditTargetId: string | null;
  winner: Winner;
  log: string[];
}
