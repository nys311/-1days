import React from "react";
import { CardFace, type PlayerView } from "@minus1days/shared";
import { Card } from "./Card";
import { IconKernCore } from "../assets/cards/icons";
import "./KernZone.css";

export interface KernZoneProps {
  kern: PlayerView["kern"];
  targetable?: boolean;
  onSelectTarget?: () => void;
  onInspectCard: (defId: string) => void;
}

export const KernZone: React.FC<KernZoneProps> = ({ kern, targetable, onSelectTarget, onInspectCard }) => {
  const stackCount = Math.min(kern.remaining, 5);

  return (
    <div
      className={["kern-zone", targetable && "kern-zone--targetable"].filter(Boolean).join(" ")}
      onClick={targetable ? onSelectTarget : undefined}
      role={targetable ? "button" : undefined}
    >
      <div className="kern-zone__title">
        <IconKernCore className="kern-zone__title-icon" />
        <span>THE KERN</span>
      </div>

      <div className="kern-zone__stack" title={`${kern.remaining} lá còn lại trong THE KERN`}>
        {Array.from({ length: stackCount }).map((_, i) => (
          <div key={i} className="kern-zone__stack-card" style={{ "--i": i } as React.CSSProperties} />
        ))}
        {kern.remaining === 0 && <div className="kern-zone__stack-empty">Đã cạn</div>}
        {kern.remaining > 0 && <span className="kern-zone__stack-count">{kern.remaining}</span>}
      </div>

      {kern.claimed.length > 0 && (
        <div className="kern-zone__claimed">
          <span className="kern-zone__claimed-label">Đã bị lấy</span>
          <div className="kern-zone__claimed-cards">
            {kern.claimed.map((c) => (
              <Card
                key={c.instanceId}
                instanceId={c.instanceId}
                defId={c.defId}
                revealedType={c.revealedType}
                faceUp={c.face === CardFace.FACE_UP}
                size="sm"
                onInspect={c.defId ? onInspectCard : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
