import { getXpLevel } from "@/lib/gamification/xp";

export default function XPBar({ totalXp = 0 }: { totalXp?: number }) {
  const level = getXpLevel(totalXp);

  return (
    <section className="mt-6 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f97316]">XP Level</p>
          <h2 className="mt-2 text-2xl font-black text-[#1a2744]">{level.levelName}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {level.totalXp} XP total{level.nextLevelXp ? ` · ${level.remainingXp} XP to next level` : " · maximum track unlocked"}
          </p>
        </div>
        <span className="rounded-full bg-orange-100 px-4 py-2 text-sm font-black text-orange-800">
          {level.progressPercent}%
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-amber-400 transition-all" style={{ width: `${level.progressPercent}%` }} />
      </div>
    </section>
  );
}
