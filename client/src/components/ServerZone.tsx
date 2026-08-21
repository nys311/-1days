import React from "react";
import { CardFace, type PlayerView } from "@minus1days/shared";
import { Card } from "./Card";
import { IconKernCore, IconServerCore } from "../assets/cards/icons";
import "./ServerZone.css";

export interface ServerZoneProps {
  server: PlayerView["server"];
  targetable?: boolean;
  onSelectTarget?: () => void;
  onInspectCard: (defId: string) => void;
}

// SERVER and THE KERN are the same shared table-center object: SERVER is the HP/attack-queue
// side of it, THE KERN is the hidden loot cache (2 FLAG + 4 special cards) living inside it —
// every unblocked hit against it damages HP *and* cracks one loot card loose at the same time.
export const ServerZone: React.FC<ServerZoneProps> = ({ server, targetable, onSelectTarget, onInspectCard }) => {
  const pct = server.maxHp > 0 ? Math.max(0, Math.min(1, server.hp / server.maxHp)) * 100 : 0;
  const lootStackCount = Math.min(server.lootRemaining, 5);

  return (
    <div
      className={["server-zone", targetable && "server-zone--targetable"].filter(Boolean).join(" ")}
      onClick={targetable ? onSelectTarget : undefined}
      role={targetable ? "button" : undefined}
    >
      <div className="server-zone__title">
        <IconServerCore className="server-zone__title-icon" />
        <span>SERVER</span>
        <span className="server-zone__title-sep">·</span>
        <IconKernCore className="server-zone__title-icon server-zone__title-icon--kern" />
        <span>THE KERN</span>
      </div>

      <div className="server-zone__hp">
        <div className="server-zone__hp-bar">
          <div className="server-zone__hp-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="server-zone__hp-num">
          {server.hp}/{server.maxHp} HP
        </span>
      </div>

      <div className="server-zone__loot" title={`${server.lootRemaining} lá còn lại trong THE KERN`}>
        <div className="server-zone__loot-stack">
          {Array.from({ length: lootStackCount }).map((_, i) => (
            <div key={i} className="server-zone__loot-stack-card" style={{ "--i": i } as React.CSSProperties} />
          ))}
          {server.lootRemaining === 0 && <span className="server-zone__loot-empty">Đã cạn</span>}
          {server.lootRemaining > 0 && <span className="server-zone__loot-count">{server.lootRemaining}</span>}
        </div>
        {server.lootClaimed.length > 0 && (
          <div className="server-zone__claimed">
            <span className="server-zone__claimed-label">Đã bị lấy</span>
            <div className="server-zone__claimed-cards">
              {server.lootClaimed.map((c) => (
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
