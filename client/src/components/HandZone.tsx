import React from "react";
import type { VisibleCard } from "@minus1days/shared";
import { Card } from "./Card";
import "./HandZone.css";

export interface HandZoneProps {
  cards: VisibleCard[];
  selectedIds: string[];
  disabled?: boolean;
  onToggleSelect: (instanceId: string) => void;
  onInspectCard: (defId: string) => void;
}

export const HandZone: React.FC<HandZoneProps> = ({ cards, selectedIds, disabled, onToggleSelect, onInspectCard }) => {
  return (
    <div className="hand-zone">
      <div className="hand-zone__label">Bài trên tay ({cards.length})</div>
      <div className="hand-zone__cards">
        {cards.length === 0 && <span className="hand-zone__empty">Không có lá bài nào.</span>}
        {cards.map((c) => (
          <Card
            key={c.instanceId}
            instanceId={c.instanceId}
            defId={c.defId}
            revealedType={c.revealedType}
            faceUp
            size="md"
            selected={selectedIds.includes(c.instanceId)}
            disabled={disabled}
            onClick={() => onToggleSelect(c.instanceId)}
            onInspect={c.defId ? onInspectCard : undefined}
          />
        ))}
      </div>
    </div>
  );
};
