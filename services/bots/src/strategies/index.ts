import { BotLevel } from "@minus1days/shared";
import { AlphaBetaBot } from "./alphaBeta";
import { RandomBot } from "./random";
import { RuleBot } from "./rule";
import { BotStrategy } from "./types";

export const STRATEGIES: Record<BotLevel, BotStrategy> = {
  [BotLevel.RANDOM]: RandomBot,
  [BotLevel.RULE]: RuleBot,
  [BotLevel.ALPHA_BETA]: AlphaBetaBot,
};
