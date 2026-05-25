"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "./LoginModal";

const links = [
  { href: "/optional-selector", label: "Optional Selector" },
  { href: "/tracker", label: "Syllabus Tracker" },
  { href: "/practice", label: "Practice" },
  { href: "/content-status", label: "Sources" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pricing", label: "Pricing" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "true") setLoginOpen(true);

    if (!hasSupabaseConfig()) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!hasSupabaseConfig()) {
      setEmail(null);
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-[#1a2744]">
            ClearUPSC
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-semibold text-slate-700 hover:text-[#f97316]">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            {email ? (
              <>
                <span className="max-w-44 truncate text-sm text-[#64748b]">{email}</span>
                <Button variant="outline" onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <Button onClick={() => setLoginOpen(true)}>Sign In</Button>
            )}
          </div>
          <button className="rounded-lg p-2 text-[#1a2744] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
        {menuOpen ? (
          <div className="border-t border-[#e2e8f0] bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {email ? <Button variant="outline" onClick={signOut}>Sign Out</Button> : <Button onClick={() => setLoginOpen(true)}>Sign In</Button>}
            </div>
          </div>
        ) : null}
      </header>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
