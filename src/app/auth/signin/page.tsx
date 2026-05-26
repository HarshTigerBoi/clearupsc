"use client";

import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/layout/LoginModal";

export default function SignInPage() {
  const router = useRouter();

  return (
    <section className="min-h-[calc(100vh-65px)] bg-[#0a0a0a]">
      <LoginModal open onClose={() => router.push("/")} />
    </section>
  );
}
