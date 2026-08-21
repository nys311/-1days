import { v4 as uuid } from "uuid";
import { ActionSubtype, CardInstance, CardLocation, GameState, PendingReaction, PlayerStatus, getCardDef } from "@minus1days/shared";
import { faceUpAttackDamage } from "./abilities";
import { applyDamageToPlayer } from "./defeat";
import { claimTopKernCard } from "./kern";
import { drawCards } from "./deck";
import { RuleError, findInZone, getPlayer, removeFromZone, toUsedPile } from "./util";

const pendingAttackCards = new Map<string, CardInstance>();

export function createReaction(
  state: GameState,
  opts: {
    kind: PendingReaction["kind"];
    attackerId: string;
    targetId: string | null;
    attackCard: CardInstance;
    totalAttackValue: number;
    allowDefend: boolean;
    windowMs: number;
  }
): PendingReaction {
  if (state.pendingReaction) throw new RuleError("Đang có 1 tấn công khác chờ phản ứng, vui lòng đợi.");
  const reaction: PendingReaction = {
    id: uuid(),
    kind: opts.kind,
    attackerId: opts.attackerId,
    targetId: opts.targetId,
    attackCardInstanceId: opts.attackCard.instanceId,
    attackDefId: opts.attackCard.defId,
    totalAttackValue: opts.totalAttackValue,
    allowDefend: opts.allowDefend,
    deadlineMs: Date.now() + opts.windowMs,
    defendTotal: 0,
    denied: false,
  };
  state.pendingReaction = reaction;
  pendingAttackCards.set(reaction.id, opts.attackCard);
  return reaction;
}

export function addDenyResponse(state: GameState, playerId: string, cardInstanceId: string, log: (m: string) => void) {
  const reaction = state.pendingReaction;
  if (!reaction) throw new RuleError("Không có tấn công nào đang chờ phản ứng.");
  const player = getPlayer(state, playerId);
  const card = findInZone(player.hand, cardInstanceId);
  const def = getCardDef(card.defId);
  if (def.subtype !== ActionSubtype.DENY) throw new RuleError("Lá bài không phải Rút điện.");
  removeFromZone(player.hand, cardInstanceId);
  toUsedPile(state, card);
  reaction.denied = true;
  log(`${player.displayName} dùng Rút điện để chặn tấn công.`);
  resolveReactionNow(state, log);
}

export function addDefendResponse(state: GameState, playerId: string, cardInstanceId: string, log: (m: string) => void) {
  const reaction = state.pendingReaction;
  if (!reaction) throw new RuleError("Không có tấn công nào đang chờ phản ứng.");
  if (!reaction.allowDefend) throw new RuleError("Không thể dùng Phòng thủ để chặn tấn công này.");
  if (reaction.kind === "PLAYER_ATTACK" && reaction.targetId !== playerId) {
    throw new RuleError("Chỉ người bị tấn công mới có thể dùng Phòng thủ.");
  }
  const player = getPlayer(state, playerId);
  const card = findInZone(player.hand, cardInstanceId);
  const def = getCardDef(card.defId);
  if (def.subtype !== ActionSubtype.DEFEND) throw new RuleError("Lá bài không phải Phòng thủ.");
  removeFromZone(player.hand, cardInstanceId);
  toUsedPile(state, card);
  reaction.defendTotal += def.value ?? 1;
  log(`${player.displayName} dùng Phòng thủ (tổng chặn: ${reaction.defendTotal}).`);
  if (reaction.defendTotal >= reaction.totalAttackValue) {
    resolveReactionNow(state, log);
  }
}

/** Called either early (deny played / defend threshold met) or when the reaction window's deadline elapses. */
export function resolveReactionNow(state: GameState, log: (m: string) => void) {
  const reaction = state.pendingReaction;
  if (!reaction) return;
  const attackCard = pendingAttackCards.get(reaction.id);
  pendingAttackCards.delete(reaction.id);
  state.pendingReaction = null;
  if (attackCard) toUsedPile(state, attackCard);

  const blocked = reaction.denied || (reaction.allowDefend && reaction.defendTotal >= reaction.totalAttackValue);
  const attacker = state.players.find((p) => p.id === reaction.attackerId) ?? null;

  if (blocked) {
    log(`Tấn công bị chặn.`);
    return;
  }

  const dmg = faceUpAttackDamage(attacker?.personaId ?? null);

  if (reaction.kind === "PLAYER_ATTACK" && reaction.targetId) {
    const target = getPlayer(state, reaction.targetId);
    applyDamageToPlayer(state, target, dmg, { killerId: reaction.attackerId, direct: true }, log);
  } else if (reaction.kind === "SERVER_ATTACK") {
    state.server.hp = Math.max(0, state.server.hp - dmg);
    log(`SERVER mất ${dmg} Máu (còn ${state.server.hp}).`);
    // SERVER and THE KERN are the same object — every unblocked hit also cracks loose 1 loot
    // card from its hidden Kern cache for the attacker (a FLAG there is Black Hat's real win).
    if (attacker) claimTopKernCard(state, attacker.id, log);
    if (state.server.hp <= 0) {
      state.server.hp = state.server.maxHp;
      state.players.forEach((p) => {
        if (p.status === PlayerStatus.ALIVE) {
          const drawn = drawCards(state.drawPile, state.usedPile, 2);
          drawn.forEach((c) => {
            c.ownerId = p.id;
            c.location = CardLocation.HAND;
          });
          p.hand.push(...drawn);
        }
      });
      log("SERVER được hồi đầy Máu, mọi người +2 lá.");
    }
  }
}
