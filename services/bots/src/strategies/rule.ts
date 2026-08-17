import { ActionSubtype } from "@minus1days/shared";
import { handCardsOfSubtype, me, otherAlivePlayers } from "./helpers";
import { BotStrategy } from "./types";

/** Simple heuristic bot: always defends when it can, attacks the weakest alive opponent, upgrades when idle. */
export const RuleBot: BotStrategy = {
  decideTurnAction(view, myPlayerId) {
    const my = me(view, myPlayerId);

    if (view.phase === "PREPARE") {
      const defend = handCardsOfSubtype(my.hand, ActionSubtype.DEFEND);
      if (defend.length > 0 && my.energy > 0) {
        return { type: "PREPARE_SELF", cardInstanceId: defend[0].instanceId! };
      }
      const upgrade = my.hand.find((c) => c.defId === "UPGRADE" || c.defId === "ENERGY_DRINK");
      if (upgrade && my.energy > 0) {
        return { type: "PREPARE_SELF", cardInstanceId: upgrade.instanceId! };
      }
      return { type: "END_PHASE" };
    }

    if (view.phase === "ACTION") {
      const attacks = handCardsOfSubtype(my.hand, ActionSubtype.ATTACK);
      const targets = otherAlivePlayers(view, myPlayerId).sort((a, b) => a.hp - b.hp);
      if (attacks.length > 0 && my.energy > 0 && targets.length > 0) {
        return {
          type: "PLAY_CARD",
          cardInstanceId: attacks[0].instanceId!,
          faceUp: true,
          target: { kind: "PLAYER", playerId: targets[0].id },
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
    const defends = handCardsOfSubtype(my.hand, ActionSubtype.DEFEND);
    const denies = handCardsOfSubtype(my.hand, ActionSubtype.DENY);

    if (reaction.targetId === myPlayerId && defends.length > 0) {
      return { type: "REACT_DEFEND", reactionId: reaction.id, cardInstanceId: defends[0].instanceId! };
    }
    if ((reaction.kind === "SERVER_ATTACK" || reaction.kind === "KERN_ATTACK") && denies.length > 0) {
      return { type: "REACT_DENY", reactionId: reaction.id, cardInstanceId: denies[0].instanceId! };
    }
    return null;
  },
};
