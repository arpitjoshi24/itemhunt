export default function ReadyButton({
  ready,
  disabled,
  onClick,
}: {
  ready: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
        ready
          ? "bg-slate-700 text-white hover:bg-slate-600"
          : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
      }`}
    >
      {ready ? "Cancel ready" : "I'm ready"}
    </button>
  );
}