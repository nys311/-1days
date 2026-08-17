import { BaseRoleId, GameState, PlayerState, PlayerStatus } from "@minus1days/shared";
import { applyLovelaceOnDamage } from "./abilities";
import { checkWinConditions } from "./win";
import { toUsedPile } from "./util";

/**
 * Applies HP loss to a player and, if it brings them to 0, runs the full defeat cascade:
 * base-role reveal, the Audit special-case (Inspector gains/loses cards), or the normal
 * reward transfer (direct killer takes everything) vs. a no-claimant discard (queued/decrypt kill).
 */
export function applyDamageToPlayer(
  state: GameState,
  target: PlayerState,
  amount: number,
  opts: { killerId: string | null; direct: boolean },
  log: (m: string) => void
) {
  if (target.status !== PlayerStatus.ALIVE) return;
  target.hp = Math.max(0, target.hp - amount);
  log(`${target.displayName} mất ${amount} Máu (còn ${target.hp}).`);
  applyLovelaceOnDamage(state, target, log);

  if (target.hp > 0) return;

  target.status = PlayerStatus.DOWN;
  target.baseRoleRevealed = true;
  log(`${target.displayName} đã bị hạ gục (404)! Base-role: ${target.baseRole}.`);

  if (target.isAudit) {
    const inspector = state.players.find((p) => p.baseRole === BaseRoleId.INSPECTOR);
    target.isAudit = false;
    if (inspector) {
      if (target.baseRole === BaseRoleId.WHITEHAT) {
        inspector.hand.forEach((c) => toUsedPile(state, c));
        inspector.hand = [];
        log(`${target.displayName} là White Hat khi bị Audit — INSPECTOR mất toàn bộ bài trên tay.`);
      } else {
        transferAllCards(target, inspector);
        log(`${target.displayName} là ${target.baseRole} khi bị Audit — INSPECTOR chiếm toàn bộ bài của họ.`);
      }
    }
  } else if (opts.direct && opts.killerId) {
    const killer = state.players.find((p) => p.id === opts.killerId);
    if (killer && killer.id !== target.id) {
      transferAllCards(target, killer);
      log(`${killer.displayName} hạ gục trực tiếp và chiếm toàn bộ bài của ${target.displayName}.`);
    } else {
      discardAllCards(state, target);
    }
  } else {
    discardAllCards(state, target);
    log(`Bài của ${target.displayName} được thu hồi về chồng bài used.`);
  }

  const winner = checkWinConditions(state);
  if (winner) state.winner = winner;
}

function transferAllCards(from: PlayerState, to: PlayerState) {
  to.defeatedBaseRoles.push({ name: from.displayName, baseRole: from.baseRole as BaseRoleId }, ...from.defeatedBaseRoles);
  to.hand.push(...from.hand.map((c) => ({ ...c, ownerId: to.id })));
  to.kitZone.push(...from.kitZone.map((c) => ({ ...c, ownerId: to.id })));
  from.hand = [];
  from.payloadZone = [];
  from.kitZone = [];
}

function discardAllCards(state: GameState, player: PlayerState) {
  player.hand.forEach((c) => toUsedPile(state, c));
  player.payloadZone.forEach((c) => toUsedPile(state, c));
  player.kitZone.forEach((c) => toUsedPile(state, c));
  player.hand = [];
  player.payloadZone = [];
  player.kitZone = [];
}
