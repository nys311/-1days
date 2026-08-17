import { v4 as uuid } from "uuid";
import { CardFace, CardInstance, CardLocation, DRAW_PILE_COMPOSITION, KERN_STACK_DEF_IDS } from "@minus1days/shared";

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeInstance(defId: string, location: CardLocation, face: CardFace = CardFace.FACE_DOWN): CardInstance {
  return { instanceId: uuid(), defId, face, location, ownerId: null };
}

/** Builds the full 130-card action+kit draw pile (unshuffled composition, shuffled order). */
export function buildFreshDrawPile(): CardInstance[] {
  const flat: CardInstance[] = [];
  for (const entry of DRAW_PILE_COMPOSITION) {
    for (let i = 0; i < entry.count; i++) {
      flat.push(makeInstance(entry.defId, CardLocation.DRAW_PILE));
    }
  }
  return shuffle(flat);
}

export function buildKernStack(): CardInstance[] {
  return shuffle(KERN_STACK_DEF_IDS.map((id) => makeInstance(id, CardLocation.KERN_STACK)));
}

export function makeCard(defId: string, location: CardLocation, face: CardFace = CardFace.FACE_DOWN): CardInstance {
  return makeInstance(defId, location, face);
}

/** Draw `n` cards from the front of `pile` (mutating it), recycling `used` into `pile` if it runs out. */
export function drawCards(pile: CardInstance[], used: CardInstance[], n: number): CardInstance[] {
  const drawn: CardInstance[] = [];
  for (let i = 0; i < n; i++) {
    if (pile.length === 0) {
      if (used.length === 0) break;
      const recycled = shuffle(used.splice(0, used.length));
      recycled.forEach((c) => (c.location = CardLocation.DRAW_PILE));
      pile.push(...recycled);
    }
    const card = pile.shift();
    if (card) drawn.push(card);
  }
  return drawn;
}
