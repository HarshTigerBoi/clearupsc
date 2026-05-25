"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import type { OptionalResult } from "@/types";

export function EmailCapture({ results }: { results: OptionalResult[] }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      if (!hasSupabaseConfig()) {
        throw new Error("Supabase is not configured.");
      }

      const supabase = createClient();
      const { error } = await supabase.from("waitlist").insert({
        email,
        top_recommendation: results[0]?.subject ?? "",
        second_recommendation: results[1]?.subject,
        third_recommendation: results[2]?.subject,
      });

      if (error) throw error;
      setStatus("success");
      setMessage("Check your inbox! We'll send your plan within 24 hours.");
    } catch {
      setStatus("error");
      setMessage("Could not save email yet. Supabase may not be configured.");
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
      <h3 className="font-bold text-[#1a2744]">Get your free personalised 30-day study plan based on this result</h3>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="min-h-11 flex-1 rounded-lg border border-[#e2e8f0] px-3 text-sm outline-none focus:border-[#f97316] focus:ring-4 focus:ring-orange-100"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button disabled={status === "submitting"} onClick={submit}>{status === "submitting" ? "Saving..." : "Send My Plan"}</Button>
      </div>
      {message ? <p className={`mt-3 text-sm font-medium ${status === "success" ? "text-green-700" : "text-red-600"}`}>{message}</p> : null}
    </div>
  );
}
