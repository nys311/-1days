import { CardFace, CardLocation, CardType, GameState, getCardDef } from "@minus1days/shared";
import { checkFlagCapture } from "./win";
import { getPlayer } from "./util";

/**
 * Every unblocked face-up attack against the SERVER cracks loose one card from its hidden Kern
 * loot cache, in addition to the HP damage it deals — SERVER and THE KERN are the same object.
 */
export function claimTopKernCard(state: GameState, claimerId: string, log: (m: string) => void) {
  const card = state.server.lootStack.shift();
  if (!card) {
    return; // loot cache already emptied out — attack still lands as plain SERVER damage
  }
  const def = getCardDef(card.defId);
  const claimer = getPlayer(state, claimerId);

  if (def.type === CardType.FLAG) {
    card.location = CardLocation.KERN_CLAIMED;
    card.ownerId = claimerId;
    state.server.lootClaimed.push(card);
    log(`${claimer.displayName} đã lấy được ${def.name} trong THE KERN!`);
    const winner = checkFlagCapture(state, claimer.baseRole);
    if (winner) state.winner = winner;
    return;
  }

  // Non-FLAG kern cards become a normal hand card the claimer can play later.
  card.location = CardLocation.HAND;
  card.ownerId = claimerId;
  card.face = CardFace.FACE_UP;
  claimer.hand.push(card);
  log(`${claimer.displayName} nhận được "${def.name}" từ THE KERN.`);
}
