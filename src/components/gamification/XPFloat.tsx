"use client";

import { useEffect, useState } from "react";

type XpToast = { id: number; points: number };

export default function XPFloat() {
  const [toasts, setToasts] = useState<XpToast[]>([]);

  useEffect(() => {
    function onXp(event: Event) {
      const points = Number((event as CustomEvent<{ points?: number }>).detail?.points ?? 0);
      if (!points) return;
      const id = Date.now();
      setToasts((items) => [...items, { id, points }].slice(-3));
      setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 1200);
    }
    window.addEventListener("clearupsc:xp-earned", onXp);
    return () => window.removeEventListener("clearupsc:xp-earned", onXp);
  }, []);

  return (
    <div className="pointer-events-none fixed right-5 top-24 z-[90] space-y-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="animate-xp-float rounded-full bg-[#f97316] px-4 py-2 text-sm font-black text-white shadow-xl">
          +{toast.points} XP
        </div>
      ))}
    </div>
  );
}
