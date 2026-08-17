import { create } from "zustand";
import type { ErrorPayload, LobbyState, PlayerView } from "@minus1days/shared";
import type { AuthUser } from "../lib/api";

const TOKEN_KEY = "m1d.token";
const USER_KEY = "m1d.user";

function loadStoredAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    const user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

interface GameStoreState {
  // ---- auth ----
  token: string | null;
  user: AuthUser | null;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;

  // ---- connection ----
  socketConnected: boolean;
  setSocketConnected: (connected: boolean) => void;

  // ---- lobby ----
  roomId: string | null;
  lobbyState: LobbyState | null;
  setRoomId: (roomId: string | null) => void;
  setLobbyState: (state: LobbyState) => void;

  // ---- game ----
  playerView: PlayerView | null;
  setPlayerView: (view: PlayerView) => void;

  // ---- errors ----
  lastError: ErrorPayload | null;
  setError: (error: ErrorPayload | null) => void;

  resetSession: () => void;
}

const stored = loadStoredAuth();

export const useGameStore = create<GameStoreState>((set) => ({
  token: stored.token,
  user: stored.user,
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, roomId: null, lobbyState: null, playerView: null });
  },

  socketConnected: false,
  setSocketConnected: (connected) => set({ socketConnected: connected }),

  roomId: null,
  lobbyState: null,
  setRoomId: (roomId) => set({ roomId }),
  setLobbyState: (state) => set({ lobbyState: state, roomId: state.roomId }),

  playerView: null,
  setPlayerView: (view) => set({ playerView: view, roomId: view.roomId }),

  lastError: null,
  setError: (error) => set({ lastError: error }),

  resetSession: () => set({ roomId: null, lobbyState: null, playerView: null, lastError: null }),
}));
