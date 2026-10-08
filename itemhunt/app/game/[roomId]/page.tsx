"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/services/socket";
import { useGameStore } from "@/store/gameStore";
import { useCamera } from "@/hooks/useCamera";
import { useDetector, useModelStatus } from "@/hooks/useDetector";
import ItemBanner from "@/components/game/ItemBaneer";
import Timer from "@/components/game/Timer";
import CameraView from "@/components/game/CameraView";
import FoundToast from "@/components/game/FoundToast";
import RoundResultModal from "@/components/game/RoundResultModal";
import Leaderboard from "@/components/leaderboard/Leaderboard";

export default function GamePage() {
  const router = useRouter();
  const {
    me,
    players,
    round,
    totalRounds,
    item,
    endsAt,
    scores,
    foundNotices,
    roundResults,
    serverOffset,
    reset,
  } = useGameStore();

  const { videoRef, status: camStatus, start } = useCamera();
  const modelStatus = useModelStatus();

  useEffect(() => {
    if (!me) router.replace("/");
  }, [me, router]);

  useEffect(() => {
    if (me) start();
  }, [me, start]);

  const roundActive = !!item && roundResults === null;
  const myNotice = me ? foundNotices.find((n) => n.playerId === me.id) : undefined;
  const myFound = !!myNotice;

  function reportFound(label: string, confidence: number) {
    getSocket().emit("round:found", { label, confidence });
  }

  // Real AI detection
  const { seen } = useDetector({
    videoRef,
    enabled:
      roundActive &&
      !myFound &&
      camStatus === "ready" &&
      modelStatus === "ready",
    target: item ? item.detectorLabel : null,
    onFound: reportFound,
  });

  if (!me) return null;

  const board = scores.length
    ? scores
    : players.map((p) => ({ playerId: p.id, nickname: p.nickname, score: 0 }));

  let message = "Get ready...";
  if (myFound) message = `Found it! +${myNotice!.points}`;
  else if (roundActive) {
    if (modelStatus === "loading") message = "Loading AI...";
    else if (modelStatus === "error") message = "AI failed to load";
    else message = `Looking for ${item!.name}...`;
  } else if (roundResults) message = "Round over";

  function leaveGame() {
    getSocket().emit("room:leave");
    reset();
    router.push("/");
  }

  return (
    <main className="min-h-screen px-4 py-4">
      <FoundToast notices={foundNotices} meId={me.id} />
      {roundResults && (
        <RoundResultModal
          results={roundResults}
          round={round}
          totalRounds={totalRounds}
          meId={me.id}
        />
      )}

      <div className="mx-auto max-w-5xl">
        <header className="mb-4 grid grid-cols-3 items-center rounded-2xl bg-slate-800 px-5 py-3">
          <span className="text-sm font-semibold text-slate-300">
            {round > 0 ? `Round ${round}/${totalRounds}` : "Starting..."}
          </span>
          <ItemBanner name={item ? item.name : undefined} />
          <div className="text-right">
            <Timer endsAt={roundActive ? endsAt : null} serverOffset={serverOffset} />
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <aside className="space-y-3">
            <Leaderboard scores={board} meId={me.id} />
            <button
              onClick={leaveGame}
              className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              Leave game
            </button>
          </aside>

          <section className="space-y-3">
            <CameraView
              videoRef={videoRef}
              cameraStatus={camStatus}
              message={message}
              found={myFound}
              onRetry={start}
            />

            {/* Debug line: handy for tuning the threshold */}
            {roundActive && !myFound && (
              <p className="text-center text-xs text-slate-500">
                AI sees:{" "}
                {seen
                  ? `${seen.label} (${Math.round(seen.confidence * 100)}%)`
                  : "nothing yet"}
              </p>
            )}

            {/* Dev-only fallback button, hidden in production builds */}
            {process.env.NODE_ENV === "development" && item && (
              <button
                onClick={() => reportFound(item.detectorLabel, 1)}
                disabled={!roundActive || myFound}
                className="w-full rounded-lg bg-amber-500 py-2 text-sm font-bold text-slate-900 disabled:opacity-40"
              >
                Dev: I found it!
              </button>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}