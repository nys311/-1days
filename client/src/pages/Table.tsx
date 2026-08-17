import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/useGameStore";
import { computeSeatPositions } from "../lib/seatLayout";
import { useActionComposer } from "../lib/useActionComposer";
import { sendAction } from "../lib/socket";
import { PlayerSeat } from "../components/PlayerSeat";
import { KernZone } from "../components/KernZone";
import { ServerZone } from "../components/ServerZone";
import { HandZone } from "../components/HandZone";
import { ActionBar } from "../components/ActionBar";
import { ReactionTimer } from "../components/ReactionTimer";
import { CardModal } from "../components/CardModal";
import { ThemeSwitcher } from "../theme";
import "./Table.css";

export const TablePage: React.FC = () => {
  const navigate = useNavigate();
  const playerView = useGameStore((s) => s.playerView);
  const socketConnected = useGameStore((s) => s.socketConnected);

  const [modalDefId, setModalDefId] = useState<string | null>(null);
  const [discardMode, setDiscardMode] = useState(false);
  const [discardSelection, setDiscardSelection] = useState<string[]>([]);
  const [logOpen, setLogOpen] = useState(false);

  const composer = useActionComposer(playerView?.roomId ?? null);

  const me = useMemo(
    () => playerView?.players.find((p) => p.id === playerView.you) ?? null,
    [playerView]
  );

  const positions = useMemo(() => {
    if (!playerView || !me) return [];
    return computeSeatPositions(playerView.players.length, me.seatIndex);
  }, [playerView, me]);

  if (!playerView || !me) {
    return (
      <div className="table-page table-page--empty">
        <p>Đang tải bàn chơi…</p>
        <button className="btn" onClick={() => navigate("/lobby")}>
          Quay lại Lobby
        </button>
      </div>
    );
  }

  function toggleDiscardMode() {
    setDiscardMode((v) => !v);
    setDiscardSelection([]);
  }

  function toggleDiscardSelect(instanceId: string) {
    setDiscardSelection((prev) =>
      prev.includes(instanceId) ? prev.filter((x) => x !== instanceId) : [...prev, instanceId]
    );
  }

  function confirmDiscard() {
    if (!playerView) return;
    sendAction(playerView.roomId, { type: "DISCARD", cardInstanceIds: discardSelection });
    setDiscardMode(false);
    setDiscardSelection([]);
  }

  function handToggleSelect(instanceId: string) {
    if (discardMode) {
      toggleDiscardSelect(instanceId);
      return;
    }
    if (!playerView) return;
    if (playerView.phase === "PREPARE") {
      composer.startPrepareSelf(instanceId);
    } else {
      composer.startPlayCard(instanceId);
    }
  }

  const awaitingPlayerTarget = composer.state.builder === "PLAY_CARD" && composer.state.awaitingPlayerTarget;
  const awaitingZoneTarget = composer.state.builder === "PLAY_CARD" && !composer.state.awaitingPlayerTarget;

  return (
    <div className="table-page">
      <header className="table-page__header">
        <div className="table-page__header-left">
          <span className="table-page__room-code">Phòng {playerView.roomId}</span>
          <span className="table-page__phase">
            Vòng {playerView.round} · Pha {phaseLabel(playerView.phase)}
          </span>
          <span className={`table-page__conn ${socketConnected ? "is-ok" : "is-bad"}`}>
            {socketConnected ? "● Đã kết nối" : "○ Mất kết nối"}
          </span>
        </div>
        <div className="table-page__header-right">
          <button className="btn btn--sm" onClick={() => setLogOpen((v) => !v)}>
            Nhật ký
          </button>
          <button className="btn btn--sm" onClick={() => navigate("/rules")}>
            Luật chơi
          </button>
          <ThemeSwitcher />
        </div>
      </header>

      <div className="table-page__board">
        <div className="table-page__center">
          <KernZone
            kern={playerView.kern}
            targetable={awaitingZoneTarget}
            onSelectTarget={() => composer.confirmTarget({ kind: "KERN" })}
            onInspectCard={setModalDefId}
          />
          <ServerZone
            server={playerView.server}
            targetable={awaitingZoneTarget}
            onSelectTarget={() => composer.confirmTarget({ kind: "SERVER" })}
            onInspectCard={setModalDefId}
          />
        </div>

        {playerView.players.map((p) => {
          const pos = positions[p.seatIndex];
          const isYou = p.id === me.id;
          const targetable = awaitingPlayerTarget && !isYou && p.status !== "404";
          return (
            <div key={p.id} className="table-page__seat-slot" style={pos ? { left: pos.left, top: pos.top } : undefined}>
              <PlayerSeat
                player={p}
                isYou={isYou}
                isCurrentTurn={playerView.currentPlayerId === p.id}
                targetable={targetable}
                onSelectTarget={() => composer.confirmTarget({ kind: "PLAYER", playerId: p.id })}
                onInspectCard={setModalDefId}
              />
            </div>
          );
        })}
      </div>

      {playerView.pendingReaction && (
        <ReactionTimer
          pendingReaction={playerView.pendingReaction}
          myId={me.id}
          hand={me.hand}
          roomId={playerView.roomId}
          players={playerView.players}
        />
      )}

      {logOpen && (
        <div className="table-page__log">
          <div className="table-page__log-header">
            <span>Nhật ký trận đấu</span>
            <button className="btn btn--sm btn--ghost" onClick={() => setLogOpen(false)}>
              Đóng
            </button>
          </div>
          <ul className="table-page__log-list">
            {playerView.log.slice(-60).map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <HandZone
        cards={me.hand}
        selectedIds={discardMode ? discardSelection : composer.state.cardInstanceId ? [composer.state.cardInstanceId] : []}
        onToggleSelect={handToggleSelect}
        onInspectCard={setModalDefId}
      />
      <ActionBar
        playerView={playerView}
        me={me}
        roomId={playerView.roomId}
        composer={composer}
        discardMode={discardMode}
        discardSelection={discardSelection}
        onToggleDiscardMode={toggleDiscardMode}
        onConfirmDiscard={confirmDiscard}
      />

      {playerView.winner && (
        <div className="table-page__winner-overlay">
          <div className="table-page__winner-card">
            <h2>{winnerLabel(playerView.winner.faction)}</h2>
            <p>{playerView.winner.reason}</p>
            <button className="btn btn--primary" onClick={() => navigate("/lobby")}>
              Về Lobby
            </button>
          </div>
        </div>
      )}

      <CardModal defId={modalDefId} onClose={() => setModalDefId(null)} />
    </div>
  );
};

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    DRAW: "Bốc bài",
    PREPARE: "Chuẩn bị",
    DECRYPT: "Giải mã",
    AUDIT_RECLAIM: "Rút lá Audit",
    ACTION: "Hành động",
    REWARD: "Nhận thưởng",
    DISCARD: "Bỏ bài",
    END_TURN: "Hết lượt",
    SHUFFLE_PAYLOAD: "Server Check — Xáo lá",
    UPGRADE: "Server Check — Nâng cấp",
    LOBBY: "Chờ bắt đầu",
    GAME_OVER: "Kết thúc",
  };
  return map[phase] ?? phase;
}

function winnerLabel(faction: string): string {
  switch (faction) {
    case "WHITEHAT_INSPECTOR":
      return "WHITE HAT & INSPECTOR THẮNG";
    case "BLACKHAT":
      return "BLACK HAT THẮNG";
    case "INSIDER":
      return "INSIDER THẮNG";
    default:
      return "TRẬN ĐẤU KẾT THÚC";
  }
}
