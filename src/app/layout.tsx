import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/app/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://clearupsc.vercel.app"),
  title: "ClearUPSC - Free UPSC Study Planner & Practice Tests",
  description: "Free UPSC preparation app with syllabus tracker, source-labeled practice, answer writing, mock tests and current affairs. Built for IAS aspirants across India.",
  keywords: "UPSC preparation, UPSC study planner, UPSC mock test, UPSC syllabus tracker, UPSC current affairs, IAS preparation",
  openGraph: {
    title: "ClearUPSC - Clarity. Strategy. Rank.",
    description: "Plan, track and practise for UPSC with syllabus tracking, source-labeled questions, answer writing and current affairs.",
    url: "https://clearupsc.vercel.app",
    siteName: "ClearUPSC",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-900 antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
