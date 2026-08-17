import { ActionSubtype, CardLocation, GameState, PersonaId, PlayerState, PlayerStatus } from "@minus1days/shared";
import { drawCards } from "./deck";

/** Bob & Alice: at decrypt, ATTACK cards count as DEFEND and DEFEND cards count as ATTACK(6). */
export function effectiveSubtypeForDecrypt(
  personaId: PersonaId | null,
  subtype: ActionSubtype | undefined
): { subtype: ActionSubtype | undefined; valueOverride?: number } {
  const reverses = personaId === PersonaId.BOB || personaId === PersonaId.ALICE;
  if (!reverses) return { subtype };
  if (subtype === ActionSubtype.ATTACK) return { subtype: ActionSubtype.DEFEND };
  if (subtype === ActionSubtype.DEFEND) return { subtype: ActionSubtype.ATTACK, valueOverride: 6 };
  return { subtype };
}

/** Kevin: an unblocked face-up attack he plays deals -2 HP instead of -1. */
export function faceUpAttackDamage(attackerPersonaId: PersonaId | null): number {
  return attackerPersonaId === PersonaId.KEVIN ? 2 : 1;
}

/** Lovelace: whenever she loses HP, she immediately draws 2 cards. Call AFTER applying the HP loss. */
export function applyLovelaceOnDamage(state: GameState, player: PlayerState, log: (m: string) => void) {
  if (player.personaId !== PersonaId.LOVELACE || player.status !== PlayerStatus.ALIVE) return;
  const drawn = drawCards(state.drawPile, state.usedPile, 2);
  drawn.forEach((c) => {
    c.location = CardLocation.HAND;
    c.ownerId = player.id;
  });
  player.hand.push(...drawn);
  if (drawn.length > 0) log(`${player.displayName} (Lovelace) bốc thêm ${drawn.length} lá do mất Máu.`);
}

/** Hellman: gifting a card to another player grants +1 Energy. Call after the gift transfers ownership. */
export function applyHellmanOnGift(gifter: PlayerState, log: (m: string) => void) {
  if (gifter.personaId !== PersonaId.HELLMAN) return;
  gifter.energy += 1;
  log(`${gifter.displayName} (Hellman) +1 Năng lượng vì tặng bài.`);
}
