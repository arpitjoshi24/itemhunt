import type { ScoreEntry } from "@/types/game";

export default function Leaderboard({
  scores,
  meId,
}: {
  scores: ScoreEntry[];
  meId?: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-800 p-4">
      <h2 className="mb-3 font-semibold">Leaderboard</h2>
      <ol className="space-y-2">
        {scores.map((s, i) => (
          <li
            key={s.playerId}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              s.playerId === meId
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-slate-900"
            }`}
          >
            <span>
              <span className="mr-2 text-slate-500">{i + 1}.</span>
              {s.nickname}
              {s.playerId === meId && " (you)"}
            </span>
            <span className="font-bold tabular-nums">{s.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}