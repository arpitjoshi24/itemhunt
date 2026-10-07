"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/services/socket";
import { useGameStore } from "@/store/gameStore";
import type {
  FoundNotice,
  Player,
  RoomStatus,
  RoundItem,
  RoundResult,
  ScoreEntry,
} from "@/types/game";

export function useGameSocket() {
  const router = useRouter();

  useEffect(() => {
    const socket = getSocket();
    const store = () => useGameStore.getState();

    // --- clock offset (server time - client time) ---
    const syncTime = () => {
      const t0 = Date.now();
      socket.emit("time:sync", (serverTime: number) => {
        const t1 = Date.now();
        store().setServerOffset(serverTime - (t0 + t1) / 2);
      });
    };

    // --- handlers ---
    const onRoomUpdated = (d: {
      roomId: string;
      players: Player[];
      status: RoomStatus;
    }) => store().setRoom(d.players, d.status);

    const onCountdownStart = (d: { startsAt: number; seconds: number }) =>
      store().setCountdown(d.startsAt + d.seconds * 1000);

    const onCountdownCancel = () => store().setCountdown(null);

    const onGameStarted = (d: { totalRounds: number }) => {
      store().gameStarted(d.totalRounds);
      const roomId = store().roomId;
      if (roomId) router.push(`/game/${roomId}`);
    };

    const onRoundStart = (d: {
      round: number;
      totalRounds: number;
      item: RoundItem;
      endsAt: number;
    }) => store().roundStart({ round: d.round, item: d.item, endsAt: d.endsAt });

    const onPlayerFound = (d: FoundNotice) => store().addFound(d);

    const onRoundEnd = (d: {
      round: number;
      results: RoundResult[];
      scores: ScoreEntry[];
    }) => store().roundEnd(d.results, d.scores);

    const onLeaderboard = (d: { scores: ScoreEntry[] }) =>
      store().setScores(d.scores);

    const onGameOver = (d: { finalLeaderboard: ScoreEntry[] }) => {
      store().gameOver(d.finalLeaderboard);
      const roomId = store().roomId;
      if (roomId) router.push(`/results/${roomId}`);
    };

    const onRoomReset = (d: { players: Player[] }) => {
      store().roomReset(d.players);
      const roomId = store().roomId;
      if (roomId) router.push(`/lobby/${roomId}`);
    };

    const onError = (d: { message: string }) => console.warn("[server]", d.message);

    // A dropped connection means the server already removed us (phase 1: no reconnect)
    const onDisconnect = () => {
      if (store().roomId) {
        store().reset();
        router.replace("/");
      }
    };

    socket.on("connect", syncTime);
    socket.on("disconnect", onDisconnect);
    socket.on("room:updated", onRoomUpdated);
    socket.on("countdown:start", onCountdownStart);
    socket.on("countdown:cancel", onCountdownCancel);
    socket.on("game:started", onGameStarted);
    socket.on("round:start", onRoundStart);
    socket.on("round:playerFound", onPlayerFound);
    socket.on("round:end", onRoundEnd);
    socket.on("leaderboard:update", onLeaderboard);
    socket.on("game:over", onGameOver);
    socket.on("room:reset", onRoomReset);
    socket.on("error", onError);

    if (socket.connected) syncTime();

    return () => {
      socket.off("connect", syncTime);
      socket.off("disconnect", onDisconnect);
      socket.off("room:updated", onRoomUpdated);
      socket.off("countdown:start", onCountdownStart);
      socket.off("countdown:cancel", onCountdownCancel);
      socket.off("game:started", onGameStarted);
      socket.off("round:start", onRoundStart);
      socket.off("round:playerFound", onPlayerFound);
      socket.off("round:end", onRoundEnd);
      socket.off("leaderboard:update", onLeaderboard);
      socket.off("game:over", onGameOver);
      socket.off("room:reset", onRoomReset);
      socket.off("error", onError);
    };
  }, [router]);
}