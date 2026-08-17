import { ActionSubtype, GameAction } from "@minus1days/shared";
import { handCardsOfSubtype, me, otherAlivePlayers } from "./helpers";
import { BotStrategy } from "./types";

export const RandomBot: BotStrategy = {
  decideTurnAction(view, myPlayerId) {
    const my = me(view, myPlayerId);

    if (view.phase === "PREPARE") {
      const defend = handCardsOfSubtype(my.hand, ActionSubtype.DEFEND);
      if (defend.length > 0 && Math.random() < 0.5) {
        return { type: "PREPARE_SELF", cardInstanceId: defend[0].instanceId! };
      }
      return { type: "END_PHASE" };
    }

    if (view.phase === "ACTION") {
      const attacks = handCardsOfSubtype(my.hand, ActionSubtype.ATTACK);
      const targets = otherAlivePlayers(view, myPlayerId);
      if (attacks.length > 0 && my.energy > 0 && targets.length > 0 && Math.random() < 0.6) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        return {
          type: "PLAY_CARD",
          cardInstanceId: attacks[0].instanceId!,
          faceUp: true,
          target: { kind: "PLAYER", playerId: target.id },
        };
      }
      return { type: "END_PHASE" };
    }

    return { type: "END_PHASE" };
  },

  decideReaction(view, myPlayerId) {
    const reaction = view.pendingReaction;
    if (!reaction) return null;
    const my = me(view, myPlayerId);
    const denies = handCardsOfSubtype(my.hand, ActionSubtype.DENY);
    const defends = handCardsOfSubtype(my.hand, ActionSubtype.DEFEND);

    if (reaction.targetId === myPlayerId) {
      if (defends.length > 0 && Math.random() < 0.7) {
        return { type: "REACT_DEFEND", reactionId: reaction.id, cardInstanceId: defends[0].instanceId! } as GameAction;
      }
      if (denies.length > 0 && Math.random() < 0.3) {
        return { type: "REACT_DENY", reactionId: reaction.id, cardInstanceId: denies[0].instanceId! } as GameAction;
      }
      return null;
    }

    if (denies.length > 0 && Math.random() < 0.2) {
      return { type: "REACT_DENY", reactionId: reaction.id, cardInstanceId: denies[0].instanceId! } as GameAction;
    }
    return null;
  },
};
