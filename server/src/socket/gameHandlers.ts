import type { Server, Socket } from "socket.io";
import type { GameEngine } from "../game/GameEngine";
import type { RoomManager } from "../game/RoomManager";

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  rooms: RoomManager,
  engine: GameEngine
) {
  socket.on("round:found", (payload: any) => {
    const room = rooms.roomOf(socket.id);
    if (!room) return;
    const label = typeof payload?.label === "string" ? payload.label : "";
    engine.handleFound(room, socket.id, label);
  });

  socket.on("game:playAgain", () => {
    const room = rooms.roomOf(socket.id);
    if (!room) return;
    engine.playAgain(room, socket.id);
  });
}