"use client";

import { useEffect, useState } from "react";
import { Flame, ShieldCheck } from "lucide-react";

type StreakState = {
  currentStreak: number;
  longestStreak: number;
  freezesRemaining: number;
  missedYesterday: boolean;
  guest?: boolean;
};

function readGuestState(): StreakState {
  try {
    const raw = window.localStorage.getItem("clearupsc_guest_streak");
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      currentStreak: Number(parsed.currentStreak ?? 0),
      longestStreak: Number(parsed.longestStreak ?? parsed.currentStreak ?? 0),
      freezesRemaining: Number(parsed.freezesRemaining ?? 2),
      missedYesterday: false,
      guest: true,
    };
  } catch {
    return { currentStreak: 0, longestStreak: 0, freezesRemaining: 2, missedYesterday: false, guest: true };
  }
}

export default function StreakCounter({ fallbackStreak = 0 }: { fallbackStreak?: number }) {
  const [state, setState] = useState<StreakState>({ currentStreak: fallbackStreak, longestStreak: fallbackStreak, freezesRemaining: 2, missedYesterday: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/streak")
      .then((response) => response.json())
      .then((data: StreakState) => {
        if (!alive) return;
        setState(data.guest ? readGuestState() : data);
      })
      .catch(() => {
        if (alive) setState(readGuestState());
      });
    return () => {
      alive = false;
    };
  }, []);

  async function useFreeze() {
    setSaving(true);
    try {
      const response = await fetch("/api/streak", { method: "POST" });
      const data = (await response.json()) as StreakState;
      if (data.guest) {
        const guest = readGuestState();
        const next = { ...guest, freezesRemaining: Math.max(0, guest.freezesRemaining - 1), missedYesterday: false };
        window.localStorage.setItem("clearupsc_guest_streak", JSON.stringify(next));
        setState(next);
      } else {
        setState(data);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-2xl font-black text-[#1a2744]">
            <Flame className="animate-streak-bounce h-6 w-6 text-[#f97316]" /> {state.currentStreak} day streak
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Longest: {state.longestStreak} days · {state.freezesRemaining} streak freeze{state.freezesRemaining === 1 ? "" : "s"} left
          </p>
        </div>
        {state.missedYesterday && state.freezesRemaining > 0 ? (
          <button
            type="button"
            onClick={useFreeze}
            disabled={saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0a0a0a] px-4 text-sm font-black text-white transition hover:bg-[#1f1f1f]"
          >
            <ShieldCheck className="h-4 w-4 text-[#f97316]" />
            {saving ? "Saving..." : "Use a Streak Freeze?"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
