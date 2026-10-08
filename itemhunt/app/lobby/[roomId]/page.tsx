"use client";

import { useEffect, useState } from "react";
import {  useRouter } from "next/navigation";
import { getSocket } from "@/services/socket";
import { useGameStore } from "@/store/gameStore";
import { useCamera } from "@/hooks/useCamera";
import PlayerList from "@/components/lobby/PlayerList";
import ReadyButton from "@/components/lobby/ReadyButton";
import Countdown from "@/components/lobby/Countdown";
import { useModelStatus } from "@/hooks/useDetector";
import type { Player, RoomStatus } from "@/types/game";

type SyncRes = { ok: boolean; roomId?: string; players?: Player[]; status?: RoomStatus };

export default function LobbyPage() {
  const router = useRouter();
  

  const {
  me,
  roomId,
  players,
  status,
  countdownEndsAt,
  serverOffset,
  setRoom,
  setRoomId,
  reset,
} = useGameStore();

  const { videoRef, status: camStatus, start } = useCamera();
  const modelStatus = useModelStatus();
  const [copied, setCopied] = useState(false);

  // Not in a room (e.g. page refresh)? Go home. Otherwise fetch the current room state.
  useEffect(() => {
    if (!me) {
      router.replace("/");
      return;
    }
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("room:sync", (res: SyncRes) => {
      if (!res.ok || !res.players || !res.status || !res.roomId) {
        reset();
        router.replace("/");
        return;
      }
      setRoomId(res.roomId);
      setRoom(res.players, res.status);
    });
  }, [me, router, reset, setRoom, setRoomId]);

  // Ask for the camera as soon as we are in the lobby
  useEffect(() => {
    if (me) start();
  }, [me, start]);

  const myPlayer = players.find((p) => p.id === me?.id);
  const myReady = myPlayer?.ready ?? false;
  const cameraOk = camStatus === "ready";
const canReady = cameraOk && modelStatus === "ready";
  function toggleReady() {
    getSocket().emit("player:ready", { ready: !myReady });
  }

  function leaveRoom() {
    getSocket().emit("room:leave");
    reset();
    router.push("/");
  }

  async function copyId() {
  if (!roomId) return;
  try {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  } catch {
    /* ignore */
  }
}

  const allReady = players.length > 0 && players.every((p) => p.ready);
  const hint =
    players.length < 2
      ? "Waiting for at least 2 players..."
      : allReady
      ? "Everyone is ready!"
      : "Waiting for everyone to be ready...";

  if (!me) return null;

  return (
    <main className="min-h-screen px-4 py-8">
      {status === "countdown" && countdownEndsAt && (
        <Countdown endsAt={countdownEndsAt} serverOffset={serverOffset} />
      )}

      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold">
            Hunt<span className="text-emerald-400">io</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-800 px-4 py-2">
              <span className="text-xs text-slate-400">Room ID</span>
              <p className="text-xl font-bold tracking-widest">{roomId}</p>
            </div>
            <button
              onClick={copyId}
              className="rounded-lg bg-slate-700 px-4 py-3 text-sm font-semibold hover:bg-slate-600"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Camera */}
          <section className="rounded-2xl bg-slate-800 p-4">
            <h2 className="mb-3 font-semibold">Your camera</h2>
            <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
              {!cameraOk && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-sm text-slate-300">
                  {camStatus === "requesting" && <p>Asking for camera permission...</p>}
                  {camStatus === "denied" && (
                    <p className="text-red-400">
                      Camera access was denied. Allow it in your browser settings,
                      then try again.
                    </p>
                  )}
                  {camStatus === "error" && (
                    <p className="text-red-400">
                      Could not start the camera. (Phones need HTTPS.)
                    </p>
                  )}
                  {(camStatus === "denied" ||
                    camStatus === "error" ||
                    camStatus === "idle") && (
                    <button
                      onClick={start}
                      className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900"
                    >
                      Turn on camera
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Only you see this. The camera is used only to detect objects.
            </p>
          </section>

          {/* Players */}
          <section className="rounded-2xl bg-slate-800 p-4">
            <h2 className="mb-3 font-semibold">
              Players ({players.length}/8)
            </h2>
            <PlayerList players={players} meId={me.id} />

            <div className="mt-5 space-y-3">
             <ReadyButton ready={myReady} disabled={!canReady} onClick={toggleReady} />
             {!cameraOk && (
  <p className="text-center text-xs text-amber-300">
    Turn on your camera to get ready.
  </p>
)}
{modelStatus === "loading" && (
  <p className="text-center text-xs text-slate-400">Loading AI model...</p>
)}
{modelStatus === "error" && (
  <p className="text-center text-xs text-red-400">
    The AI model failed to load. Refresh the page.
  </p>
)}
              <p className="text-center text-sm text-slate-400">{hint}</p>
              <button
                onClick={leaveRoom}
                className="w-full rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Leave room
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}