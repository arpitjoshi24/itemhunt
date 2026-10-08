export default function ItemBanner({ name }: { name?: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-slate-400">
        {name ? "Find" : "Get ready"}
      </p>
      <p className="text-2xl font-extrabold uppercase text-emerald-400 md:text-3xl">
        {name ?? "..."}
      </p>
    </div>
  );
}