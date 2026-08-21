import React, { useEffect, useMemo, useState } from "react";
import type { PlayerView, VisibleCard, VisiblePlayer } from "@minus1days/shared";
import { safeGetCardDef } from "../lib/cardHelpers";
import { Card } from "./Card";
import { sendAction } from "../lib/socket";
import "./ReactionTimer.css";

export interface ReactionTimerProps {
  pendingReaction: NonNullable<PlayerView["pendingReaction"]>;
  myId: string;
  hand: VisibleCard[];
  roomId: string;
  players: VisiblePlayer[];
}

function nameOf(players: VisiblePlayer[], id: string | null): string {
  if (!id) return "—";
  return players.find((p) => p.id === id)?.displayName ?? id;
}

const KIND_LABEL: Record<string, string> = {
  SERVER_ATTACK: "tấn công SERVER / THE KERN",
  PLAYER_ATTACK: "tấn công người chơi",
};

export const ReactionTimer: React.FC<ReactionTimerProps> = ({ pendingReaction, myId, hand, roomId, players }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, (pendingReaction.deadlineMs - now) / 1000);
  const urgent = secondsLeft <= 3;

  const canDefend = pendingReaction.kind === "PLAYER_ATTACK" && pendingReaction.targetId === myId;
  // DENY can block a player attack, or protect the SERVER/THE KERN in every case — any
  // holder can play it, not only the direct target.
  const canDeny = true;

  const defendCards = useMemo(
    () => hand.filter((c) => c.defId && safeGetCardDef(c.defId)?.subtype === "DEFEND"),
    [hand]
  );
  const denyCards = useMemo(() => hand.filter((c) => c.defId && safeGetCardDef(c.defId)?.subtype === "DENY"), [hand]);

  return (
    <div className={`reaction-timer ${urgent ? "reaction-timer--urgent" : ""}`}>
      <div className="reaction-timer__header">
        <span className="reaction-timer__title">Cửa sổ phản ứng</span>
        <span className="reaction-timer__seconds">{secondsLeft.toFixed(1)}s</span>
      </div>
      <div className="reaction-timer__bar-track">
        <div
          className="reaction-timer__bar-fill"
          style={{ width: `${Math.min(100, (secondsLeft / Math.max(1, secondsLeft)) * 100)}%` }}
        />
      </div>
      <p className="reaction-timer__desc">
        <strong>{nameOf(players, pendingReaction.attackerId)}</strong> đang {KIND_LABEL[pendingReaction.kind] ?? "hành động"}
        {pendingReaction.targetId ? (
          <>
            {" "}
            nhắm vào <strong>{nameOf(players, pendingReaction.targetId)}</strong>
          </>
        ) : null}
        .
      </p>

      <div className="reaction-timer__options">
        {canDefend && defendCards.length > 0 && (
          <div className="reaction-timer__group">
            <span className="reaction-timer__group-label">Phòng thủ (DEFEND)</span>
            <div className="reaction-timer__cards">
              {defendCards.map((c) => (
                <Card
                  key={c.instanceId}
                  instanceId={c.instanceId}
                  defId={c.defId}
                  revealedType={c.revealedType}
                  faceUp
                  size="sm"
                  onClick={() =>
                    sendAction(roomId, { type: "REACT_DEFEND", reactionId: pendingReaction.id, cardInstanceId: c.instanceId })
                  }
                />
              ))}
            </div>
          </div>
        )}
        {canDeny && denyCards.length > 0 && (
          <div className="reaction-timer__group">
            <span className="reaction-timer__group-label">Rút điện (DENY)</span>
            <div className="reaction-timer__cards">
              {denyCards.map((c) => (
                <Card
                  key={c.instanceId}
                  instanceId={c.instanceId}
                  defId={c.defId}
                  revealedType={c.revealedType}
                  faceUp
                  size="sm"
                  onClick={() =>
                    sendAction(roomId, { type: "REACT_DENY", reactionId: pendingReaction.id, cardInstanceId: c.instanceId })
                  }
                />
              ))}
            </div>
          </div>
        )}
        {!(canDefend && defendCards.length > 0) && !(canDeny && denyCards.length > 0) && (
          <span className="reaction-timer__none">Bạn không có lá phản ứng phù hợp.</span>
        )}
      </div>
    </div>
  );
};
