"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/services/socket";
import { useGameStore } from "@/store/gameStore";
import Podium from "@/components/leaderboard/Podium";
import Leaderboard from "@/components/leaderboard/Leaderboard";

export default function ResultsPage() {
  const router = useRouter();
  const { me, players, finalLeaderboard, reset } = useGameStore();

  // Not in a room (e.g. page refresh)? Go home.
  useEffect(() => {
    if (!me) router.replace("/");
  }, [me, router]);

  if (!me) return null;

  const isHost = players.find((p) => p.id === me.id)?.isHost ?? false;
  const winner = finalLeaderboard[0];

  function playAgain() {
    // Server resets the room and sends room:reset, which moves everyone to the lobby
    getSocket().emit("game:playAgain");
  }

  function leaveRoom() {
    getSocket().emit("room:leave");
    reset();
    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">
            Hunt<span className="text-emerald-400">io</span>
          </h1>
          <p className="mt-1 text-slate-400">Final results</p>
        </div>

        {winner ? (
          <p className="text-center text-xl font-bold text-amber-300">
            {winner.playerId === me.id ? "You win!" : `${winner.nickname} wins!`}
          </p>
        ) : (
          <p className="text-center text-slate-400">No results to show.</p>
        )}

        <Podium scores={finalLeaderboard} meId={me.id} />

        <Leaderboard scores={finalLeaderboard} meId={me.id} />

        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={playAgain}
              className="w-full rounded-lg bg-emerald-500 py-3 font-bold text-slate-900 transition hover:bg-emerald-400"
            >
              Play again
            </button>
          ) : (
            <p className="text-center text-sm text-slate-400">
              Waiting for the host to start another game...
            </p>
          )}
          <button
            onClick={leaveRoom}
            className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            Leave room
          </button>
        </div>
      </div>
    </main>
  );
}