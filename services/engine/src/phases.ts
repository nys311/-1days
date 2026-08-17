import { ActionSubtype, BaseRoleId, CardLocation, GameState, PersonaId, PlayerState, PlayerStatus, RoundPhase, ServerCheckStep, getCardDef } from "@minus1days/shared";
import { effectiveSubtypeForDecrypt } from "./abilities";
import { computeTurnOrder } from "./setup";
import { drawCards, shuffle } from "./deck";
import { applyDamageToPlayer } from "./defeat";
import { checkWinConditions } from "./win";
import { getPlayer, toUsedPile } from "./util";

const PLAYER_PHASE_SEQUENCE: RoundPhase[] = [
  RoundPhase.DRAW,
  RoundPhase.PREPARE,
  RoundPhase.DECRYPT,
  RoundPhase.AUDIT_RECLAIM,
  RoundPhase.ACTION,
  RoundPhase.REWARD,
  RoundPhase.DISCARD,
  RoundPhase.END_TURN,
];

export function currentPlayer(state: GameState): PlayerState {
  return getPlayer(state, state.currentPlayerId);
}

/** Begins a player's turn: reset energy, enter DRAW, and run its automatic effect. */
export function startTurn(state: GameState, log: (m: string) => void) {
  const player = currentPlayer(state);
  player.energy = player.maxEnergy;
  state.phase = RoundPhase.DRAW;
  runPhaseEntry(state, player, log);
}

/** Moves the current player to the next phase in sequence, running that phase's automatic effect. */
export function advancePhase(state: GameState, log: (m: string) => void) {
  const player = currentPlayer(state);
  const isInspector = player.baseRole === BaseRoleId.INSPECTOR;
  let seq = PLAYER_PHASE_SEQUENCE;
  if (!isInspector) seq = seq.filter((p) => p !== RoundPhase.AUDIT_RECLAIM);

  const idx = seq.indexOf(state.phase as RoundPhase);
  const next = seq[idx + 1];
  if (!next) return; // already past END_TURN, nothing to do
  state.phase = next;
  runPhaseEntry(state, player, log);
}

function runPhaseEntry(state: GameState, player: PlayerState, log: (m: string) => void) {
  switch (state.phase) {
    case RoundPhase.DRAW: {
      if (player.hand.length < player.maxEnergy) {
        const drawn = drawCards(state.drawPile, state.usedPile, 2);
        drawn.forEach((c) => {
          c.location = CardLocation.HAND;
          c.ownerId = player.id;
        });
        player.hand.push(...drawn);
        log(`${player.displayName} bốc ${drawn.length} lá.`);
      }
      if (player.personaId !== PersonaId.BOOLE) advancePhase(state, log);
      return;
    }
    case RoundPhase.PREPARE:
      return; // waits for PREPARE_SELF actions + END_PHASE
    case RoundPhase.DECRYPT:
      resolveDecrypt(state, player, log);
      advancePhase(state, log);
      return;
    case RoundPhase.AUDIT_RECLAIM: {
      const audited = state.players.find((p) => p.isAudit);
      if (audited) {
        audited.isAudit = false;
        state.lastAuditTargetId = audited.id;
        log(`INSPECTOR thu hồi Audit khỏi ${audited.displayName}.`);
      } else {
        state.lastAuditTargetId = null;
      }
      advancePhase(state, log);
      return;
    }
    case RoundPhase.ACTION:
      return; // waits for PLAY_CARD / reactions / INSPECTOR_AUDIT / etc. + END_PHASE
    case RoundPhase.REWARD:
      advancePhase(state, log); // rewards are already granted at kill-time
      return;
    case RoundPhase.DISCARD:
      return; // waits for optional DISCARD + END_PHASE
    case RoundPhase.END_TURN:
      endTurn(state, log);
      return;
    default:
      return;
  }
}

function resolveDecrypt(state: GameState, player: PlayerState, log: (m: string) => void) {
  if (player.payloadZone.length === 0) return;
  let attackTotal = 0;
  let defendTotal = 0;
  for (const card of player.payloadZone) {
    const def = getCardDef(card.defId);
    const eff = effectiveSubtypeForDecrypt(player.personaId, def.subtype as ActionSubtype);
    const value = eff.valueOverride ?? def.value ?? 1;
    if (eff.subtype === ActionSubtype.ATTACK) {
      attackTotal += value > player.techLevel ? value : 0;
    } else if (eff.subtype === ActionSubtype.DEFEND) {
      defendTotal += value;
    }
  }
  log(`${player.displayName} GIẢI MÃ: tấn công hiệu lực ${attackTotal} vs phòng thủ ${defendTotal}.`);
  if (defendTotal < attackTotal) {
    applyDamageToPlayer(state, player, 1, { killerId: null, direct: false }, log);
  } else {
    log(`${player.displayName} không mất Máu.`);
  }
  player.payloadZone.forEach((c) => toUsedPile(state, c));
  player.payloadZone = [];
}

function endTurn(state: GameState, log: (m: string) => void) {
  if (state.winner) return;
  const idx = state.turnOrder.indexOf(state.currentPlayerId);
  const isLastOfRound = idx === state.turnOrder.length - 1;
  if (!isLastOfRound) {
    state.currentPlayerId = state.turnOrder[idx + 1];
    startTurn(state, log);
    return;
  }
  runServerCheck(state, log);
  if (state.winner) return;
  state.round += 1;
  state.turnOrder = computeTurnOrder(state.players).map((p) => p.id);
  if (state.turnOrder.length === 0) return;
  state.currentPlayerId = state.turnOrder[0];
  startTurn(state, log);
}

export function resetServerAfterDefeat(state: GameState, log: (m: string) => void) {
  state.server.hp = state.server.maxHp;
  state.players.forEach((p) => {
    if (p.status !== PlayerStatus.ALIVE) return;
    const drawn = drawCards(state.drawPile, state.usedPile, 2);
    drawn.forEach((c) => {
      c.location = CardLocation.HAND;
      c.ownerId = p.id;
    });
    p.hand.push(...drawn);
  });
  log("SERVER được hồi đầy Máu, mọi người +2 lá.");
}

function runServerCheck(state: GameState, log: (m: string) => void) {
  state.phase = ServerCheckStep.SHUFFLE_PAYLOAD;
  state.server.zone = shuffle(state.server.zone);

  state.phase = ServerCheckStep.DECRYPT;
  const hasDeny = state.server.zone.some((c) => getCardDef(c.defId).subtype === ActionSubtype.DENY);
  if (state.server.zone.length > 0) {
    if (hasDeny) {
      log("SERVER CHECK: có lá Rút điện — toàn bộ tấn công bị vô hiệu.");
    } else {
      const attackCount = state.server.zone.filter((c) => getCardDef(c.defId).subtype === ActionSubtype.ATTACK).length;
      const defendCount = state.server.zone.filter((c) => getCardDef(c.defId).subtype === ActionSubtype.DEFEND).length;
      const dmg = Math.max(attackCount - defendCount, 0);
      if (dmg > 0) {
        state.server.hp = Math.max(0, state.server.hp - dmg);
        log(`SERVER CHECK: SERVER mất ${dmg} Máu (còn ${state.server.hp}).`);
      }
    }
    state.server.zone.forEach((c) => toUsedPile(state, c));
    state.server.zone = [];
    if (state.server.hp <= 0) resetServerAfterDefeat(state, log);
  }

  state.phase = ServerCheckStep.UPGRADE;
  // Kit (upgrade) cards equip immediately when played — nothing pending to equip here.

  const winner = checkWinConditions(state);
  if (winner) state.winner = winner;
}
