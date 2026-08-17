import { GameAction, PlayerView } from "@minus1days/shared";

export interface BotStrategy {
  /** Decide what to do given the bot's own (fully-visible) player view. Return null to pass/end-phase. */
  decideTurnAction(view: PlayerView, myPlayerId: string): GameAction | null;
  /** Decide whether to react to an open pending reaction (may return null to let it time out). */
  decideReaction(view: PlayerView, myPlayerId: string): GameAction | null;
}
