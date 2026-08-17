// Discriminated union of every action a client (human or bot) can submit to the Engine service.
// Kept as plain data (ids + choices) — carries no rendering concerns.

export interface DrawBooleExchangeAction {
  type: "DRAW_BOOLE_EXCHANGE";
  give: "TWO_DEFEND_FOR_ATTACK" | "TWO_ATTACK_FOR_DEFEND";
  cardInstanceIds: [string, string]; // the 2 cards given up
}

export interface PrepareSelfAction {
  type: "PREPARE_SELF"; // Chuan bi: play a card against yourself only
  cardInstanceId: string;
}

export interface TuringPeekAction {
  type: "TURING_PEEK";
  cardInstanceId: string; // own face-down card in own payload zone
}

export type PlayTarget =
  | { kind: "SELF" }
  | { kind: "PLAYER"; playerId: string }
  | { kind: "SERVER" }
  | { kind: "KERN" };

export interface PlayCardAction {
  type: "PLAY_CARD"; // Hanh dong: main action phase play
  cardInstanceId: string;
  faceUp: boolean;
  target: PlayTarget;
  /** Only for RANSOMWARE/ZERODAY: the specific card elsewhere on the table being destroyed/stolen. */
  targetCardInstanceId?: string;
}

export interface ReactDefendAction {
  type: "REACT_DEFEND";
  reactionId: string;
  cardInstanceId: string;
}

export interface ReactDenyAction {
  type: "REACT_DENY";
  reactionId: string;
  cardInstanceId: string;
}

export interface GiftCardAction {
  type: "GIFT_CARD";
  cardInstanceId: string;
  targetPlayerId: string;
}

export interface EveTransferAction {
  type: "EVE_TRANSFER"; // -2 HP to move own face-down payload card to another player
  cardInstanceId: string;
  targetPlayerId: string;
}

export interface InspectorAuditAction {
  type: "INSPECTOR_AUDIT";
  targetPlayerId: string;
}

export interface KernCoerceChoiceAction {
  type: "KERN_COERCE_CHOICE"; // resolving a claimed "Dan chu" card
  targetPlayerId: string;
  choice: "STEAL_TWO" | "FLIP_ONE";
  cardInstanceIds?: string[]; // required for STEAL_TWO (2 ids) or FLIP_ONE (1 id)
}

export interface DiscardAction {
  type: "DISCARD";
  cardInstanceIds: string[];
}

export interface EndPhaseAction {
  type: "END_PHASE";
}

export type GameAction =
  | DrawBooleExchangeAction
  | PrepareSelfAction
  | TuringPeekAction
  | PlayCardAction
  | ReactDefendAction
  | ReactDenyAction
  | GiftCardAction
  | EveTransferAction
  | InspectorAuditAction
  | KernCoerceChoiceAction
  | DiscardAction
  | EndPhaseAction;
