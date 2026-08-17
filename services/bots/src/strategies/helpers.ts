import { ActionSubtype, PlayerStatus, PlayerView, VisibleCard, getCardDef } from "@minus1days/shared";

export function me(view: PlayerView, myPlayerId: string) {
  const p = view.players.find((x) => x.id === myPlayerId);
  if (!p) throw new Error("bot not found in view");
  return p;
}

export function handCardsOfSubtype(hand: VisibleCard[], subtype: ActionSubtype): VisibleCard[] {
  return hand.filter((c) => c.defId && getCardDef(c.defId).subtype === subtype);
}

export function otherAlivePlayers(view: PlayerView, myPlayerId: string) {
  return view.players.filter((p) => p.id !== myPlayerId && p.status === PlayerStatus.ALIVE);
}
