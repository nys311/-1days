import { ActionSubtype } from "@minus1days/shared";
import { handCardsOfSubtype, me, otherAlivePlayers } from "./helpers";
import { BotStrategy } from "./types";

function strongestAttack(hand: ReturnType<typeof handCardsOfSubtype>) {
  return hand
    .slice()
    .sort((a, b) => Number(b.defId?.split("_")[1] ?? 0) - Number(a.defId?.split("_")[1] ?? 0))[0];
}

/** Simple heuristic bot: attacks the weakest alive opponent with its strongest card, upgrades when idle. */
export const RuleBot: BotStrategy = {
  decideTurnAction(view, myPlayerId) {
    const my = me(view, myPlayerId);

    if (view.phase === "PREPARE") {
      const upgrade = my.hand.find((c) => c.defId === "UPGRADE" || c.defId === "ENERGY_DRINK");
      if (upgrade && my.energy > 0) {
        return { type: "PREPARE_SELF", cardInstanceId: upgrade.instanceId! };
      }
      return { type: "END_PHASE" };
    }

    if (view.phase === "ACTION") {
      const attacks = handCardsOfSubtype(my.hand, ActionSubtype.ATTACK);
      const targets = otherAlivePlayers(view, myPlayerId).sort((a, b) => a.hp - b.hp);

      // SERVER and THE KERN are the same target — every unblocked hit against it also cracks a
      // loot card loose, which is Black Hat's actual win condition, so go after it often.
      if (my.baseRole === "BLACKHAT" && attacks.length > 0 && my.energy > 0 && view.server.lootRemaining > 0 && Math.random() < 0.5) {
        return {
          type: "PLAY_CARD",
          cardInstanceId: strongestAttack(attacks).instanceId!,
          faceUp: true,
          target: { kind: "SERVER" },
        };
      }

      if (attacks.length > 0 && my.energy > 0 && targets.length > 0) {
        const best = strongestAttack(attacks);
        return {
          type: "PLAY_CARD",
          cardInstanceId: best.instanceId!,
          faceUp: true,
          target: { kind: "PLAYER", playerId: targets[0].id },
        };
      }
      const upgrade = my.hand.find((c) => c.defId === "UPGRADE" || c.defId === "ENERGY_DRINK");
      if (upgrade && my.energy > 0) {
        return { type: "PLAY_CARD", cardInstanceId: upgrade.instanceId!, faceUp: true, target: { kind: "SELF" } };
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
    if (reaction.kind === "SERVER_ATTACK" && denies.length > 0) {
      return { type: "REACT_DENY", reactionId: reaction.id, cardInstanceId: denies[0].instanceId! };
    }
    return null;
  },
};
