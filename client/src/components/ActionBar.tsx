import React, { useState } from "react";
import { PersonaId, RoundPhase, type PlayerView, type VisiblePlayer } from "@minus1days/shared";
import type { ActionComposer } from "../lib/useActionComposer";
import { safeGetCardDef } from "../lib/cardHelpers";
import { sendAction } from "../lib/socket";
import { Card } from "./Card";
import "./ActionBar.css";

export interface ActionBarProps {
  playerView: PlayerView;
  me: VisiblePlayer;
  roomId: string;
  composer: ActionComposer;
  discardMode: boolean;
  discardSelection: string[];
  onToggleDiscardMode: () => void;
  onConfirmDiscard: () => void;
}

type SecondaryKind = "AUDIT" | "PEEK" | "BOOLE" | "EVE" | "GIFT" | "COERCE" | null;

export const ActionBar: React.FC<ActionBarProps> = ({
  playerView,
  me,
  roomId,
  composer,
  discardMode,
  discardSelection,
  onToggleDiscardMode,
  onConfirmDiscard,
}) => {
  const [secondary, setSecondary] = useState<SecondaryKind>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string>("");
  const [pickedCardIds, setPickedCardIds] = useState<string[]>([]);
  const [booleGive, setBooleGive] = useState<"TWO_DEFEND_FOR_ATTACK" | "TWO_ATTACK_FOR_DEFEND">(
    "TWO_DEFEND_FOR_ATTACK"
  );
  const [coerceChoice, setCoerceChoice] = useState<"STEAL_TWO" | "FLIP_ONE">("STEAL_TWO");

  const isMyTurn = playerView.currentPlayerId === playerView.you;
  const phase = playerView.phase;
  const others = playerView.players.filter((p) => p.id !== me.id && p.status !== "404");

  const tableCards = [
    ...playerView.players.flatMap((p) => [
      ...p.payloadZone.map((card) => ({ card, ownerName: `${p.displayName} (Payload)` })),
      ...p.kitZone.map((card) => ({ card, ownerName: `${p.displayName} (Kit)` })),
    ]),
    ...playerView.server.zone.map((card) => ({ card, ownerName: "SERVER" })),
  ];

  function closeSecondary() {
    setSecondary(null);
    setTargetPlayerId("");
    setPickedCardIds([]);
  }

  function openSecondary(kind: SecondaryKind) {
    composer.cancel();
    setSecondary(kind);
    setTargetPlayerId(others[0]?.id ?? "");
    setPickedCardIds([]);
  }

  const kernCoerceCard = me.hand.find((c) => c.defId === "KERN_COERCE");
  const cardName = (id: string | null) => (id ? safeGetCardDef(me.hand.find((c) => c.instanceId === id)?.defId ?? "")?.name : null);

  const builderCardDefId = composer.state.cardInstanceId
    ? me.hand.find((c) => c.instanceId === composer.state.cardInstanceId)?.defId ?? null
    : null;
  const builderCardDef = builderCardDefId ? safeGetCardDef(builderCardDefId) : null;

  return (
    <div className="action-bar">
      {playerView.legalActionHint.length > 0 && (
        <div className="action-bar__hints">
          {playerView.legalActionHint.map((hint, i) => (
            <span key={i} className="action-bar__hint-chip">
              {hint}
            </span>
          ))}
        </div>
      )}

      {/* ---------- PLAY_CARD / PREPARE_SELF builder ---------- */}
      {composer.state.builder && (
        <div className="action-bar__builder">
          <div className="action-bar__builder-row">
            <span>
              Đang thao tác: <strong>{builderCardDef?.name ?? "lá bài"}</strong>
            </span>
            <button className="btn btn--sm btn--ghost" onClick={composer.cancel}>
              Hủy
            </button>
          </div>

          {composer.state.builder === "PLAY_CARD" &&
            !composer.state.awaitingPlayerTarget &&
            (builderCardDef?.subtype === "RANSOMWARE" || builderCardDef?.subtype === "ZERODAY") && (
              <>
                <p className="action-bar__note">
                  Chọn 1 lá bất kỳ trên bàn (kể cả lá úp — bạn chỉ cần biết vị trí, không cần biết nội dung) để{" "}
                  {builderCardDef.subtype === "RANSOMWARE" ? "huỷ" : "cướp"}:
                </p>
                <div className="action-bar__card-picker">
                  {tableCards.map(({ card, ownerName }) => (
                    <div key={card.instanceId} className="action-bar__table-card">
                      <Card
                        instanceId={card.instanceId}
                        defId={card.defId}
                        revealedType={card.revealedType}
                        faceUp={card.face === "FACE_UP"}
                        size="sm"
                        onClick={() => composer.confirmCardTarget(card.instanceId)}
                      />
                      <span className="action-bar__table-card-owner">{ownerName}</span>
                    </div>
                  ))}
                  {tableCards.length === 0 && <span className="action-bar__note">Không có lá nào để chọn.</span>}
                </div>
              </>
            )}

          {composer.state.builder === "PLAY_CARD" &&
            !composer.state.awaitingPlayerTarget &&
            builderCardDef?.subtype !== "RANSOMWARE" &&
            builderCardDef?.subtype !== "ZERODAY" && (
              <>
                <div className="action-bar__builder-row">
                  <span className="action-bar__label">Mặt bài:</span>
                  <button
                    className={`btn btn--sm ${composer.state.faceUp ? "btn--primary" : ""}`}
                    onClick={() => composer.setFaceUp(true)}
                  >
                    Ngửa (HTTP)
                  </button>
                  <button
                    className={`btn btn--sm ${!composer.state.faceUp ? "btn--primary" : ""}`}
                    onClick={() => composer.setFaceUp(false)}
                  >
                    Úp (HTTPS)
                  </button>
                </div>
                <div className="action-bar__builder-row">
                  <span className="action-bar__label">Mục tiêu:</span>
                  <button className="btn btn--sm" onClick={() => composer.confirmTarget({ kind: "SELF" })}>
                    Bản thân
                  </button>
                  <button className="btn btn--sm" onClick={() => composer.beginPlayerTargeting()}>
                    Người chơi khác…
                  </button>
                  <button className="btn btn--sm" onClick={() => composer.confirmTarget({ kind: "SERVER" })}>
                    Server
                  </button>
                  <button className="btn btn--sm" onClick={() => composer.confirmTarget({ kind: "KERN" })}>
                    THE KERN
                  </button>
                </div>
              </>
            )}

          {composer.state.builder === "PLAY_CARD" && composer.state.awaitingPlayerTarget && (
            <p className="action-bar__note">Chọn một người chơi trên bàn để nhắm mục tiêu.</p>
          )}

          {composer.state.builder === "PREPARE_SELF" && (
            <div className="action-bar__builder-row">
              <button className="btn btn--sm btn--primary" onClick={() => composer.confirmTarget({ kind: "SELF" })}>
                Xác nhận CHUẨN BỊ (chỉ tác dụng lên bản thân)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------- discard mode ---------- */}
      {discardMode && (
        <div className="action-bar__builder">
          <div className="action-bar__builder-row">
            <span>Chọn các lá muốn bỏ ({discardSelection.length} đã chọn)</span>
            <button className="btn btn--sm btn--primary" disabled={discardSelection.length === 0} onClick={onConfirmDiscard}>
              Xác nhận bỏ bài
            </button>
            <button className="btn btn--sm btn--ghost" onClick={onToggleDiscardMode}>
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ---------- secondary ability forms ---------- */}
      {secondary === "AUDIT" && (
        <SecondaryForm title="AUDIT — chọn người chơi để thanh tra" onCancel={closeSecondary}>
          <PlayerSelect players={others} value={targetPlayerId} onChange={setTargetPlayerId} />
          <button
            className="btn btn--sm btn--primary"
            disabled={!targetPlayerId}
            onClick={() => {
              sendAction(roomId, { type: "INSPECTOR_AUDIT", targetPlayerId });
              closeSecondary();
            }}
          >
            Xác nhận Audit (-1 Năng lượng)
          </button>
        </SecondaryForm>
      )}

      {secondary === "PEEK" && (
        <SecondaryForm title="TURING PEEK — chọn 1 lá úp của bạn để xem trộm" onCancel={closeSecondary}>
          <div className="action-bar__card-picker">
            {me.payloadZone
              .filter((c) => c.defId)
              .map((c) => (
                <Card
                  key={c.instanceId}
                  instanceId={c.instanceId}
                  defId={c.defId}
                  revealedType={c.revealedType}
                  faceUp
                  size="sm"
                  selected={pickedCardIds[0] === c.instanceId}
                  onClick={() => setPickedCardIds([c.instanceId])}
                />
              ))}
            {me.payloadZone.length === 0 && <span className="action-bar__note">Chưa có lá úp nào trong PAYLOAD ZONE.</span>}
          </div>
          <button
            className="btn btn--sm btn--primary"
            disabled={!pickedCardIds[0]}
            onClick={() => {
              sendAction(roomId, { type: "TURING_PEEK", cardInstanceId: pickedCardIds[0] });
              closeSecondary();
            }}
          >
            Xem trộm (-1 Năng lượng)
          </button>
        </SecondaryForm>
      )}

      {secondary === "BOOLE" && (
        <SecondaryForm title="BOOLE EXCHANGE — đổi bài lúc BỐC BÀI" onCancel={closeSecondary}>
          <div className="action-bar__builder-row">
            <button
              className={`btn btn--sm ${booleGive === "TWO_DEFEND_FOR_ATTACK" ? "btn--primary" : ""}`}
              onClick={() => setBooleGive("TWO_DEFEND_FOR_ATTACK")}
            >
              2 DEFEND → 1 ATTACK
            </button>
            <button
              className={`btn btn--sm ${booleGive === "TWO_ATTACK_FOR_DEFEND" ? "btn--primary" : ""}`}
              onClick={() => setBooleGive("TWO_ATTACK_FOR_DEFEND")}
            >
              2 ATTACK → 1 DEFEND
            </button>
          </div>
          <div className="action-bar__card-picker">
            {me.hand
              .filter((c) => {
                const sub = c.defId ? safeGetCardDef(c.defId)?.subtype : null;
                const need = booleGive === "TWO_DEFEND_FOR_ATTACK" ? "DEFEND" : "ATTACK";
                return sub === need || (need === "ATTACK" && String(sub).startsWith("ATTACK"));
              })
              .map((c) => (
                <Card
                  key={c.instanceId}
                  instanceId={c.instanceId}
                  defId={c.defId}
                  revealedType={c.revealedType}
                  faceUp
                  size="sm"
                  selected={pickedCardIds.includes(c.instanceId)}
                  onClick={() =>
                    setPickedCardIds((prev) =>
                      prev.includes(c.instanceId)
                        ? prev.filter((x) => x !== c.instanceId)
                        : prev.length < 2
                          ? [...prev, c.instanceId]
                          : prev
                    )
                  }
                />
              ))}
          </div>
          <button
            className="btn btn--sm btn--primary"
            disabled={pickedCardIds.length !== 2}
            onClick={() => {
              sendAction(roomId, {
                type: "DRAW_BOOLE_EXCHANGE",
                give: booleGive,
                cardInstanceIds: [pickedCardIds[0], pickedCardIds[1]],
              });
              closeSecondary();
            }}
          >
            Xác nhận đổi bài
          </button>
        </SecondaryForm>
      )}

      {secondary === "EVE" && (
        <SecondaryForm title="EVE TRANSFER — chuyển 1 lá úp của bạn cho người khác (-2 Máu)" onCancel={closeSecondary}>
          <div className="action-bar__card-picker">
            {me.payloadZone
              .filter((c) => c.defId)
              .map((c) => (
                <Card
                  key={c.instanceId}
                  instanceId={c.instanceId}
                  defId={c.defId}
                  revealedType={c.revealedType}
                  faceUp
                  size="sm"
                  selected={pickedCardIds[0] === c.instanceId}
                  onClick={() => setPickedCardIds([c.instanceId])}
                />
              ))}
          </div>
          <PlayerSelect players={others} value={targetPlayerId} onChange={setTargetPlayerId} />
          <button
            className="btn btn--sm btn--primary"
            disabled={!pickedCardIds[0] || !targetPlayerId}
            onClick={() => {
              sendAction(roomId, { type: "EVE_TRANSFER", cardInstanceId: pickedCardIds[0], targetPlayerId });
              closeSecondary();
            }}
          >
            Xác nhận chuyển lá (-2 Máu)
          </button>
        </SecondaryForm>
      )}

      {secondary === "GIFT" && (
        <SecondaryForm title="TẶNG BÀI — chọn lá và người nhận" onCancel={closeSecondary}>
          <div className="action-bar__card-picker">
            {me.hand.map((c) => (
              <Card
                key={c.instanceId}
                instanceId={c.instanceId}
                defId={c.defId}
                revealedType={c.revealedType}
                faceUp
                size="sm"
                selected={pickedCardIds[0] === c.instanceId}
                onClick={() => setPickedCardIds([c.instanceId])}
              />
            ))}
          </div>
          <PlayerSelect players={others} value={targetPlayerId} onChange={setTargetPlayerId} />
          <button
            className="btn btn--sm btn--primary"
            disabled={!pickedCardIds[0] || !targetPlayerId}
            onClick={() => {
              sendAction(roomId, { type: "GIFT_CARD", cardInstanceId: pickedCardIds[0], targetPlayerId });
              closeSecondary();
            }}
          >
            Xác nhận tặng {cardName(pickedCardIds[0]) ? `(${cardName(pickedCardIds[0])})` : ""}
          </button>
        </SecondaryForm>
      )}

      {secondary === "COERCE" && kernCoerceCard && (
        <SecondaryForm title="DÂN CHỦ — uy hiếp 1 người chơi" onCancel={closeSecondary}>
          <PlayerSelect players={others} value={targetPlayerId} onChange={setTargetPlayerId} />
          <div className="action-bar__builder-row">
            <button
              className={`btn btn--sm ${coerceChoice === "STEAL_TWO" ? "btn--primary" : ""}`}
              onClick={() => setCoerceChoice("STEAL_TWO")}
            >
              Cướp 2 lá bất kỳ
            </button>
            <button
              className={`btn btn--sm ${coerceChoice === "FLIP_ONE" ? "btn--primary" : ""}`}
              onClick={() => setCoerceChoice("FLIP_ONE")}
            >
              Lật 1 lá bất kỳ
            </button>
          </div>
          <button
            className="btn btn--sm btn--primary"
            disabled={!targetPlayerId}
            onClick={() => {
              sendAction(roomId, {
                type: "KERN_COERCE_CHOICE",
                targetPlayerId,
                choice: coerceChoice,
              });
              closeSecondary();
            }}
          >
            Thi hành
          </button>
        </SecondaryForm>
      )}

      {/* ---------- quick action row ---------- */}
      {!composer.state.builder && !discardMode && !secondary && (
        <div className="action-bar__quick-row">
          <button className="btn btn--primary" onClick={() => sendAction(roomId, { type: "END_PHASE" })}>
            Kết thúc pha
          </button>
          <button className="btn" onClick={onToggleDiscardMode}>
            Bỏ bài
          </button>
          <button className="btn" onClick={() => openSecondary("GIFT")} disabled={me.hand.length === 0 || others.length === 0}>
            Tặng bài
          </button>
          {me.personaId === PersonaId.INSPECTOR && (
            <button className="btn" onClick={() => openSecondary("AUDIT")} disabled={others.length === 0}>
              Audit
            </button>
          )}
          {me.personaId === PersonaId.TURING && phase === RoundPhase.DECRYPT && (
            <button className="btn" onClick={() => openSecondary("PEEK")}>
              Nhìn trộm
            </button>
          )}
          {me.personaId === PersonaId.BOOLE && phase === RoundPhase.DRAW && (
            <button className="btn" onClick={() => openSecondary("BOOLE")}>
              Đổi bài (Boole)
            </button>
          )}
          {me.personaId === PersonaId.EVE && (
            <button className="btn" onClick={() => openSecondary("EVE")} disabled={others.length === 0}>
              Chuyển lá úp
            </button>
          )}
          {kernCoerceCard && (
            <button className="btn btn--danger" onClick={() => openSecondary("COERCE")} disabled={others.length === 0}>
              Thi hành Dân chủ
            </button>
          )}
          {!isMyTurn && <span className="action-bar__not-your-turn">Chưa đến lượt bạn</span>}
        </div>
      )}
    </div>
  );
};

const SecondaryForm: React.FC<{ title: string; onCancel: () => void; children: React.ReactNode }> = ({
  title,
  onCancel,
  children,
}) => (
  <div className="action-bar__builder">
    <div className="action-bar__builder-row">
      <strong>{title}</strong>
      <button className="btn btn--sm btn--ghost" onClick={onCancel}>
        Hủy
      </button>
    </div>
    {children}
  </div>
);

const PlayerSelect: React.FC<{ players: VisiblePlayer[]; value: string; onChange: (id: string) => void }> = ({
  players,
  value,
  onChange,
}) => (
  <select className="action-bar__select" value={value} onChange={(e) => onChange(e.target.value)}>
    {players.map((p) => (
      <option key={p.id} value={p.id}>
        {p.displayName}
      </option>
    ))}
  </select>
);
