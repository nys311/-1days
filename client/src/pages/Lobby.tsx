import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin, GoogleOAuthProvider, type CredentialResponse } from "@react-oauth/google";
import { BotLevel, type LobbyStateSeat } from "@minus1days/shared";
import { useGameStore } from "../store/useGameStore";
import { ALLOW_DEV_LOGIN, GOOGLE_CLIENT_ID } from "../lib/config";
import { loginDev, loginWithGoogle } from "../lib/api";
import { addBot, connectSocket, createRoom, joinRoom, quickJoin, startGame } from "../lib/socket";
import { ThemeSwitcher } from "../theme";
import "./Lobby.css";

const BOT_LEVEL_LABEL: Record<BotLevel, string> = {
  [BotLevel.RANDOM]: "Ngẫu nhiên",
  [BotLevel.RULE]: "Luật cơ bản",
  [BotLevel.ALPHA_BETA]: "Alpha-Beta (thử nghiệm)",
};

export const LobbyPage: React.FC = () => {
  const navigate = useNavigate();
  // Individual selectors (not one object-returning selector) so each subscription is
  // independently comparable and the component only re-renders when a field it
  // actually reads changes.
  const token = useGameStore((s) => s.token);
  const user = useGameStore((s) => s.user);
  const setAuth = useGameStore((s) => s.setAuth);
  const lobbyState = useGameStore((s) => s.lobbyState);
  const playerView = useGameStore((s) => s.playerView);
  const lastError = useGameStore((s) => s.lastError);
  const setError = useGameStore((s) => s.setError);

  const [devName, setDevName] = useState("");
  const [busy, setBusy] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [joinCode, setJoinCode] = useState("");
  const [queueStatus, setQueueStatus] = useState<"idle" | "queued">("idle");
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [addBotLevel, setAddBotLevel] = useState<BotLevel>(BotLevel.RULE);

  // Keep exactly one socket connection alive for as long as we have a session token.
  useEffect(() => {
    if (token) connectSocket(token);
  }, [token]);

  // Once the engine has actually started the game, a `game:state` PlayerView shows up.
  useEffect(() => {
    if (playerView) navigate("/table");
  }, [playerView, navigate]);

  async function handleGoogleSuccess(cred: CredentialResponse) {
    if (!cred.credential) return;
    setBusy(true);
    setError(null);
    try {
      const res = await loginWithGoogle(cred.credential);
      setAuth(res.token, res.user);
    } catch (err) {
      setError({ code: "LOGIN_FAILED", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleDevLogin() {
    if (!devName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await loginDev(devName.trim());
      setAuth(res.token, res.user);
    } catch (err) {
      setError({ code: "LOGIN_FAILED", message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickJoin() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const res = await quickJoin({ displayName: user.displayName });
      if (res?.playerId) setMyPlayerId(res.playerId);
      setQueueStatus(res?.status === "queued" ? "queued" : "idle");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateRoom() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createRoom({ displayName: user.displayName, maxPlayers });
      if (res?.playerId) setMyPlayerId(res.playerId);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom() {
    if (!user || !joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinRoom({ code: joinCode.trim().toUpperCase(), displayName: user.displayName });
      if (res?.playerId) setMyPlayerId(res.playerId);
    } finally {
      setBusy(false);
    }
  }

  // ---------------------------------------------------------------------
  // 1. Not logged in
  // ---------------------------------------------------------------------
  if (!token || !user) {
    return (
      <div className="lobby-page lobby-page--center">
        <div className="lobby-brand">
          <h1>-1 DAYS</h1>
          <p>Board game chủ đề cyber security cho 2-8 người chơi.</p>
        </div>
        <div className="panel lobby-login-card">
          {lastError && <div className="lobby-error">{lastError.message}</div>}
          {GOOGLE_CLIENT_ID ? (
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError({ code: "GOOGLE", message: "Đăng nhập Google thất bại" })} theme="filled_black" />
            </GoogleOAuthProvider>
          ) : (
            <p className="lobby-hint">VITE_GOOGLE_CLIENT_ID chưa được cấu hình — dùng đăng nhập nhanh bên dưới.</p>
          )}

          {ALLOW_DEV_LOGIN && (
            <div className="lobby-dev-login">
              <div className="lobby-divider">hoặc</div>
              <div className="field">
                <label htmlFor="dev-name">Đăng nhập nhanh (Dev)</label>
                <input
                  id="dev-name"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder="Tên hiển thị"
                  onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                />
              </div>
              <button className="btn btn--primary" disabled={busy || !devName.trim()} onClick={handleDevLogin}>
                Vào game
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // 2. Logged in, no room yet
  // ---------------------------------------------------------------------
  if (!lobbyState) {
    return (
      <div className="lobby-page lobby-page--center">
        <header className="lobby-header">
          <span>
            Xin chào, <strong>{user.displayName}</strong>
          </span>
          <ThemeSwitcher />
        </header>
        {lastError && <div className="lobby-error">{lastError.message}</div>}
        <div className="lobby-home-grid">
          <div className="panel lobby-card">
            <h3>Ghép trận nhanh</h3>
            <p>Vào hàng chờ công khai, tự ghép với người chơi khác.</p>
            <button className="btn btn--primary" disabled={busy} onClick={handleQuickJoin}>
              {queueStatus === "queued" ? "Đang tìm trận…" : "Quick Match"}
            </button>
          </div>

          <div className="panel lobby-card">
            <h3>Tạo phòng riêng</h3>
            <div className="field">
              <label htmlFor="max-players">Số người chơi tối đa: {maxPlayers}</label>
              <input
                id="max-players"
                type="range"
                min={2}
                max={8}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>
            <button className="btn btn--primary" disabled={busy} onClick={handleCreateRoom}>
              Tạo phòng
            </button>
          </div>

          <div className="panel lobby-card">
            <h3>Vào phòng bằng mã</h3>
            <div className="field">
              <label htmlFor="join-code">Mã phòng</label>
              <input
                id="join-code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="VD: AB12CD"
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              />
            </div>
            <button className="btn btn--primary" disabled={busy || !joinCode.trim()} onClick={handleJoinRoom}>
              Tham gia
            </button>
          </div>
        </div>
        <button className="btn btn--ghost" onClick={() => navigate("/rules")}>
          Xem luật chơi
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------
  // 3. Inside a room's pre-game lobby
  // ---------------------------------------------------------------------
  const mySeat = lobbyState.seats.find((s) => s.playerId === myPlayerId);
  const isHost = mySeat?.isHost ?? false;
  const filledSeats = lobbyState.seats.filter((s) => s.seatKind !== "EMPTY");
  const canStart = isHost && filledSeats.length >= 2 && filledSeats.length <= 8 && !lobbyState.started;

  return (
    <div className="lobby-page lobby-page--center">
      <header className="lobby-header">
        <span>
          Phòng: <strong className="lobby-code">{lobbyState.code}</strong> (tối đa {lobbyState.maxPlayers} người)
        </span>
        <ThemeSwitcher />
      </header>
      {lastError && <div className="lobby-error">{lastError.message}</div>}

      <div className="panel lobby-seats">
        {Array.from({ length: lobbyState.maxPlayers }).map((_, seatIndex) => {
          const seat = lobbyState.seats.find((s) => s.seatIndex === seatIndex);
          return <SeatRow key={seatIndex} seatIndex={seatIndex} seat={seat} isHost={isHost} roomId={lobbyState.roomId} addBotLevel={addBotLevel} />;
        })}
      </div>

      {isHost && (
        <div className="lobby-bot-level-picker">
          <span>Cấp độ Bot khi thêm:</span>
          {(Object.values(BotLevel) as BotLevel[]).map((lvl) => (
            <button
              key={lvl}
              className={`btn btn--sm ${addBotLevel === lvl ? "btn--primary" : ""}`}
              onClick={() => setAddBotLevel(lvl)}
            >
              {BOT_LEVEL_LABEL[lvl]}
            </button>
          ))}
        </div>
      )}

      <button className="btn btn--primary lobby-start-btn" disabled={!canStart} onClick={() => startGame(lobbyState.roomId)}>
        {lobbyState.started ? "Đang bắt đầu…" : "Bắt đầu ván đấu"}
      </button>
      {!isHost && <p className="lobby-hint">Chỉ chủ phòng mới có thể bắt đầu ván đấu.</p>}
    </div>
  );
};

const SeatRow: React.FC<{
  seatIndex: number;
  seat?: LobbyStateSeat;
  isHost: boolean;
  roomId: string;
  addBotLevel: BotLevel;
}> = ({ seatIndex, seat, isHost, roomId, addBotLevel }) => {
  const empty = !seat || seat.seatKind === "EMPTY";
  return (
    <div className={`lobby-seat-row ${empty ? "lobby-seat-row--empty" : ""}`}>
      <span className="lobby-seat-row__index">#{seatIndex + 1}</span>
      {empty ? (
        <>
          <span className="lobby-seat-row__empty-label">Trống</span>
          {isHost && (
            <button className="btn btn--sm" onClick={() => addBot(roomId, seatIndex, addBotLevel)}>
              + Thêm Bot ({BOT_LEVEL_LABEL[addBotLevel]})
            </button>
          )}
        </>
      ) : (
        <>
          <span className={`lobby-seat-row__dot ${seat!.connected ? "is-ok" : "is-bad"}`} />
          <span className="lobby-seat-row__name">
            {seat!.displayName}
            {seat!.isHost && <span className="lobby-seat-row__host-tag">HOST</span>}
          </span>
          {seat!.seatKind === "BOT" && <span className="lobby-seat-row__bot-tag">BOT · {seat!.botLevel}</span>}
        </>
      )}
    </div>
  );
};
