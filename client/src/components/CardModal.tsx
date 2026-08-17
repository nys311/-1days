import React, { useEffect } from "react";
import { CardType } from "@minus1days/shared";
import { findPersonaEntryByDefId, getPersonaPortraitUrl, safeGetCardDef } from "../lib/cardHelpers";
import { typeAccentVar, subtypeAccentVar } from "../lib/themeVars";
import { getActionSubtypeIcon, getCardTypeIcon, getKitSubtypeIcon } from "../assets/cards/icons";
import "./CardModal.css";

export interface CardModalProps {
  defId: string | null;
  onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ defId, onClose }) => {
  useEffect(() => {
    if (!defId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [defId, onClose]);

  if (!defId) return null;
  const def = safeGetCardDef(defId);
  if (!def) return null;

  const persona = def.type === CardType.PERSONA ? findPersonaEntryByDefId(def.id) : null;
  const portraitUrl = persona ? getPersonaPortraitUrl(persona.personaId) : null;
  const accent = typeAccentVar(def.type);
  const subtypeAccent = def.subtype ? subtypeAccentVar(def.subtype) : accent;
  const TypeGlyph = getCardTypeIcon(def.type);
  const SubtypeIcon = def.subtype
    ? def.type === CardType.KIT
      ? getKitSubtypeIcon(def.subtype as any)
      : getActionSubtypeIcon(def.subtype as any)
    : null;

  return (
    <div className="card-modal-backdrop" onClick={onClose}>
      <div
        className="card-modal"
        style={{ "--card-accent": accent } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="card-modal__close" onClick={onClose} aria-label="Đóng">
          ✕
        </button>

        <div className="card-modal__art">
          {portraitUrl ? (
            <img src={portraitUrl} alt="" className="card-modal__portrait" />
          ) : (
            <TypeGlyph className="card-modal__art-icon" />
          )}
          {SubtypeIcon && (
            <div className="card-modal__subtype-badge" style={{ color: subtypeAccent, borderColor: subtypeAccent }}>
              <SubtypeIcon className="card-modal__subtype-icon" />
            </div>
          )}
          {typeof def.value === "number" && <div className="card-modal__value">{def.value}</div>}
        </div>

        <div className="card-modal__body">
          <div className="card-modal__type-tag">{typeLabel(def.type)}</div>
          <h2 className="card-modal__name">{def.name}</h2>
          {persona && (
            <>
              <div className="card-modal__persona-title">{persona.title}</div>
              <p className="card-modal__quote">&ldquo;{persona.quote}&rdquo;</p>
              <div className="card-modal__stat-row">
                <span>♥ HP {persona.hp}</span>
                <span>⚡ Năng lượng {persona.energy}</span>
                <span>◆ Tech Level {persona.techLevel}</span>
              </div>
            </>
          )}
          <p className="card-modal__description">{def.description}</p>
        </div>
      </div>
    </div>
  );
};

function typeLabel(type: CardType): string {
  switch (type) {
    case CardType.BASE_ROLE:
      return "Base Role";
    case CardType.PERSONA:
      return "Persona";
    case CardType.ACTION:
      return "Action";
    case CardType.KIT:
      return "Kit";
    case CardType.FLAG:
      return "THE KERN — Flag";
    case CardType.TOKEN:
      return "Token";
    default:
      return type;
  }
}
