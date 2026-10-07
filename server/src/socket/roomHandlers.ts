import type { Server, Socket } from "socket.io";
import { MAX_NICKNAME, ROOM_ID_LENGTH } from "../constants";
import type { GameEngine } from "../game/GameEngine";
import type { RoomManager } from "../game/RoomManager";
import type { JoinAck } from "../types";

type Ack = (res: JoinAck) => void;

const ROOM_ID_REGEX = new RegExp(`^[A-HJ-NP-Z2-9]{${ROOM_ID_LENGTH}}$`);

function cleanNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (name.length < 1 || name.length > MAX_NICKNAME) return null;
  return name;
}

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  rooms: RoomManager,
  engine: GameEngine
) {
  socket.on("room:create", (payload: any, cb: Ack) => {
    const ack: Ack = typeof cb === "function" ? cb : () => {};
    const nickname = cleanNickname(payload?.nickname);
    if (!nickname)
      return ack({ ok: false, error: "Enter a name (1-16 characters)." });

    // leave any previous room first
    const old = rooms.roomOf(socket.id);
    if (old) {
      socket.leave(old.id);
      engine.removePlayer(socket.id);
    }

    const room = rooms.createRoom(socket.id, nickname);
    socket.join(room.id);
    console.log(`[room] ${nickname} created ${room.id}`);
    ack({ ok: true, roomId: room.id, playerId: socket.id });
    engine.broadcastRoom(room);
  });

  socket.on("room:join", (payload: any, cb: Ack) => {
    const ack: Ack = typeof cb === "function" ? cb : () => {};
    const nickname = cleanNickname(payload?.nickname);
    if (!nickname)
      return ack({ ok: false, error: "Enter a name (1-16 characters)." });

    const roomId =
      typeof payload?.roomId === "string" ? payload.roomId.toUpperCase() : "";
    if (!ROOM_ID_REGEX.test(roomId))
      return ack({ ok: false, error: "Invalid room ID." });

    const room = rooms.get(roomId);
    if (!room) return ack({ ok: false, error: "Room not found." });

    const old = rooms.roomOf(socket.id);
    if (old && old.id !== roomId) {
      socket.leave(old.id);
      engine.removePlayer(socket.id);
    }

    const error = rooms.addPlayer(room, socket.id, nickname);
    if (error) return ack({ ok: false, error });

    socket.join(room.id);
    console.log(`[room] ${nickname} joined ${room.id}`);
    ack({ ok: true, roomId: room.id, playerId: socket.id });
    engine.broadcastRoom(room);
  });

  socket.on("room:leave", () => {
    const room = rooms.roomOf(socket.id);
    if (!room) return;
    socket.leave(room.id);
    engine.removePlayer(socket.id);
  });

  socket.on("player:ready", (payload: any) => {
    const room = rooms.roomOf(socket.id);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;

    const ready = !!payload?.ready;
    if (room.status === "lobby") {
      player.ready = ready;
    } else if (room.status === "countdown" && !ready) {
      player.ready = false;
      engine.cancelCountdown(room);
    } else {
      return;
    }
    engine.broadcastRoom(room);
    engine.checkCountdown(room);
  });

  // Small extras used by the client (not in the plan PDF):
  // the Lobby page calls this on mount to get the current state.
  socket.on("room:sync", (cb: (res: unknown) => void) => {
    if (typeof cb !== "function") return;
    const room = rooms.roomOf(socket.id);
    if (!room) return cb({ ok: false });
    cb({ ok: true, roomId: room.id, players: room.players, status: room.status });
  });

  // The client asks for server time once to correct clock differences.
  socket.on("time:sync", (cb: (now: number) => void) => {
    if (typeof cb === "function") cb(Date.now());
  });

  socket.on("disconnect", () => {
    engine.removePlayer(socket.id);
  });
}