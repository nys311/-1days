import {
  BaseRoleId,
  BotLevel,
  CardFace,
  CardInstance,
  CardLocation,
  EngineCreateGameRequestPlayer,
  GameState,
  NON_INSPECTOR_PERSONAS,
  PERSONA_CATALOG,
  PersonaId,
  PlayerState,
  PlayerStatus,
  RoundPhase,
  SeatKind,
  getBaseRoleDistribution,
} from "@minus1days/shared";
import { buildFreshDrawPile, buildKernStack, drawCards, makeCard, shuffle } from "./deck";

export function createInitialState(roomId: string, players: EngineCreateGameRequestPlayer[]): GameState {
  const n = players.length;
  if (n < 2 || n > 8) throw new Error("Player count must be 2-8");

  const roles = shuffle(getBaseRoleDistribution(n));
  const inspectorSeat = players.find((_p, i) => roles[i] === BaseRoleId.INSPECTOR);
  const personaPool = shuffle(NON_INSPECTOR_PERSONAS.slice());

  const drawPile = buildFreshDrawPile();
  const usedPile: GameState["usedPile"] = [];
  const server = {
    hp: 10,
    maxHp: 10,
    zone: drawCards(drawPile, usedPile, 6),
    lootStack: buildKernStack(),
    lootClaimed: [] as CardInstance[],
  };
  server.zone.forEach((c) => (c.location = CardLocation.SERVER_ZONE));

  const playerStates: PlayerState[] = players.map((p, i) => {
    const baseRole = roles[i];
    const personaId = baseRole === BaseRoleId.INSPECTOR ? PersonaId.INSPECTOR : (personaPool.pop() as PersonaId);
    const stats = PERSONA_CATALOG[personaId];
    const hand: CardInstance[] = drawCards(drawPile, usedPile, 6).map((c) => ({ ...c, location: CardLocation.HAND, ownerId: p.id }));
    if (baseRole === BaseRoleId.INSPECTOR) {
      hand.push(makeCard("AUDIT_TOKEN", CardLocation.HAND, CardFace.FACE_UP));
    }
    return {
      id: p.id,
      displayName: p.displayName,
      seatIndex: p.seatIndex,
      seatKind: p.seatKind,
      botLevel: p.botLevel,
      baseRole,
      baseRoleRevealed: false,
      personaId,
      hp: stats.hp,
      maxHp: stats.hp,
      energy: stats.energy,
      maxEnergy: stats.energy,
      techLevel: stats.techLevel,
      status: PlayerStatus.ALIVE,
      isAudit: false,
      defeatedBaseRoles: [],
      hand,
      payloadZone: [],
      kitZone: [],
      connected: true,
    };
  });

  const turnOrder = computeTurnOrder(playerStates).map((p) => p.id);

  return {
    roomId,
    players: playerStates,
    currentPlayerId: turnOrder[0],
    turnOrder,
    round: 1,
    phase: RoundPhase.DRAW,
    server,
    drawPile,
    usedPile,
    pendingReaction: null,
    lastAuditTargetId: null,
    winner: null,
    log: [`Ván đấu bắt đầu với ${n} người chơi.`],
  };
}

/** Turn order walks seat index ascending (the table's left direction); the Inspector, if present, always goes last. */
export function computeTurnOrder(players: PlayerState[]): PlayerState[] {
  const alive = players.filter((p) => p.status === PlayerStatus.ALIVE).sort((a, b) => a.seatIndex - b.seatIndex);
  const inspector = alive.find((p) => p.baseRole === BaseRoleId.INSPECTOR);
  if (!inspector) return alive;
  const others = alive.filter((p) => p.id !== inspector.id);
  const idx = others.findIndex((p) => p.seatIndex > inspector.seatIndex);
  const startAt = idx === -1 ? 0 : idx;
  return [...others.slice(startAt), ...others.slice(0, startAt), inspector];
}
