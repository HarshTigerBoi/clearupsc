"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "github" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!open) return null;

  function getCallbackUrl() {
    const origin = window.location.origin;
    const next = new URLSearchParams(window.location.search).get("next");
    return next?.startsWith("/")
      ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${origin}/auth/callback`;
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: getCallbackUrl() },
    });

    if (error) {
      setStatus("error");
      setMessage(`Auth error: ${error?.message || error?.status || JSON.stringify(error)}`);
    }
  }

  async function sendMagicLink() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("sending");
    setMessage("");

    if (!hasSupabaseConfig()) {
      setStatus("error");
      setMessage("Login is temporarily unavailable. Please try again after configuration is restored.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getCallbackUrl() },
    });

    if (error) {
      setStatus("error");
      setMessage(`Auth error: ${error?.message || error?.status || JSON.stringify(error)}`);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1a2744]">Sign in to save progress</h2>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">Enter your email. We will send a secure magic link.</p>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close login modal">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          <Button className="min-h-11 w-full gap-2 bg-[#24292f] text-white hover:bg-[#1f2328]" disabled={status === "github"} onClick={signInWithGithub}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-xs font-black text-[#24292f]">GH</span>
            {status === "github" ? "Opening GitHub..." : "Continue with GitHub"}
          </Button>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <input
            className="w-full rounded-lg border border-[#e2e8f0] px-3 py-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-100"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button className="w-full" disabled={status === "sending"} onClick={sendMagicLink}>
            {status === "sending" ? "Sending..." : "Send Magic Link"}
          </Button>
          {message ? (
            <p className={`text-sm font-medium ${status === "error" ? "text-red-600" : "text-green-700"}`}>{message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
