import React from "react";
import "./DeckPiles.css";

export interface DeckPilesProps {
  drawPileCount: number;
  usedPileCount: number;
}

/** The shared ACTION/KIT draw pile and used (discard) pile — both physically present on the
 * table even though neither is a valid action target, so players can see how many cards are
 * left and how many have cycled through. */
export const DeckPiles: React.FC<DeckPilesProps> = ({ drawPileCount, usedPileCount }) => {
  return (
    <div className="deck-piles">
      <DeckPile label="Chồng bài bốc" count={drawPileCount} kind="draw" />
      <DeckPile label="Chồng bài bỏ" count={usedPileCount} kind="used" />
    </div>
  );
};

const DeckPile: React.FC<{ label: string; count: number; kind: "draw" | "used" }> = ({ label, count, kind }) => {
  const stackCount = Math.min(count, 4);
  return (
    <div className="deck-pile" title={`${count} lá`}>
      <div className={`deck-pile__stack deck-pile__stack--${kind}`}>
        {stackCount === 0 && <div className="deck-pile__empty-slot" />}
        {Array.from({ length: stackCount }).map((_, i) => (
          <div key={i} className="deck-pile__card" style={{ "--i": i } as React.CSSProperties} />
        ))}
        <span className="deck-pile__count">{count}</span>
      </div>
      <span className="deck-pile__label">{label}</span>
    </div>
  );
};
