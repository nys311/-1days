import {
  ActionSubtype,
  BaseRoleId,
  CardFace,
  CardInstance,
  CardLocation,
  CardType,
  GameAction,
  GameState,
  KitSubtype,
  PersonaId,
  PlayerState,
  PlayerStatus,
  RoundPhase,
  getCardDef,
} from "@minus1days/shared";
import { applyHellmanOnGift } from "./abilities";
import { drawCards, makeCard } from "./deck";
import { applyDamageToPlayer } from "./defeat";
import { env } from "./env";
import { advancePhase } from "./phases";
import { addDefendResponse, addDenyResponse, createReaction } from "./reactions";
import { RuleError, findCardAnywhere, findInZone, getPlayer, makeLogger, removeFromZone, requireAlive, requireEnergy, toUsedPile } from "./util";

export function applyAction(state: GameState, playerId: string, action: GameAction) {
  const log = makeLogger(state);

  // Reactions can be played by anyone, anytime a window is open — everything else requires it to be your turn.
  if (action.type === "REACT_DEFEND") return addDefendResponse(state, playerId, action.cardInstanceId, log);
  if (action.type === "REACT_DENY") return addDenyResponse(state, playerId, action.cardInstanceId, log);

  const player = getPlayer(state, playerId);
  requireAlive(player);
  if (state.currentPlayerId !== playerId) throw new RuleError("Chưa đến lượt của bạn.");

  switch (action.type) {
    case "DRAW_BOOLE_EXCHANGE":
      return handleBooleExchange(state, player, action.give, action.cardInstanceIds, log);
    case "PREPARE_SELF":
      if (state.phase !== RoundPhase.PREPARE) throw new RuleError("Không ở pha CHUẨN BỊ.");
      return handleSelfPlay(state, player, action.cardInstanceId, log);
    case "TURING_PEEK":
      return handleTuringPeek(state, player, action.cardInstanceId, log);
    case "PLAY_CARD":
      if (state.phase !== RoundPhase.ACTION) throw new RuleError("Không ở pha HÀNH ĐỘNG.");
      return handlePlayCard(state, player, action, log);
    case "GIFT_CARD":
      return handleGiftCard(state, player, action.cardInstanceId, action.targetPlayerId, log);
    case "EVE_TRANSFER":
      return handleEveTransfer(state, player, action.cardInstanceId, action.targetPlayerId, log);
    case "INSPECTOR_AUDIT":
      return handleInspectorAudit(state, player, action.targetPlayerId, log);
    case "KERN_COERCE_CHOICE":
      return handleKernCoerce(state, player, action, log);
    case "DISCARD":
      return handleDiscard(state, player, action.cardInstanceIds, log);
    case "END_PHASE":
      return advancePhase(state, log);
    default:
      throw new RuleError("Hành động không hợp lệ.");
  }
}

function handleBooleExchange(
  state: GameState,
  player: PlayerState,
  give: "TWO_DEFEND_FOR_ATTACK" | "TWO_ATTACK_FOR_DEFEND",
  ids: [string, string],
  log: (m: string) => void
) {
  if (state.phase !== RoundPhase.DRAW) throw new RuleError("Chỉ dùng ở pha BỐC BÀI.");
  if (player.personaId !== PersonaId.BOOLE) throw new RuleError("Chỉ Boole mới có năng lực này.");
  const wantSubtype = give === "TWO_DEFEND_FOR_ATTACK" ? ActionSubtype.DEFEND : ActionSubtype.ATTACK;
  const giveBack = give === "TWO_DEFEND_FOR_ATTACK" ? "ATTACK" : "DEFEND";
  const cards = ids.map((id) => findInZone(player.hand, id));
  for (const c of cards) {
    if (getCardDef(c.defId).subtype !== wantSubtype) throw new RuleError(`Cả 2 lá phải là ${wantSubtype}.`);
  }
  ids.forEach((id) => toUsedPile(state, removeFromZone(player.hand, id)));
  const newDefId = giveBack === "ATTACK" ? `ATTACK_${1 + Math.floor(Math.random() * 6)}` : "DEFEND";
  const newCard = makeCard(newDefId, CardLocation.HAND, CardFace.FACE_UP);
  newCard.ownerId = player.id;
  player.hand.push(newCard);
  log(`${player.displayName} (Boole) đổi 2 lá ${wantSubtype} lấy 1 lá ${giveBack}.`);
}

function handleTuringPeek(state: GameState, player: PlayerState, cardInstanceId: string, log: (m: string) => void) {
  if (player.personaId !== PersonaId.TURING) throw new RuleError("Chỉ Turing mới có năng lực này.");
  if (state.phase !== RoundPhase.DECRYPT) throw new RuleError("Chỉ dùng ở pha GIẢI MÃ.");
  requireEnergy(player, 1);
  const card = findInZone(player.payloadZone, cardInstanceId);
  const def = getCardDef(card.defId);
  log(`${player.displayName} (Turing) nhìn trộm 1 lá úp: ${def.name}.`);
}

/** Shared by PREPARE_SELF and PLAY_CARD(target=SELF): utility/kit cards resolve identically either way. */
function handleSelfPlay(state: GameState, player: PlayerState, cardInstanceId: string, log: (m: string) => void) {
  requireEnergy(player, 1);
  const card = findInZone(player.hand, cardInstanceId);
  const def = getCardDef(card.defId);
  removeFromZone(player.hand, cardInstanceId);

  if (def.type === CardType.KIT) {
    card.location = CardLocation.KIT_ZONE;
    card.face = CardFace.FACE_UP;
    card.ownerId = player.id;
    player.kitZone.push(card);
    if (def.subtype === KitSubtype.ENERGY_DRINK) player.maxEnergy += 1;
    if (def.subtype === KitSubtype.UPGRADE) player.techLevel += 1;
    if (def.subtype === KitSubtype.KERN_SUPER_UPGRADE) player.techLevel = 10;
    log(`${player.displayName} trang bị ${def.name}.`);
    return;
  }

  switch (def.subtype) {
    case ActionSubtype.DEFEND:
      card.location = CardLocation.PAYLOAD_ZONE;
      card.face = CardFace.FACE_DOWN;
      card.ownerId = player.id;
      player.payloadZone.push(card);
      log(`${player.displayName} úp 1 lá Phòng thủ chờ GIẢI MÃ.`);
      return;
    case ActionSubtype.INCIDENT_RESPONSE:
      toUsedPile(state, card);
      player.hp = Math.min(player.maxHp, player.hp + 1);
      log(`${player.displayName} dùng Incident Response, +1 Máu.`);
      return;
    case ActionSubtype.LUCKY: {
      toUsedPile(state, card);
      const drawn = drawCards(state.drawPile, state.usedPile, 2);
      drawn.forEach((c) => {
        c.location = CardLocation.HAND;
        c.ownerId = player.id;
      });
      player.hand.push(...drawn);
      log(`${player.displayName} dùng Lucky, bốc thêm ${drawn.length} lá.`);
      return;
    }
    case ActionSubtype.BITCOIN:
      toUsedPile(state, card);
      if (player.isAudit) {
        player.isAudit = false;
        log(`${player.displayName} dùng Bitcoin để thoát Audit.`);
      } else {
        log(`${player.displayName} dùng Bitcoin (không có hiệu lực đặc biệt lúc này).`);
      }
      return;
    case ActionSubtype.KERN_CAESAR: {
      toUsedPile(state, card);
      const roll = 1 + Math.floor(Math.random() * 6);
      passCardsLeft(state, roll, log);
      log(`${player.displayName} tung Quyền năng Caesar: ${roll}.`);
      return;
    }
    default:
      throw new RuleError(`${def.name} không thể tự dùng cho bản thân.`);
  }
}

function passCardsLeft(state: GameState, n: number, log: (m: string) => void) {
  const alivePlayers = state.turnOrder.map((id) => getPlayer(state, id)).filter((p) => p.status === PlayerStatus.ALIVE);
  if (alivePlayers.length < 2) return;
  for (let step = 0; step < n; step++) {
    const outgoing = alivePlayers.map((p) => p.hand);
    alivePlayers.forEach((p, i) => {
      const from = outgoing[(i + 1) % alivePlayers.length];
      p.hand = from.map((c) => ({ ...c, ownerId: p.id }));
    });
  }
  log(`Cả bàn chuyền bài sang trái ${n} vòng.`);
}

function handlePlayCard(
  state: GameState,
  player: PlayerState,
  action: Extract<GameAction, { type: "PLAY_CARD" }>,
  log: (m: string) => void
) {
  const { cardInstanceId, faceUp, target, targetCardInstanceId } = action;
  const card = findInZone(player.hand, cardInstanceId);
  const def = getCardDef(card.defId);

  if (target.kind === "SELF") {
    return handleSelfPlay(state, player, cardInstanceId, log);
  }
  if (player.isAudit && !faceUp) throw new RuleError("Đang bị Audit, không thể hành động úp.");

  requireEnergy(player, 1);
  removeFromZone(player.hand, cardInstanceId);

  switch (def.subtype) {
    case ActionSubtype.ATTACK:
      return handleAttack(state, player, card, def, faceUp, target, log);
    case ActionSubtype.PHISHING: {
      if (target.kind !== "PLAYER") throw new RuleError("Phishing cần nhắm vào 1 người chơi.");
      toUsedPile(state, card);
      const victim = getPlayer(state, target.playerId);
      if (victim.hand.length > 0) {
        const idx = Math.floor(Math.random() * victim.hand.length);
        const [taken] = victim.hand.splice(idx, 1);
        taken.ownerId = player.id;
        player.hand.push(taken);
        log(`${player.displayName} Phishing thành công, lấy 1 lá của ${victim.displayName}.`);
      } else {
        log(`${victim.displayName} không còn lá nào để Phishing.`);
      }
      return;
    }
    case ActionSubtype.RANSOMWARE: {
      toUsedPile(state, card);
      if (!targetCardInstanceId) throw new RuleError("Ransomware cần chọn 1 lá để hủy.");
      const found = findCardAnywhere(state, targetCardInstanceId);
      if (!found) throw new RuleError("Không tìm thấy lá bài mục tiêu.");
      found.zone.splice(found.zone.indexOf(found.card), 1);
      toUsedPile(state, found.card);
      log(`${player.displayName} dùng Ransomware hủy 1 lá trên bàn.`);
      return;
    }
    case ActionSubtype.ZERODAY: {
      toUsedPile(state, card);
      if (!targetCardInstanceId) throw new RuleError("Zero-day cần chọn 1 lá để cướp.");
      const found = findCardAnywhere(state, targetCardInstanceId);
      if (!found) throw new RuleError("Không tìm thấy lá bài mục tiêu.");
      found.zone.splice(found.zone.indexOf(found.card), 1);
      found.card.ownerId = player.id;
      found.card.location = CardLocation.HAND;
      found.card.face = CardFace.FACE_UP;
      player.hand.push(found.card);
      log(`${player.displayName} dùng Zero-day cướp 1 lá trên bàn.`);
      return;
    }
    case ActionSubtype.KERN_BAD_LUCK: {
      if (target.kind !== "PLAYER") throw new RuleError("Vận xui cần nhắm vào 1 người chơi.");
      toUsedPile(state, card);
      const victim = getPlayer(state, target.playerId);
      const n = Math.min(2, victim.hand.length);
      for (let i = 0; i < n; i++) toUsedPile(state, victim.hand.pop() as CardInstance);
      log(`${player.displayName} dùng Vận xui: ${victim.displayName} mất ${n} lá.`);
      return;
    }
    case ActionSubtype.KERN_COERCE:
      player.hand.push(card); // put back; must be played via KERN_COERCE_CHOICE
      throw new RuleError("Dùng hành động KERN_COERCE_CHOICE để chơi lá Dân chủ.");
    case ActionSubtype.DENY:
      player.hand.push(card);
      throw new RuleError("Rút điện chỉ dùng để phản ứng (REACT_DENY).");
    case ActionSubtype.DEFEND:
      if (target.kind === "SERVER") {
        // Queued into SERVER's own zone, same as a face-down attack — counted at SERVER_CHECK
        // against the queued ATTACK count (MAX(attackCount - defendCount, 0)).
        card.location = CardLocation.SERVER_ZONE;
        card.face = CardFace.FACE_DOWN;
        card.ownerId = player.id;
        state.server.zone.push(card);
        log(`${player.displayName} úp 1 lá Phòng thủ để bảo vệ SERVER.`);
        return;
      }
      player.hand.push(card);
      throw new RuleError("Phòng thủ chỉ có thể tự dùng cho bản thân hoặc để bảo vệ SERVER.");
    default:
      player.hand.push(card);
      throw new RuleError(`${def.name} không thể dùng theo cách này.`);
  }
}

function handleAttack(
  state: GameState,
  player: PlayerState,
  card: CardInstance,
  def: ReturnType<typeof getCardDef>,
  faceUp: boolean,
  target: Extract<GameAction, { type: "PLAY_CARD" }>["target"],
  log: (m: string) => void
) {
  const value = def.value ?? 1;

  if (target.kind === "PLAYER") {
    const victim = getPlayer(state, target.playerId);
    if (victim.id === player.id) throw new RuleError("Không thể tự tấn công bản thân.");
    if (!faceUp) {
      card.location = CardLocation.PAYLOAD_ZONE;
      card.face = CardFace.FACE_DOWN;
      card.ownerId = victim.id;
      victim.payloadZone.push(card);
      log(`${player.displayName} úp 1 lá tấn công nhắm vào ${victim.displayName}.`);
      return;
    }
    if (value <= victim.techLevel) {
      toUsedPile(state, card);
      log(`Tấn công của ${player.displayName} không hiệu lực (điểm <= TECH LEVEL của ${victim.displayName}).`);
      return;
    }
    createReaction(state, {
      kind: "PLAYER_ATTACK",
      attackerId: player.id,
      targetId: victim.id,
      attackCard: card,
      totalAttackValue: value,
      allowDefend: true,
      windowMs: env.REACTION_WINDOW_MS,
    });
    log(`${player.displayName} tấn công ngửa ${victim.displayName} (điểm ${value}) — chờ phản ứng.`);
    return;
  }

  if (target.kind === "SERVER") {
    if (!faceUp) {
      card.location = CardLocation.SERVER_ZONE;
      card.face = CardFace.FACE_DOWN;
      card.ownerId = player.id;
      state.server.zone.push(card);
      log(`${player.displayName} úp 1 lá tấn công vào SERVER.`);
      return;
    }
    createReaction(state, {
      kind: "SERVER_ATTACK",
      attackerId: player.id,
      targetId: null,
      attackCard: card,
      totalAttackValue: value,
      allowDefend: false,
      windowMs: env.REACTION_WINDOW_MS,
    });
    log(`${player.displayName} tấn công ngửa SERVER (điểm ${value}) — chờ Rút điện.`);
    return;
  }

  if (target.kind === "KERN") {
    if (!faceUp) throw new RuleError("Chỉ có thể tấn công THE KERN bằng lá ngửa.");
    createReaction(state, {
      kind: "KERN_ATTACK",
      attackerId: player.id,
      targetId: null,
      attackCard: card,
      totalAttackValue: value,
      allowDefend: true,
      windowMs: env.REACTION_WINDOW_MS,
    });
    log(`${player.displayName} tấn công THE KERN (điểm ${value}) — chờ phản ứng.`);
    return;
  }

  throw new RuleError("Mục tiêu không hợp lệ cho tấn công.");
}

function handleGiftCard(state: GameState, player: PlayerState, cardInstanceId: string, targetPlayerId: string, log: (m: string) => void) {
  if (player.personaId !== PersonaId.HELLMAN) throw new RuleError("Chỉ Hellman mới có thể tặng bài.");
  const target = getPlayer(state, targetPlayerId);
  const card = findInZone(player.hand, cardInstanceId);
  removeFromZone(player.hand, cardInstanceId);
  card.ownerId = target.id;
  target.hand.push(card);
  log(`${player.displayName} tặng 1 lá cho ${target.displayName}.`);
  applyHellmanOnGift(player, log);
}

function handleEveTransfer(state: GameState, player: PlayerState, cardInstanceId: string, targetPlayerId: string, log: (m: string) => void) {
  if (player.personaId !== PersonaId.EVE) throw new RuleError("Chỉ Eve mới có năng lực này.");
  const target = getPlayer(state, targetPlayerId);
  const card = findInZone(player.payloadZone, cardInstanceId);
  removeFromZone(player.payloadZone, cardInstanceId);
  card.ownerId = target.id;
  card.location = CardLocation.PAYLOAD_ZONE;
  target.payloadZone.push(card);
  applyDamageToPlayer(state, player, 2, { killerId: null, direct: false }, log);
  log(`${player.displayName} (Eve) chuyển 1 lá úp cho ${target.displayName} (-2 Máu).`);
}

function handleInspectorAudit(state: GameState, player: PlayerState, targetPlayerId: string, log: (m: string) => void) {
  if (player.baseRole !== BaseRoleId.INSPECTOR) throw new RuleError("Chỉ INSPECTOR mới có năng lực này.");
  if (state.phase !== RoundPhase.ACTION) throw new RuleError("Chỉ dùng ở pha HÀNH ĐỘNG.");
  if (targetPlayerId === state.lastAuditTargetId) throw new RuleError("Không thể Audit cùng 1 người 2 lượt liên tiếp.");
  requireEnergy(player, 1);
  const target = getPlayer(state, targetPlayerId);
  state.players.forEach((p) => (p.isAudit = false));
  target.isAudit = true;
  log(`INSPECTOR Audit ${target.displayName}.`);
}

function handleKernCoerce(
  state: GameState,
  player: PlayerState,
  action: Extract<GameAction, { type: "KERN_COERCE_CHOICE" }>,
  log: (m: string) => void
) {
  const card = player.hand.find((c) => getCardDef(c.defId).subtype === ActionSubtype.KERN_COERCE);
  if (!card) throw new RuleError("Bạn không có lá Dân chủ.");
  requireEnergy(player, 1);
  removeFromZone(player.hand, card.instanceId);
  toUsedPile(state, card);
  const target = getPlayer(state, action.targetPlayerId);

  if (action.choice === "STEAL_TWO") {
    const ids = (action.cardInstanceIds ?? []).slice(0, 2);
    for (const id of ids) {
      const found = [target.hand, target.kitZone].map((z) => z.find((c) => c.instanceId === id)).find(Boolean);
      if (!found) continue;
      const zone = target.hand.includes(found) ? target.hand : target.kitZone;
      zone.splice(zone.indexOf(found), 1);
      found.ownerId = player.id;
      found.location = CardLocation.HAND;
      player.hand.push(found);
    }
    log(`${player.displayName} (Dân chủ) cướp ${ids.length} lá của ${target.displayName}.`);
  } else {
    const id = (action.cardInstanceIds ?? [])[0];
    if (id) {
      const card2 = findCardAnywhere(state, id);
      if (card2 && card2.owner?.id === target.id) card2.card.face = CardFace.FACE_UP;
    } else {
      target.baseRoleRevealed = true;
    }
    log(`${player.displayName} (Dân chủ) lật 1 lá của ${target.displayName}.`);
  }
}

function handleDiscard(state: GameState, player: PlayerState, ids: string[], log: (m: string) => void) {
  ids.forEach((id) => {
    const idx = player.hand.findIndex((c) => c.instanceId === id);
    if (idx >= 0) toUsedPile(state, player.hand.splice(idx, 1)[0]);
  });
  if (ids.length > 0) log(`${player.displayName} bỏ ${ids.length} lá.`);
}
