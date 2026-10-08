import type { RoundResult } from "@/types/game";

export default function RoundResultModal({
  results,
  round,
  totalRounds,
  meId,
}: {
  results: RoundResult[];
  round: number;
  totalRounds: number;
  meId?: string;
}) {
  const sorted = [...results].sort((a, b) => {
    if (a.found && b.found) return (a.rank ?? 0) - (b.rank ?? 0);
    if (a.found) return -1;
    if (b.found) return 1;
    return 0;
  });
  const anyFound = results.some((r) => r.found);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-slate-800 p-6 shadow-2xl">
        <h2 className="mb-1 text-center text-xl font-extrabold">
          Round {round} results
        </h2>
        {!anyFound && (
          <p className="mb-3 text-center text-sm text-slate-400">
            Nobody found it this time.
          </p>
        )}

        <ul className="mt-3 space-y-2">
          {sorted.map((r) => (
            <li
              key={r.playerId}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                r.playerId === meId ? "bg-emerald-500/20" : "bg-slate-900"
              }`}
            >
              <span>
                {r.found ? `#${r.rank} ` : ""}
                {r.nickname}
                {r.playerId === meId && " (you)"}
              </span>
              <span
                className={
                  r.found ? "font-bold text-emerald-300" : "text-slate-500"
                }
              >
                {r.found ? `+${r.points}` : "-"}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-xs text-slate-400">
          {round < totalRounds
            ? "Next round starting..."
            : "Final results coming up..."}
        </p>
      </div>
    </div>
  );
}