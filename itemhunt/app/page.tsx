"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/services/socket";
import { getRoomInfo } from "@/services/api";
import { useGameStore } from "@/store/gameStore";
import { MAX_NICKNAME_LENGTH, ROOM_ID_LENGTH } from "@/utils/constants";
import type { JoinAck } from "@/types/game";

export default function HomePage() {
  const router = useRouter();
  const { setMe, setRoomId } = useGameStore();

  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanName = nickname.trim();
  const nameValid =
    cleanName.length >= 1 && cleanName.length <= MAX_NICKNAME_LENGTH;

  function handleAck(res: JoinAck) {
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMe({ id: res.playerId, nickname: cleanName });
    setRoomId(res.roomId);
    router.push(`/lobby/${res.roomId}`);
  }

  function emitWithAck(event: string, payload: object) {
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.timeout(5000).emit(event, payload, (err: unknown, res: JoinAck) => {
      if (err) {
        setLoading(false);
        setError("Server is not responding. Is it running?");
        return;
      }
      handleAck(res);
    });
  }

  function createRoom() {
    if (!nameValid) return setError("Enter a name (1-16 characters).");
    setError("");
    setLoading(true);
    emitWithAck("room:create", { nickname: cleanName });
  }

  async function joinRoom() {
    if (!nameValid) return setError("Enter a name (1-16 characters).");
    const code = roomCode.trim().toUpperCase();
    if (code.length !== ROOM_ID_LENGTH)
      return setError(`Room ID must be ${ROOM_ID_LENGTH} characters.`);

    setError("");
    setLoading(true);
    try {
      const info = await getRoomInfo(code);
      if (!info.exists) throw new Error("Room not found.");
      if (info.full) throw new Error("Room is full.");
      if (info.started) throw new Error("Game already started.");
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return;
    }
    emitWithAck("room:join", { roomId: code, nickname: cleanName });
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Hunt<span className="text-emerald-400">io</span>
          </h1>
          <p className="mt-2 text-slate-400">Find it. Show it. Win it.</p>
        </div>

        <div className="rounded-2xl bg-slate-800 p-6 shadow-xl space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Your name
            </label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={MAX_NICKNAME_LENGTH}
              placeholder="e.g. Rahul"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 outline-none focus:border-emerald-400"
            />
          </div>

          {/* Create */}
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-3 transition"
          >
            {loading ? "Please wait..." : "Create room"}
          </button>

          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="h-px flex-1 bg-slate-700" />
            or join a friend
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          {/* Join */}
          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={ROOM_ID_LENGTH}
              placeholder="ROOM ID"
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 tracking-widest uppercase outline-none focus:border-emerald-400"
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-5 font-semibold transition"
            >
              Join
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
        </div>

        {/* How to play */}
        <ol className="mt-8 space-y-1 text-center text-sm text-slate-400">
          <li>1. Join a room and turn on your camera</li>
          <li>2. Find the item shown on screen</li>
          <li>3. Show it to your camera. The AI does the judging</li>
        </ol>
      </div>
    </main>
  );
}