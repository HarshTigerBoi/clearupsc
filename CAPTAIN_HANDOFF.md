# Captain Handoff — ClearUPSC
## Status: Core Product Complete

## What Is Done
- 1196 topics with real structured notes (400-600 words each)
- 5980 real factual MCQs with plausible distractors and explanations
- 565 official UPSC Mains PYQs imported (2013-2021, source: UPSC-Star)
- 10 full Prelims mock tests, 100 questions each
- 43 current affairs entries with real PIB sources
- Full progress tracking: time spent, correct count, mistakes count, last score
- Weak area detection: topics where last_score < 60 or mistakes > 2
- Adaptive dashboard with ONE primary next action card
- Minimal dark homepage with hamburger navigation
- GitHub OAuth sign-in (no email rate limits)
- Connected onboarding flow: optional selector → sign in → onboarding → dashboard → study
- Study page: Get It, Learn It, Memorise It, Revise It, Read It, Prove It
- Auto-continue: Mark Complete → next topic loads automatically
- GitHub repo: HarshTigerBoi/clearupsc → Vercel auto-deploy

## What Still Needs Work
1. Onboarding answers not yet used to personalize topic sequence
2. Real Prelims PYQs — no verified MCQ answer key dataset found publicly
3. NCERT layer — links exist but many still show "coming soon"
4. Answer writing AI evaluation — needs Anthropic API key
5. Current affairs cron — runs on Vercel but needs SMTP for email digest
6. Mobile UX — some pages need 375px polish
7. Payments — Razorpay not activated yet

## Stack
Next.js 14, TypeScript, Tailwind, Supabase, Vercel
Local: C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc
Live: https://clearupsc.vercel.app
GitHub: https://github.com/HarshTigerBoi/clearupsc

## How To Continue
Paste this file to new Claude and say: continue captain mode

For every new Claude/Codex session, start with:

```txt
Read CAPTAIN_HANDOFF.md in my project first.
Check git status before changing anything.
Continue from existing work, do not overwrite.
```

## Next 5 Session Prompts For Codex

Session 1: Check git status first. Check existing personalization work in src/lib/product/db.ts. Build personalized study sequence from onboarding answers - exam year, weak subjects, daily hours, experience level. Update dashboard next action and study_plan_tasks to reflect personalized order.

Session 2: Implement spaced repetition. After topic completion schedule review at 1, 3, 7, 14, 30 days. Store next_review_at in topic_progress. Dashboard shows topics due today. High score = longer interval. Low score = shorter interval.

Session 3: Mobile UX polish. Fix every page at 375px - no horizontal scroll, tap-friendly questions, stacking dashboard cards, smooth hamburger menu, clean onboarding on small screens.

Session 4: NCERT layer. Map all Class 6-12 NCERT chapters to official ncert.nic.in URLs. Update Read It section to show real clickable links for every topic.

Session 5: Essay and answer writing module. User picks Mains PYQ, types answer, app scores against rubric - intro, structure, examples, conclusion, word count. Store in answer_submissions. Show streak and average score on dashboard.
