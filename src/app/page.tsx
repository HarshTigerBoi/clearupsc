import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f97316]">UPSC 2026</p>
        <h1 className="mt-5 text-5xl font-black leading-tight tracking-normal text-white sm:text-7xl lg:text-8xl">
          Clarity. Strategy. Rank.
        </h1>
        <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-zinc-300 sm:text-xl">
          The only UPSC system you need.
        </p>
        <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/optional-selector"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#f97316] px-6 text-sm font-black text-white transition hover:bg-[#ea580c]"
          >
            Start Preparing
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/20 px-6 text-sm font-black text-white transition hover:border-[#f97316] hover:text-[#f97316]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
