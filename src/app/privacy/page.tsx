import { SeoArticle } from "@/components/layout/SeoArticle";

export default function PrivacyPage() {
  return <SeoArticle eyebrow="Legal" title="Privacy Policy" description="ClearUPSC uses your data to provide study tracking, practice history and account access."> <p>We collect account email, preparation profile, progress, notes, answers, practice attempts and billing status when enabled. Data is stored in Supabase with row-level security. We do not sell personal data. Third-party services may include Supabase, Vercel, Razorpay, Resend, Anthropic and analytics tools when configured.</p></SeoArticle>;
}
