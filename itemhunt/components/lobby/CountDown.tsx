"use client";

import { useEffect, useState } from "react";
import { secondsLeft } from "@/utils/time";

export default function Countdown({
  endsAt,
  serverOffset,
}: {
  endsAt: number;
  serverOffset: number;
}) {
  const [secs, setSecs] = useState(() => secondsLeft(endsAt, serverOffset));

  useEffect(() => {
    const tick = () => setSecs(secondsLeft(endsAt, serverOffset));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt, serverOffset]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/90">
      <p className="text-lg text-slate-300">Game starts in</p>
      <p className="text-9xl font-extrabold text-emerald-400">{secs}</p>
      <p className="mt-4 text-sm text-slate-400">
        Get your camera ready. Someone un-readying cancels the countdown.
      </p>
    </div>
  );
}2