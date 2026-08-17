import React from "react";
import { PlayerStatus } from "@minus1days/shared";
import "./StatPips.css";

export interface StatPipsProps {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  techLevel: number;
  status: PlayerStatus;
  isAudit?: boolean;
  compact?: boolean;
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) * 100 : 0;
  return (
    <div className={`stat-pips__bar ${className}`}>
      <div className="stat-pips__bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export const StatPips: React.FC<StatPipsProps> = ({
  hp,
  maxHp,
  energy,
  maxEnergy,
  techLevel,
  status,
  isAudit,
  compact,
}) => {
  const downed = status === PlayerStatus.DOWN;
  return (
    <div className={`stat-pips ${compact ? "stat-pips--compact" : ""} ${downed ? "stat-pips--down" : ""}`}>
      {downed ? (
        <div className="stat-pips__down-tag">404 — ĐÃ HẠ GỤC</div>
      ) : (
        <>
          <div className="stat-pips__row">
            <span className="stat-pips__icon stat-pips__icon--hp">♥</span>
            <Bar value={hp} max={maxHp} className="stat-pips__bar--hp" />
            <span className="stat-pips__num">
              {hp}/{maxHp}
            </span>
          </div>
          <div className="stat-pips__row">
            <span className="stat-pips__icon stat-pips__icon--energy">⚡</span>
            <Bar value={energy} max={maxEnergy} className="stat-pips__bar--energy" />
            <span className="stat-pips__num">
              {energy}/{maxEnergy}
            </span>
          </div>
          <div className="stat-pips__row">
            <span className="stat-pips__icon stat-pips__icon--tech">◆</span>
            <span className="stat-pips__num stat-pips__num--tech">TL {techLevel}</span>
            {isAudit && <span className="stat-pips__audit-tag">AUDIT</span>}
          </div>
        </>
      )}
    </div>
  );
};
