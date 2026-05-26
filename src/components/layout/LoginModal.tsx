"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "github" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  function getCallbackUrl() {
    const origin = window.location.origin;
    const next = new URLSearchParams(window.location.search).get("next");
    return next?.startsWith("/")
      ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${origin}/auth/callback`;
  }

  function rememberNextRoute() {
    const next = new URLSearchParams(window.location.search).get("next");
    if (!next?.startsWith("/")) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `clearupsc_auth_next=${encodeURIComponent(next)}; Path=/; Max-Age=900; SameSite=Lax${secure}`;
  }

  async function signInWithGithub() {
    setStatus("github");
    setMessage("");

    if (!hasSupabaseConfig()) {
      setStatus("error");
      setMessage("Login is temporarily unavailable. Please try again after configuration is restored.");
      return;
    }

    const supabase = createClient();
    rememberNextRoute();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: getCallbackUrl() },
    });

    if (error) {
      setStatus("error");
      setMessage(`Auth error: ${error?.message || error?.status || JSON.stringify(error)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1a2744]">Sign in to save progress</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Continue once and your study progress stays synced.</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close login modal">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 space-y-3">
          <Button className="min-h-12 w-full gap-3 rounded-lg bg-[#24292f] text-base font-black text-white hover:bg-[#1f2328]" disabled={status === "github"} onClick={signInWithGithub}>
            <GithubIcon />
            {status === "github" ? "Opening GitHub..." : "Continue with GitHub"}
          </Button>
          <p className="text-center text-xs font-medium leading-5 text-slate-500">We use GitHub to keep your progress safe. No posts, no follows.</p>
          {message ? (
            <p className="text-sm font-medium text-red-600">{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56v-2.16c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.18c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
