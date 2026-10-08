import type { ScoreEntry } from "@/types/game";

const STYLES = [
  { height: "h-32", color: "bg-amber-400", medal: "🥇" }, // 1st
  { height: "h-24", color: "bg-slate-300", medal: "🥈" }, // 2nd
  { height: "h-20", color: "bg-orange-400", medal: "🥉" }, // 3rd
];

export default function Podium({
  scores,
  meId,
}: {
  scores: ScoreEntry[];
  meId?: string;
}) {
  const top = scores.slice(0, 3);
  // visual order: 2nd, 1st, 3rd
  const order = [1, 0, 2].filter((i) => top[i]);

  return (
    <div className="flex items-end justify-center gap-3">
      {order.map((i) => {
        const s = top[i];
        const style = STYLES[i];
        return (
          <div key={s.playerId} className="flex w-28 flex-col items-center">
            <span className="text-3xl">{style.medal}</span>
            <p
              className={`mb-1 max-w-full truncate text-sm font-semibold ${
                s.playerId === meId ? "text-emerald-300" : "text-white"
              }`}
            >
              {s.nickname}
              {s.playerId === meId && " (you)"}
            </p>
            <div
              className={`flex w-full items-start justify-center rounded-t-lg pt-2 ${style.height} ${style.color}`}
            >
              <span className="text-xl font-extrabold text-slate-900">
                {s.score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}