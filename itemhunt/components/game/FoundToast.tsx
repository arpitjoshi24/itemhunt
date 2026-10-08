"use client";

import { useEffect, useState } from "react";
import type { FoundNotice } from "@/types/game";

export default function FoundToast({
  notices,
  meId,
}: {
  notices: FoundNotice[];
  meId?: string;
}) {
  const [current, setCurrent] = useState<FoundNotice | null>(null);

  useEffect(() => {
    if (notices.length === 0) {
      setCurrent(null);
      return;
    }
    setCurrent(notices[notices.length - 1]);
    const id = setTimeout(() => setCurrent(null), 3000);
    return () => clearTimeout(id);
  }, [notices]);

  if (!current) return null;

  const isMe = current.playerId === meId;

  return (
    <div className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-slate-800 px-5 py-2 text-sm shadow-lg ring-1 ring-emerald-400">
      <span className="font-semibold text-emerald-300">
        {isMe ? "You" : current.nickname}
      </span>{" "}
      found it! <span className="text-slate-400">#{current.rank}</span>{" "}
      <span className="font-bold text-emerald-300">+{current.points}</span>
    </div>
  );
}