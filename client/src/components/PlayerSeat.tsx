import React from "react";
import { CardFace, CardType, PERSONA_CATALOG, type VisiblePlayer } from "@minus1days/shared";
import { Card } from "./Card";
import { StatPips } from "./StatPips";
import { baseRoleDefId, baseRoleLabel } from "../lib/cardHelpers";
import { getBaseRoleIcon } from "../assets/cards/icons";
import "./PlayerSeat.css";

export interface PlayerSeatProps {
  player: VisiblePlayer;
  isYou: boolean;
  isCurrentTurn: boolean;
  targetable?: boolean;
  onSelectTarget?: () => void;
  onInspectCard: (defId: string) => void;
}

export const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  isYou,
  isCurrentTurn,
  targetable,
  onSelectTarget,
  onInspectCard,
}) => {
  const personaDefId = player.personaId ? PERSONA_CATALOG[player.personaId].id : null;
  // Own base-role is always known to you; an INSPECTOR persona (always public, and exclusive to
  // the INSPECTOR base-role) already tells everyone the base-role too, so show it face-up openly
  // instead of as a hidden card — the engine sends `baseRole` non-null in both cases already.
  const baseRoleKnown = player.baseRoleRevealed || isYou || player.personaId === "INSPECTOR";

  return (
    <div
      className={[
        "player-seat",
        isCurrentTurn && "player-seat--current-turn",
        isYou && "player-seat--you",
        targetable && "player-seat--targetable",
        player.status === "404" && "player-seat--down",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={targetable ? onSelectTarget : undefined}
      role={targetable ? "button" : undefined}
    >
      <header className="player-seat__header">
        <span className="player-seat__connected-dot" data-connected={player.connected} title={player.connected ? "Đang kết nối" : "Mất kết nối"} />
        <span className="player-seat__name">
          {player.displayName}
          {isYou && <span className="player-seat__you-tag"> (Bạn)</span>}
        </span>
        {player.seatKind === "BOT" && (
          <span className="player-seat__bot-tag">BOT · {player.botLevel ?? "?"}</span>
        )}
      </header>

      <div className="player-seat__roles">
        <Card
          instanceId={`br-${player.id}`}
          defId={baseRoleKnown && player.baseRole ? baseRoleDefId(player.baseRole) : null}
          revealedType={CardType.BASE_ROLE}
          faceUp={baseRoleKnown}
          size="sm"
          onInspect={baseRoleKnown ? onInspectCard : undefined}
        />
        <Card
          instanceId={`pe-${player.id}`}
          defId={personaDefId}
          revealedType={CardType.PERSONA}
          faceUp={!!personaDefId}
          size="sm"
          onInspect={personaDefId ? onInspectCard : undefined}
        />
        <StatPips
          hp={player.hp}
          maxHp={player.maxHp}
          energy={player.energy}
          maxEnergy={player.maxEnergy}
          techLevel={player.techLevel}
          status={player.status}
          isAudit={player.isAudit}
          compact
        />
      </div>

      {player.defeatedBaseRoles.length > 0 && (
        <div className="player-seat__defeated">
          {player.defeatedBaseRoles.map((d, i) => {
            const Icon = getBaseRoleIcon(d.baseRole);
            return (
              <span key={i} className="player-seat__defeated-item" title={`${d.name} (${baseRoleLabel(d.baseRole)})`}>
                <Icon className="player-seat__defeated-icon" />
                {d.name}
              </span>
            );
          })}
        </div>
      )}

      <div className="player-seat__zone-row">
        <div className="player-seat__zone">
          <span className="player-seat__zone-label">Payload{!isYou ? ` (${player.handCount} tay)` : ""}</span>
          <div className="player-seat__zone-cards">
            {player.payloadZone.length === 0 && <span className="player-seat__zone-empty">—</span>}
            {player.payloadZone.map((c) => (
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
        <div className="player-seat__zone">
          <span className="player-seat__zone-label">Kit</span>
          <div className="player-seat__zone-cards">
            {player.kitZone.length === 0 && <span className="player-seat__zone-empty">—</span>}
            {player.kitZone.map((c) => (
              <Card
                key={c.instanceId}
                instanceId={c.instanceId}
                defId={c.defId}
                revealedType={c.revealedType}
                faceUp
                size="sm"
                onInspect={c.defId ? onInspectCard : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
