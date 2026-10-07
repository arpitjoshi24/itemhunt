import type { Server } from "socket.io";
import {
  COUNTDOWN_MS,
  MIN_PLAYERS,
  RESULTS_MS,
  ROUND_MS,
  START_DELAY_MS,
  TOTAL_ROUNDS,
} from "../constants";
import type { Room } from "../types";
import { RoomManager } from "./RoomManager";
import { pickItem } from "./itemPicker";
import { scoring } from "./Scoring";

export class GameEngine {
  constructor(private io: Server, private rooms: RoomManager) {}

  // ---------- helpers ----------
  broadcastRoom(room: Room) {
    this.io.to(room.id).emit("room:updated", {
      roomId: room.id,
      players: room.players,
      status: room.status,
    });
  }

  leaderboard(room: Room) {
    return [...room.players, ...room.leftPlayers]
      .sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)
      .map((p) => ({ playerId: p.id, nickname: p.nickname, score: p.score }));
  }

  private clearTimers(room: Room) {
    clearTimeout(room.timers.countdown);
    clearTimeout(room.timers.round);
    clearTimeout(room.timers.next);
  }

  // ---------- lobby / countdown ----------
  checkCountdown(room: Room) {
    if (room.status !== "lobby") return;
    if (room.players.length < MIN_PLAYERS) return;
    if (!room.players.every((p) => p.ready)) return;

    room.status = "countdown";
    this.io.to(room.id).emit("countdown:start", {
      startsAt: Date.now(),
      seconds: COUNTDOWN_MS / 1000,
    });
    this.broadcastRoom(room);
    room.timers.countdown = setTimeout(() => this.startGame(room), COUNTDOWN_MS);
  }

  cancelCountdown(room: Room) {
    if (room.status !== "countdown") return;
    clearTimeout(room.timers.countdown);
    room.status = "lobby";
    this.io.to(room.id).emit("countdown:cancel");
    this.broadcastRoom(room);
  }

  // ---------- game ----------
  private startGame(room: Room) {
    room.players.forEach((p) => {
      p.score = 0;
      p.totalTimeMs = 0;
    });
    room.leftPlayers = [];
    room.usedItems = [];
    room.status = "results"; // "between rounds": joining and round:found are blocked
    this.io.to(room.id).emit("game:started", { totalRounds: TOTAL_ROUNDS });
    this.broadcastRoom(room);
    room.timers.next = setTimeout(() => this.startRound(room, 1), START_DELAY_MS);
  }

  private startRound(room: Room, number: number) {
    const item = pickItem(room.usedItems);
    room.usedItems.push(item.detectorLabel);

    const now = Date.now();
    room.currentRound = {
      number,
      item,
      startedAt: now,
      endsAt: now + ROUND_MS,
      found: new Map(),
    };
    room.status = "round";

    this.io.to(room.id).emit("round:start", {
      round: number,
      totalRounds: TOTAL_ROUNDS,
      item: { name: item.name, detectorLabel: item.detectorLabel },
      endsAt: room.currentRound.endsAt,
    });
    room.timers.round = setTimeout(() => this.endRound(room), ROUND_MS);
  }

  handleFound(room: Room, playerId: string, label: string) {
    const round = room.currentRound;
    if (room.status !== "round" || !round) return;

    const now = Date.now();
    if (now > round.endsAt) return;
    if (label !== round.item.detectorLabel) return;
    if (round.found.has(playerId)) return;

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    const rank = round.found.size + 1;
    const timeMs = now - round.startedAt;
    const points = scoring(rank, round.endsAt - now);

    player.score += points;
    player.totalTimeMs += timeMs;
    round.found.set(playerId, { rank, timeMs, points });

    this.io.to(room.id).emit("round:playerFound", {
      playerId,
      nickname: player.nickname,
      points,
      rank,
    });

    if (room.players.every((p) => round.found.has(p.id))) this.endRound(room);
  }

  private endRound(room: Room) {
    const round = room.currentRound;
    if (!round || room.status !== "round") return;

    clearTimeout(room.timers.round);
    room.status = "results";

    const results = room.players.map((p) => {
      const f = round.found.get(p.id);
      return {
        playerId: p.id,
        nickname: p.nickname,
        found: !!f,
        rank: f?.rank ?? null,
        points: f?.points ?? 0,
      };
    });
    const scores = this.leaderboard(room);

    this.io.to(room.id).emit("round:end", { round: round.number, results, scores });
    this.io.to(room.id).emit("leaderboard:update", { scores });

    room.timers.next = setTimeout(() => {
      if (round.number < TOTAL_ROUNDS) this.startRound(room, round.number + 1);
      else this.finishGame(room);
    }, RESULTS_MS);
  }

  private finishGame(room: Room) {
    this.clearTimers(room);
    room.status = "finished";
    room.currentRound = null;
    this.io.to(room.id).emit("game:over", {
      finalLeaderboard: this.leaderboard(room),
    });
    this.broadcastRoom(room);
  }

  playAgain(room: Room, socketId: string) {
    const me = room.players.find((p) => p.id === socketId);
    if (!me?.isHost) {
      this.io.to(socketId).emit("error", { message: "Only the host can do that." });
      return;
    }
    if (room.status !== "finished") return;

    room.players.forEach((p) => {
      p.score = 0;
      p.totalTimeMs = 0;
      p.ready = false;
    });
    room.leftPlayers = [];
    room.usedItems = [];
    room.currentRound = null;
    room.status = "lobby";
    this.io.to(room.id).emit("room:reset", { players: room.players });
    this.broadcastRoom(room);
  }

  // ---------- leaving ----------
  removePlayer(socketId: string) {
    const room = this.rooms.roomOf(socketId);
    if (!room) return;

    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) return;

    const [player] = room.players.splice(idx, 1);
    this.rooms.unlink(socketId);

    // keep their score on the board if a game is in progress
    if (room.status === "round" || room.status === "results") {
      room.leftPlayers.push(player);
    }

    if (room.players.length === 0) {
      this.rooms.delete(room.id);
      return;
    }

    if (player.isHost) room.players[0].isHost = true;

    if (room.status === "countdown") this.cancelCountdown(room);

    if (room.status === "round" || room.status === "results") {
      if (room.players.length < MIN_PLAYERS) {
        this.finishGame(room);
        return;
      }
      const round = room.currentRound;
      if (
        room.status === "round" &&
        round &&
        room.players.every((p) => round.found.has(p.id))
      ) {
        this.endRound(room);
      }
    }

    this.broadcastRoom(room);
    if (room.status === "lobby") this.checkCountdown(room);
  }
}