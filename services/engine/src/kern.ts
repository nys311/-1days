import { CardFace, CardLocation, CardType, GameState, getCardDef } from "@minus1days/shared";
import { checkFlagCapture } from "./win";
import { getPlayer } from "./util";

/** Resolves an unblocked attack against THE KERN: reveal the top card and apply its effect. */
export function claimTopKernCard(state: GameState, claimerId: string, log: (m: string) => void) {
  const card = state.kern.stack.shift();
  if (!card) {
    log("THE KERN đã trống.");
    return;
  }
  const def = getCardDef(card.defId);
  const claimer = getPlayer(state, claimerId);

  if (def.type === CardType.FLAG) {
    card.location = CardLocation.KERN_CLAIMED;
    card.ownerId = claimerId;
    state.kern.claimed.push(card);
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
