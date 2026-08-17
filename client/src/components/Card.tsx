import React from "react";
import { ActionSubtype, CardType, KitSubtype } from "@minus1days/shared";
import { findPersonaEntryByDefId, getPersonaPortraitUrl, safeGetCardDef } from "../lib/cardHelpers";
import { typeAccentVar, subtypeAccentVar } from "../lib/themeVars";
import { getActionSubtypeIcon, getCardTypeIcon, getKitSubtypeIcon } from "../assets/cards/icons";
import "./Card.css";

export type CardHighlight = "target" | "danger" | "audit";
export type CardSize = "sm" | "md" | "lg";

export interface CardProps {
  /** Unique instance id — not rendered, but a stable React key upstream. */
  instanceId: string;
  /** null = identity hidden from this viewer; never fabricate a name/value in that case. */
  defId: string | null;
  /** Coarse type visible on the back even when defId is hidden. */
  revealedType: CardType | null;
  /** Physical face-up/face-down state. Front only ever renders when this AND defId is known. */
  faceUp: boolean;
  size?: CardSize;
  selected?: boolean;
  disabled?: boolean;
  highlight?: CardHighlight;
  /** Primary click — typically "select this card" in the action builder. */
  onClick?: () => void;
  /** Opens the full-detail modal. Only offered when the identity is known. */
  onInspect?: (defId: string) => void;
}

export const Card: React.FC<CardProps> = ({
  defId,
  revealedType,
  faceUp,
  size = "md",
  selected,
  disabled,
  highlight,
  onClick,
  onInspect,
}) => {
  const known = defId !== null;
  const def = known ? safeGetCardDef(defId as string) : null;
  const type = def?.type ?? revealedType;
  const persona = def && def.type === CardType.PERSONA ? findPersonaEntryByDefId(def.id) : null;
  const portraitUrl = persona ? getPersonaPortraitUrl(persona.personaId) : null;
  const showFront = known && faceUp && !!def;

  const TypeGlyph = getCardTypeIcon(type ?? CardType.ACTION);
  const SubtypeIcon = def?.subtype
    ? def.type === CardType.KIT
      ? getKitSubtypeIcon(def.subtype as KitSubtype)
      : getActionSubtypeIcon(def.subtype as ActionSubtype)
    : null;

  const accent = type ? typeAccentVar(type) : "var(--text-muted)";
  const subtypeAccent = def?.subtype ? subtypeAccentVar(def.subtype) : accent;

  const classNames = [
    "card",
    `card--${size}`,
    showFront ? "card--front-active" : "card--back-active",
    selected && "card--selected",
    disabled && "card--disabled",
    highlight && `card--highlight-${highlight}`,
    onClick && "card--clickable",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classNames}
      style={{ "--card-accent": accent } as React.CSSProperties}
      onClick={disabled ? undefined : onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <div className="card__flipper">
        <div className="card__face card__face--back">
          <TypeGlyph className="card__back-glyph" />
          {known && SubtypeIcon && <SubtypeIcon className="card__back-subtype" style={{ color: subtypeAccent }} />}
        </div>

        <div className="card__face card__face--front">
          {def && (
            <>
              <div className="card__art">
                {portraitUrl ? (
                  <img src={portraitUrl} alt="" className="card__portrait" />
                ) : (
                  <TypeGlyph className="card__art-icon" />
                )}
              </div>
              {SubtypeIcon && (
                <div className="card__subtype-badge" style={{ color: subtypeAccent, borderColor: subtypeAccent }}>
                  <SubtypeIcon className="card__subtype-badge-icon" />
                </div>
              )}
              {typeof def.value === "number" && <div className="card__value-badge">{def.value}</div>}
              {persona && (
                <div className="card__persona-stats">
                  <span title="HP">♥{persona.hp}</span>
                  <span title="Năng lượng">⚡{persona.energy}</span>
                  <span title="Tech Level">◆{persona.techLevel}</span>
                </div>
              )}
              <div className="card__name-plate">{def.name}</div>
            </>
          )}
        </div>
      </div>

      {known && onInspect && (
        <button
          type="button"
          className="card__inspect-btn"
          onClick={(e) => {
            e.stopPropagation();
            onInspect(defId as string);
          }}
          aria-label="Xem chi tiết lá bài"
        >
          i
        </button>
      )}
    </div>
  );
};
