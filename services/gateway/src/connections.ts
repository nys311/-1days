interface Conn {
  roomId: string;
  playerId: string;
}

const socketToConn = new Map<string, Conn>();
const roomToSockets = new Map<string, Set<string>>();

export function attachSocketToRoom(socketId: string, roomId: string, playerId: string) {
  detachSocket(socketId);
  socketToConn.set(socketId, { roomId, playerId });
  if (!roomToSockets.has(roomId)) roomToSockets.set(roomId, new Set());
  roomToSockets.get(roomId)!.add(socketId);
}

export function detachSocket(socketId: string) {
  const conn = socketToConn.get(socketId);
  if (!conn) return;
  socketToConn.delete(socketId);
  roomToSockets.get(conn.roomId)?.delete(socketId);
}

export function getConn(socketId: string): Conn | undefined {
  return socketToConn.get(socketId);
}

export function getSocketsForRoom(roomId: string): string[] {
  return Array.from(roomToSockets.get(roomId) ?? []);
}
