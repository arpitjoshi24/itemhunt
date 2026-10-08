"use client";

import { useEffect, useState } from "react";
import { secondsLeft } from "@/utils/time";

export default function Timer({
  endsAt,
  serverOffset,
}: {
  endsAt: number | null;
  serverOffset: number;
}) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setSecs(0);
      return;
    }
    const tick = () => setSecs(secondsLeft(endsAt, serverOffset));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, serverOffset]);

  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, "0");

  return (
    <span
      className={`text-3xl font-extrabold tabular-nums ${
        secs <= 10 && endsAt ? "text-red-400" : "text-white"
      }`}
    >
      {m}:{s}
    </span>
  );
}