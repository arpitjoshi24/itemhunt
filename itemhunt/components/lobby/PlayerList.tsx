import type { Player } from "@/types/game";

export default function PlayerList({
  players,
  meId,
}: {
  players: Player[];
  meId?: string;
}) {
  return (
    <ul className="space-y-2">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between rounded-lg bg-slate-900 px-4 py-3"
        >
          <span className="flex items-center gap-2">
            <span>
              {p.nickname}
              {p.id === meId && <span className="text-slate-500"> (you)</span>}
            </span>
            {p.isHost && (
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">
                Host
              </span>
            )}
          </span>
          <span
            className={
              p.ready
                ? "text-sm font-semibold text-emerald-400"
                : "text-sm text-slate-500"
            }
          >
            {p.ready ? "Ready" : "Not ready"}
          </span>
        </li>
      ))}
    </ul>
  );
}