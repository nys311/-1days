import { CardInstance, CardLocation, GameState, PlayerState, PlayerStatus } from "@minus1days/shared";

export class RuleError extends Error {}

export function getPlayer(state: GameState, playerId: string): PlayerState {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) throw new RuleError(`Unknown player: ${playerId}`);
  return p;
}

export function findInZone(zone: CardInstance[], instanceId: string): CardInstance {
  const c = zone.find((x) => x.instanceId === instanceId);
  if (!c) throw new RuleError(`Card not found: ${instanceId}`);
  return c;
}

export function removeFromZone(zone: CardInstance[], instanceId: string): CardInstance {
  const idx = zone.findIndex((x) => x.instanceId === instanceId);
  if (idx === -1) throw new RuleError(`Card not found: ${instanceId}`);
  return zone.splice(idx, 1)[0];
}

export function toUsedPile(state: GameState, card: CardInstance) {
  card.location = CardLocation.USED_PILE;
  card.ownerId = null;
  state.usedPile.push(card);
}

export function makeLogger(state: GameState) {
  return (msg: string) => state.log.push(msg);
}

export function requireAlive(player: PlayerState) {
  if (player.status !== PlayerStatus.ALIVE) throw new RuleError(`${player.displayName} đã bị hạ gục (404).`);
}

export function requireEnergy(player: PlayerState, cost = 1) {
  if (player.energy < cost) throw new RuleError(`${player.displayName} không đủ Năng lượng.`);
  player.energy -= cost;
}

/** Locates a card anywhere on the table (hands/payload/kit zones + server zone) — used by RANSOMWARE/ZERODAY. */
export function findCardAnywhere(
  state: GameState,
  instanceId: string
): { card: CardInstance; zone: CardInstance[]; owner: PlayerState | null } | null {
  for (const p of state.players) {
    for (const zone of [p.hand, p.payloadZone, p.kitZone]) {
      const card = zone.find((c) => c.instanceId === instanceId);
      if (card) return { card, zone, owner: p };
    }
  }
  const serverCard = state.server.zone.find((c) => c.instanceId === instanceId);
  if (serverCard) return { card: serverCard, zone: state.server.zone, owner: null };
  return null;
}
