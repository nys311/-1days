import { BotStrategy } from "./types";
import { RuleBot } from "./rule";

/**
 * Extension point for a minimax/alpha-beta bot. Not implemented yet — this is where a real
 * game-tree search would go (generate legal actions -> simulate -> score -> prune), which needs
 * a pure/cloneable copy of the engine's resolution logic to search over without side effects.
 * Delegates to RuleBot for now so an "Alpha-beta" seat is still playable end-to-end.
 */
export const AlphaBetaBot: BotStrategy = {
  decideTurnAction: RuleBot.decideTurnAction,
  decideReaction: RuleBot.decideReaction,
};
