import {
  CardFace,
  CardInstance,
  CardLocation,
  GameState,
  PlayerState,
  PlayerView,
  RoundPhase,
  VisibleCard,
  getCardDef,
} from "@minus1days/shared";

function visibleCard(card: CardInstance, viewerId: string, ownerIdForVisibility: string | null): VisibleCard {
  const def = getCardDef(card.defId);
  const isMine = ownerIdForVisibility === viewerId;
  const alwaysPublic = card.face === CardFace.FACE_UP || card.location === CardLocation.KIT_ZONE;
  const reveal = isMine || alwaysPublic;
  return {
    instanceId: card.instanceId,
    defId: reveal ? card.defId : null,
    revealedType: def.type, // coarse type is visible on the outer face regardless of reveal
    face: card.face,
    location: card.location,
    ownerId: card.ownerId,
  };
}

function visiblePlayer(p: PlayerState, viewerId: string): PlayerView["players"][number] {
  const isYou = p.id === viewerId;
  return {
    id: p.id,
    displayName: p.displayName,
    seatIndex: p.seatIndex,
    seatKind: p.seatKind,
    botLevel: p.botLevel,
    baseRole: p.baseRoleRevealed || isYou ? p.baseRole : null,
    baseRoleRevealed: p.baseRoleRevealed,
    personaId: p.personaId, // personas are always public
    hp: p.hp,
    maxHp: p.maxHp,
    energy: p.energy,
    maxEnergy: p.maxEnergy,
    techLevel: p.techLevel,
    status: p.status,
    isAudit: p.isAudit,
    defeatedBaseRoles: p.baseRoleRevealed ? p.defeatedBaseRoles : [],
    handCount: p.hand.length,
    hand: isYou ? p.hand.map((c) => visibleCard(c, viewerId, p.id)) : [],
    payloadZone: p.payloadZone.map((c) => visibleCard(c, viewerId, c.ownerId ?? p.id)),
    kitZone: p.kitZone.map((c) => visibleCard(c, viewerId, p.id)),
    connected: p.connected,
  };
}

export function buildPlayerView(state: GameState, viewerId: string): PlayerView {
  const isEndOfServerAction = state.phase === RoundPhase.ACTION;
  return {
    roomId: state.roomId,
    you: viewerId,
    round: state.round,
    phase: state.phase,
    currentPlayerId: state.currentPlayerId ?? null,
    players: state.players.map((p) => visiblePlayer(p, viewerId)),
    server: {
      hp: state.server.hp,
      maxHp: state.server.maxHp,
      zone: state.server.zone.map((c) => visibleCard(c, viewerId, null)),
    },
    kern: {
      remaining: state.kern.stack.length,
      claimed: state.kern.claimed.map((c) => visibleCard(c, viewerId, c.ownerId ?? null)),
    },
    drawPileCount: state.drawPile.length,
    usedPileCount: state.usedPile.length,
    pendingReaction: state.pendingReaction
      ? {
          id: state.pendingReaction.id,
          kind: state.pendingReaction.kind,
          attackerId: state.pendingReaction.attackerId,
          targetId: state.pendingReaction.targetId,
          deadlineMs: state.pendingReaction.deadlineMs,
        }
      : null,
    winner: state.winner,
    log: state.log.slice(-50),
    legalActionHint: buildHints(state, viewerId, isEndOfServerAction),
  };
}

function buildHints(state: GameState, viewerId: string, inAction: boolean): string[] {
  const hints: string[] = [];
  const isCurrent = state.currentPlayerId === viewerId;
  if (state.pendingReaction && state.pendingReaction.targetId !== viewerId) {
    hints.push("Có thể phản ứng bằng Phòng thủ/Rút điện nếu bạn có lá phù hợp.");
  }
  if (!isCurrent) return hints;
  switch (state.phase) {
    case RoundPhase.DRAW:
      hints.push("Đang bốc bài tự động...");
      break;
    case RoundPhase.PREPARE:
      hints.push("Chuẩn bị: chơi bài với bản thân, hoặc kết thúc pha.");
      break;
    case RoundPhase.ACTION:
      hints.push("Hành động: chơi bài nhắm vào người khác, SERVER, hoặc THE KERN.");
      break;
    case RoundPhase.DISCARD:
      hints.push("Bỏ bài (không bắt buộc) rồi kết thúc lượt.");
      break;
    default:
      break;
  }
  return hints;
}
