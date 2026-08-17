import React from "react";
import { CardFace, type PlayerView } from "@minus1days/shared";
import { Card } from "./Card";
import { IconServerCore } from "../assets/cards/icons";
import "./ServerZone.css";

export interface ServerZoneProps {
  server: PlayerView["server"];
  targetable?: boolean;
  onSelectTarget?: () => void;
  onInspectCard: (defId: string) => void;
}

export const ServerZone: React.FC<ServerZoneProps> = ({ server, targetable, onSelectTarget, onInspectCard }) => {
  const pct = server.maxHp > 0 ? Math.max(0, Math.min(1, server.hp / server.maxHp)) * 100 : 0;

  return (
    <div
      className={["server-zone", targetable && "server-zone--targetable"].filter(Boolean).join(" ")}
      onClick={targetable ? onSelectTarget : undefined}
      role={targetable ? "button" : undefined}
    >
      <div className="server-zone__title">
        <IconServerCore className="server-zone__title-icon" />
        <span>SERVER</span>
      </div>

      <div className="server-zone__hp">
        <div className="server-zone__hp-bar">
          <div className="server-zone__hp-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="server-zone__hp-num">
          {server.hp}/{server.maxHp} HP
        </span>
      </div>

      <div className="server-zone__cards">
        {server.zone.length === 0 && <span className="server-zone__empty">Chưa có tấn công nào chờ xử lý</span>}
        {server.zone.map((c) => (
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
  );
};
