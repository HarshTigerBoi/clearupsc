"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BADGES, type Badge } from "@/lib/gamification/badges";

type BadgeRow = Badge & { earned: boolean; earnedAt: string | null };

export default function BadgeShowcase({ compact = false }: { compact?: boolean }) {
  const [guestBadgeIds, setGuestBadgeIds] = useState<Set<string>>(new Set());
  const query = useQuery({
    queryKey: ["user", "badges"],
    queryFn: async () => {
      const response = await fetch("/api/user/badges");
      if (!response.ok) throw new Error("Badges unavailable");
      return (await response.json()) as { badges: BadgeRow[]; earnedCount: number; guest?: boolean };
    },
  });

  useEffect(() => {
    try {
      const rows = JSON.parse(window.localStorage.getItem("clearupsc_guest_badges") || "[]");
      setGuestBadgeIds(new Set(Array.isArray(rows) ? rows.map(String) : []));
    } catch {
      setGuestBadgeIds(new Set());
    }
  }, []);

  const badges = useMemo(() => {
    const cloud = query.data?.badges ?? BADGES.map((badge) => ({ ...badge, earned: false, earnedAt: null }));
    return cloud.map((badge) => (guestBadgeIds.has(badge.id) ? { ...badge, earned: true } : badge));
  }, [guestBadgeIds, query.data?.badges]);
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const visible = compact ? badges.filter((badge) => badge.earned).slice(0, 6).concat(badges.filter((badge) => !badge.earned).slice(0, Math.max(0, 6 - earnedCount))) : badges;

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#f97316]">Badges</p>
          <h2 className="mt-2 text-2xl font-black text-[#1a2744]">{earnedCount}/15 unlocked</h2>
        </div>
        {query.isLoading ? <p className="text-sm font-bold text-slate-500">Syncing badges...</p> : null}
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
        {visible.map((badge) => (
          <div
            key={badge.id}
            className={`rounded-2xl border p-3 transition ${
              badge.earned ? "border-orange-200 bg-orange-50 text-[#1a2744]" : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-black ${badge.earned ? "bg-[#f97316] text-white" : "bg-slate-200 text-slate-500"}`}>
              {badge.icon}
            </div>
            <p className="mt-3 text-sm font-black">{badge.title}</p>
            {!compact ? <p className="mt-1 text-xs font-semibold leading-5">{badge.description}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
