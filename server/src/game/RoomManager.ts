import {
  MAX_PLAYERS,
  ROOM_ID_CHARS,
  ROOM_ID_LENGTH,
} from "../constants";
import type { Player, Room } from "../types";

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToRoom = new Map<string, string>();

  private generateId(): string {
    let id = "";
    do {
      id = Array.from(
        { length: ROOM_ID_LENGTH },
        () => ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)]
      ).join("");
    } while (this.rooms.has(id));
    return id;
  }

  private newPlayer(id: string, nickname: string, isHost: boolean): Player {
    return { id, nickname, isHost, ready: false, score: 0, totalTimeMs: 0 };
  }

  createRoom(socketId: string, nickname: string): Room {
    const room: Room = {
      id: this.generateId(),
      status: "lobby",
      players: [this.newPlayer(socketId, nickname, true)],
      leftPlayers: [],
      currentRound: null,
      usedItems: [],
      timers: {},
    };
    this.rooms.set(room.id, room);
    this.socketToRoom.set(socketId, room.id);
    return room;
  }

  /** Returns an error message, or null when the player was added. */
  addPlayer(room: Room, socketId: string, nickname: string): string | null {
    if (room.status !== "lobby") return "Game already started.";
    if (room.players.length >= MAX_PLAYERS) return "Room is full.";
    room.players.push(this.newPlayer(socketId, nickname, false));
    this.socketToRoom.set(socketId, room.id);
    return null;
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  roomOf(socketId: string): Room | undefined {
    const id = this.socketToRoom.get(socketId);
    return id ? this.rooms.get(id) : undefined;
  }

  unlink(socketId: string) {
    this.socketToRoom.delete(socketId);
  }

  delete(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    clearTimeout(room.timers.countdown);
    clearTimeout(room.timers.round);
    clearTimeout(room.timers.next);
    this.rooms.delete(roomId);
  }
}