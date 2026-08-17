import { BotLevel } from "@minus1days/shared";

export interface BotSeat {
  roomId: string;
  playerId: string;
  botLevel: BotLevel;
  engineUrl: string;
}

const byRoom = new Map<string, Map<string, BotSeat>>();

export function registerBot(seat: BotSeat) {
  if (!byRoom.has(seat.roomId)) byRoom.set(seat.roomId, new Map());
  byRoom.get(seat.roomId)!.set(seat.playerId, seat);
}

export function getBotsForRoom(roomId: string): BotSeat[] {
  return Array.from(byRoom.get(roomId)?.values() ?? []);
}
