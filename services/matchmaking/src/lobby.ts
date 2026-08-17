import { v4 as uuid } from "uuid";
import { BotLevel, LobbyState, SeatKind } from "@minus1days/shared";

export interface Seat {
  playerId: string;
  displayName: string;
  seatIndex: number;
  seatKind: SeatKind;
  botLevel?: BotLevel;
  connected: boolean;
}

export interface LobbyRoom {
  roomId: string;
  code: string;
  maxPlayers: number;
  hostUserId: string;
  seats: Seat[];
  started: boolean;
  isPublic: boolean;
}

const rooms = new Map<string, LobbyRoom>();
const roomsByCode = new Map<string, string>();
let openPublicRoomId: string | null = null;

function genCode(): string {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export function createRoom(hostUserId: string, hostDisplayName: string, maxPlayers: number, isPublic = false): LobbyRoom {
  const roomId = uuid();
  let code = genCode();
  while (roomsByCode.has(code)) code = genCode();
  const room: LobbyRoom = {
    roomId,
    code,
    maxPlayers: Math.max(2, Math.min(8, maxPlayers)),
    hostUserId,
    seats: [{ playerId: hostUserId, displayName: hostDisplayName, seatIndex: 0, seatKind: SeatKind.HUMAN, connected: true }],
    started: false,
    isPublic,
  };
  rooms.set(roomId, room);
  roomsByCode.set(code, roomId);
  return room;
}

export function getRoom(roomId: string): LobbyRoom | undefined {
  return rooms.get(roomId);
}

export function getRoomByCode(code: string): LobbyRoom | undefined {
  const id = roomsByCode.get(code.toUpperCase());
  return id ? rooms.get(id) : undefined;
}

export function joinRoom(room: LobbyRoom, userId: string, displayName: string): Seat {
  if (room.started) throw new Error("Bàn đã bắt đầu.");
  const existing = room.seats.find((s) => s.playerId === userId);
  if (existing) {
    existing.connected = true;
    return existing;
  }
  if (room.seats.length >= room.maxPlayers) throw new Error("Bàn đã đầy.");
  const seat: Seat = {
    playerId: userId,
    displayName,
    seatIndex: room.seats.length,
    seatKind: SeatKind.HUMAN,
    connected: true,
  };
  room.seats.push(seat);
  return seat;
}

export function addBot(room: LobbyRoom, botLevel: BotLevel): Seat {
  if (room.started) throw new Error("Bàn đã bắt đầu.");
  if (room.seats.length >= room.maxPlayers) throw new Error("Bàn đã đầy.");
  const seat: Seat = {
    playerId: `bot:${uuid()}`,
    displayName: `Bot ${botLevel} #${room.seats.filter((s) => s.seatKind === SeatKind.BOT).length + 1}`,
    seatIndex: room.seats.length,
    seatKind: SeatKind.BOT,
    botLevel,
    connected: true,
  };
  room.seats.push(seat);
  return seat;
}

export function quickJoin(userId: string, displayName: string): { room: LobbyRoom; seat: Seat } {
  if (openPublicRoomId) {
    const room = rooms.get(openPublicRoomId);
    if (room && !room.started && room.seats.length < room.maxPlayers) {
      return { room, seat: joinRoom(room, userId, displayName) };
    }
  }
  const room = createRoom(userId, displayName, 8, true);
  openPublicRoomId = room.roomId;
  return { room, seat: room.seats[0] };
}

export function markStarted(room: LobbyRoom) {
  room.started = true;
  if (openPublicRoomId === room.roomId) openPublicRoomId = null;
}

export function toLobbyState(room: LobbyRoom): LobbyState {
  return {
    roomId: room.roomId,
    code: room.code,
    maxPlayers: room.maxPlayers,
    started: room.started,
    seats: room.seats.map((s) => ({
      playerId: s.playerId,
      displayName: s.displayName,
      seatIndex: s.seatIndex,
      seatKind: s.seatKind,
      botLevel: s.botLevel,
      isHost: s.playerId === room.hostUserId,
      connected: s.connected,
    })),
  };
}
