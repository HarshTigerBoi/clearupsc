"use client";

import { useEffect, useState } from "react";
import type { Badge } from "@/lib/gamification/badges";

export default function BadgeUnlock() {
  const [badge, setBadge] = useState<Badge | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    function onUnlock(event: Event) {
      const next = (event as CustomEvent<Badge>).detail;
      if (!next?.id) return;
      setBadge(next);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setBadge(null), 2000);
    }
    window.addEventListener("clearupsc:badge-unlock", onUnlock);
    return () => {
      window.removeEventListener("clearupsc:badge-unlock", onUnlock);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!badge) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/80 px-4 backdrop-blur-sm">
      <div className="animate-badge-unlock-pop w-full max-w-sm rounded-3xl border border-orange-400/40 bg-[#111111] p-8 text-center text-white shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f97316]">Badge Unlocked</p>
        <div className="mx-auto mt-5 flex h-24 w-24 items-center justify-center rounded-full bg-[#f97316] text-2xl font-black text-white">
          {badge.icon}
        </div>
        <h2 className="mt-5 text-3xl font-black">{badge.title}</h2>
        <p className="mt-2 text-sm font-bold leading-6 text-zinc-300">{badge.description}</p>
      </div>
    </div>
  );
}
