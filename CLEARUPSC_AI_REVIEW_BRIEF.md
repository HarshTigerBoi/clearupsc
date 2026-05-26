# ClearUPSC AI Review Brief

## Purpose Of This Document

This document is a complete handoff brief for another AI or product reviewer to understand ClearUPSC, audit it, and recommend what to improve to make it one of the strongest UPSC preparation platforms.

Do not treat this as marketing copy. Treat it as product, engineering, content, and growth context.

Sensitive values are intentionally not included. Environment variable names are listed, but API keys, Supabase keys, GitHub secrets, and service-role values are not shown.

---

## One-Line Mission

ClearUPSC is a UPSC preparation web app intended to become a full course platform: topic learning, notes, revision, MCQs, Mains answer writing, mock tests, current affairs, onboarding, progress tracking, weak-area detection, and adaptive next-step guidance.

---

## Live Links And Ownership

- Live website: https://clearupsc.vercel.app
- GitHub repo: https://github.com/HarshTigerBoi/clearupsc
- Local project path: `C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc`
- Deployment: Vercel, auto-deploy from GitHub `main`
- Backend/database/auth: Supabase
- Supabase project ref visible in dashboard URL: `ozjthropyiyadagvmfmm`
- Auth provider currently used: GitHub OAuth

---

## Current Product Status

Core product is end-to-end working.

Working flow:

1. Homepage
2. Optional Selector
3. GitHub Sign In
4. Onboarding
5. Dashboard
6. Study Page
7. Prove It questions
8. Mark Complete and Continue
9. Next topic loads automatically
10. Progress and weak areas update

Confirmed fixes:

- GitHub OAuth works.
- New user flow can land on onboarding after GitHub sign-in.
- Magic-link/email sign-in UI is hidden to avoid Supabase email rate-limit problems.
- Hamburger menu links are removed from DOM when closed.
- Vercel auto-deploy is connected.

---

## Live Data Inventory

Live Supabase counts from the project at the time this brief was created:

| Data Type | Count |
|---|---:|
| Topics | 1196 |
| Questions total | 6545 |
| MCQs | 5980 |
| Mains 10-mark PYQs | 392 |
| Mains 15-mark PYQs | 173 |
| Official Mains PYQs total | 565 |
| Question options | 23920 |
| Current affairs entries | 43 |
| Mock tests total in table | 48 |
| Full mock-test mappings created | 1000 |
| Topic progress rows currently present | 1 |

Important note about mock tests:

- 10 full Prelims mocks were generated with 100 mapped questions each.
- The `mock_tests` table currently contains 48 total rows because older or seed mocks also exist.
- The important generated mapping is `mock_test_questions` with 1000 mapped rows.

---

## Content Layer

### Topics

- 1196 topics in Supabase.
- Subjects include:
  - `GS1`
  - `GS2`
  - `GS3`
  - `GS4`
  - `CSAT`
  - `Essay`

Sample topic rows:

```json
[
  {
    "key": "csat_comprehension",
    "title": "Comprehension",
    "subject": "CSAT",
    "exam_stage": "prelims",
    "upsc_weightage": 4
  },
  {
    "key": "gs1_geography_indian_geography_way_forward",
    "title": "Indian Geography: way forward",
    "subject": "GS1",
    "exam_stage": "both",
    "upsc_weightage": 2
  }
]
```

### Structured Notes Shape

Each topic has `structured_notes`, currently stored as text containing JSON-like structured content.

Expected shape:

```json
{
  "analogy": "Beginner-friendly analogy or normalized object",
  "full_notes": "Markdown full notes",
  "concise_notes": [
    {
      "term": "Term name",
      "definition": "UPSC-safe definition"
    }
  ],
  "revision_bullets": [
    "Short high-yield fact"
  ],
  "mindmap": ["central concept", "branch 1", "branch 2"],
  "cases": [
    {
      "name": "Case/report/scheme",
      "point": "Why it matters"
    }
  ],
  "schemes": [
    {
      "name": "Scheme/act/policy",
      "point": "Key fact"
    }
  ],
  "ncert_coverage": [
    "Class 11 Political Science: Indian Constitution at Work"
  ],
  "prelims_traps": [
    "Common wrong assumption"
  ],
  "mains_angles": [
    "GS Paper angle"
  ]
}
```

Parser compatibility:

- `src/lib/study/notes.ts` normalizes string/object notes.
- It supports analogy strings.
- It supports cases/schemes with either `note` or `point`.
- It supports mindmap as either object or array.

### Study Page Steps

Study page route:

- `src/app/study/[topicId]/page.tsx`

The page presents six learning steps:

1. Get It - analogy/simple explanation
2. Learn It - full notes, cases, schemes, sources, mindmap
3. Memorise It - concise notes table
4. Revise It - 10 revision bullets
5. Read It - NCERT references and coverage
6. Prove It - 5 MCQs or official/review questions

At bottom:

- `Mark Complete & Continue`
- Saves progress.
- Redirects to next topic in subject sequence.

---

## Question Bank

### MCQs

- 5980 MCQs.
- 5 MCQs per topic.
- MCQs use plausible same-category distractors.
- Old meta-question patterns were removed.
- Each MCQ has 4 options.
- Total MCQ options: 23920.

Question source:

- `source`: `ClearUPSC Pattern`
- `source_label`: `ClearUPSC Pattern`
- `is_official`: `false`

Sample MCQ row:

```json
{
  "id": "codex_rewrite_mcq_csat_comprehension_01",
  "topic_key": "csat_comprehension",
  "question_type": "mcq",
  "year": null,
  "source": "ClearUPSC Pattern",
  "source_label": "ClearUPSC Pattern",
  "is_official": false,
  "tags": ["CSAT", "ClearUPSC Pattern", "Exam-pattern trap"]
}
```

### Official Mains PYQs

Imported from:

- Repo: https://github.com/amanbh2/UPSC-Star
- Raw data file: https://raw.githubusercontent.com/amanbh2/UPSC-Star/master/UPSC%20Star%20Data.json

Imported:

- 565 official UPSC Mains PYQs.
- Years: 2013-2021.
- GS-I: 191.
- GS-II: 185.
- GS-III: 189.
- GS-IV not present in source JSON.
- No answer keys included because these are descriptive Mains questions.

Inserted into `questions` table:

- `question_text`: source `Question`
- `question_type`: `mains_10` or `mains_15`
- `year`: source year
- `source`: `UPSC Official Mains`
- `source_label`: `Official UPSC Mains PYQ`
- `is_official`: `true`
- `topic_key`: closest topic by subject/keyword matching
- `tags`: paper, year, marks, word limit

Importer script:

- `scripts/import-upsc-star-mains-pyqs.mjs`

### Real Prelims PYQ Status

No free verified structured Prelims MCQ dataset with official answer keys was found.

Current position:

- Real Prelims PYQs are not fully imported as verified MCQs.
- Existing MCQs are UPSC-pattern ClearUPSC original questions.
- Official Prelims PDFs can be downloaded from UPSC, but answer-key extraction/verification is still pending.

Existing official PDF parser:

- `scripts/import-upsc-official-pyqs.mjs`

This script attempts to parse official UPSC Prelims PDFs, but answer keys are not mapped and scanned PDFs may require OCR.

---

## Mock Tests

Generated:

- 10 full Prelims mock tests.
- 100 questions each.
- 1000 unique mapped questions.
- Stored through:
  - `mock_tests`
  - `mock_test_questions`

Distribution per generated full mock:

- History: 15
- Geography: 10
- Polity: 15
- Economy: 15
- Environment: 10
- Science and Tech: 10
- Current Affairs: 15
- CSAT/General: 10

Script:

- `scripts/codex-generate-mocks.mjs`

Important code:

- `src/app/prelims/mock-tests/page.tsx`
- `src/app/prelims/mock-tests/[id]/page.tsx`
- `src/app/api/mock-tests/route.ts`
- `src/app/api/mock-tests/[id]/start/route.ts`
- `src/app/api/mock-tests/[id]/submit/route.ts`
- `src/lib/product/db.ts`

The mock test question pool now uses `mock_test_questions` mapping first and falls back to generic questions if mappings are missing.

---

## Current Affairs

Current status:

- 43 current affairs entries in Supabase.
- Entries include fields:
  - date
  - title
  - summary
  - source_url
  - tags
  - upsc_relevance
  - category
  - source

Relevant files:

- `src/app/current-affairs/page.tsx`
- `src/app/api/current-affairs/latest/route.ts`
- `src/app/api/current-affairs/quiz/route.ts`
- `src/app/api/cron/current-affairs/route.ts`
- `src/lib/current-affairs/rss-fetcher.ts`
- `scripts/codex-seed-current-affairs.mjs`

Cron:

- `vercel.json` schedules the current affairs ingestion route.
- Cron pipeline fetches RSS from sources such as PIB and MEA.

Known limitation:

- Cron exists, but email digest requires SMTP/email delivery setup.

---

## Auth And User Flow

### Auth Provider

Current live auth:

- GitHub OAuth only.
- Magic-link/email sign-in hidden from UI.

Why:

- Supabase email default rate limit was 2 emails per hour.
- Magic link testing quickly hit limits.
- GitHub OAuth is free and avoids email-rate issues.

Relevant files:

- `src/components/layout/LoginModal.tsx`
- `src/app/auth/signin/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`

### OAuth Redirect Fix

Problem found:

- Flow started with `/auth/signin?next=/onboarding`, but after GitHub sign-in it landed on `/dashboard`.

Current fix:

- Login stores `next` in short-lived cookie `clearupsc_auth_next`.
- Auth callback reads `next` query or cookie.
- Optional selector sends users to `/onboarding?force=1`.
- Middleware allows `/onboarding?force=1` even if a user already has `onboarding_complete = true`.

Current tested result:

- `/auth/signin?next=/onboarding?force=1`
- Click GitHub
- Lands on `/onboarding?force=1`

### User Journey

Primary intended flow:

1. `/`
2. Click `Start Preparing`
3. `/optional-selector`
4. Complete six optional-selector questions
5. Results screen shows top optional
6. Click `Start My UPSC Journey`
7. `/auth/signin?next=/onboarding?force=1`
8. GitHub OAuth
9. `/onboarding?force=1`
10. Complete 5 onboarding questions
11. `/dashboard`
12. Dashboard recommends next action
13. Study topic
14. Complete Prove It
15. Mark Complete and Continue
16. Next topic opens

---

## Onboarding

Route:

- `src/app/onboarding/page.tsx`

Five steps:

1. Target exam year: 2026, 2027, 2028
2. Optional subject dropdown
3. Daily hours: 2, 4, 6, 8+
4. Weakest GS paper: GS1, GS2, GS3, GS4, Equal
5. Current level: Beginner, Intermediate, Advanced

API:

- `src/app/api/onboarding/complete/route.ts`

Data stored:

- `user_profiles.attempt_number`
- `user_profiles.educational_background`
- `user_profiles.daily_hours_available`
- `user_profiles.optional_subject`
- `user_profiles.target_exam_year`
- `user_profiles.weak_subjects`
- `user_profiles.strong_subjects`
- `user_profiles.prelims_cleared_before`
- `user_profiles.onboarding_complete`

Known limitation:

- Onboarding answers are saved but not yet strongly used to personalize topic sequence.

---

## Dashboard

Route:

- `src/app/dashboard/page.tsx`

Data API:

- `src/app/api/user/stats/route.ts`
- `src/lib/product/db.ts` function `getDashboardStats`

Primary dashboard feature:

- One top `Next Action` card.

Next action logic:

1. If no progress:
   - Start first topic: Judiciary
   - Link: `/study/gs2_polity_judiciary`
2. If topic in progress:
   - Continue where left off
3. If flashcards due:
   - Revise before you forget
4. If studied 20+ topics:
   - Take mock test
5. Fallback:
   - Study next untouched GS1 History topic

Weak area logic:

- Pulls `topic_progress` rows where:
  - `last_score < 60`
  - OR `mistakes_count > 2`
- Orders by `mistakes_count` descending.
- Shows top 5 weak topics with score percentage.

Known issue:

- Default seed flashcards may cause new/existing users to see `Revise Before You Forget` before it feels natural.
- Could improve by weighting onboarding and first-topic completion above starter flashcards.

---

## Progress Tracking

Main table:

- `topic_progress`

Core fields:

- `user_id`
- `topic_id`
- `topic_key`
- `status`
- `confidence_score`
- `last_studied_at`
- `updated_at`
- `time_spent_seconds`
- `correct_count`
- `mistakes_count`
- `last_score`

Status values:

- `not_started`
- `in_progress`
- `completed`
- `needs_revision`
- `done`

Study page saves:

- time spent
- completion status
- Prove It correct count
- Prove It mistakes count
- Prove It last score

Relevant code:

- `src/app/study/[topicId]/page.tsx`
- `src/app/api/syllabus/[topicId]/route.ts`
- `src/lib/product/db.ts` function `updateTopicProgress`

---

## Frontend Routes

Important app routes:

| Route | Purpose |
|---|---|
| `/` | Minimal dark homepage |
| `/optional-selector` | Optional subject recommendation flow |
| `/auth/signin` | GitHub-only sign-in |
| `/auth/callback` | Supabase OAuth callback |
| `/onboarding` | 5-step new user setup |
| `/dashboard` | Adaptive dashboard |
| `/study` | Topic index |
| `/study/[topicId]` | Six-step topic study page |
| `/study/ncert` | NCERT library |
| `/practice` | Practice area |
| `/prelims/mock-tests` | Mock test listing |
| `/prelims/mock-tests/[id]` | Mock test attempt |
| `/current-affairs` | Current affairs feed |
| `/current-affairs/quiz` | Current affairs quiz |
| `/planner` | Study planner |
| `/flashcards` | Revision queue |
| `/answer-writing/practice` | Mains answer writing practice |
| `/interview` | Interview prep |
| `/profile` | User profile |
| `/pricing` | Pricing |
| `/content-status` | Internal/public content status page |

---

## API Routes

Important API routes:

| API Route | Purpose |
|---|---|
| `/api/study/topic/[topicId]` | Load topic, notes, NCERT, questions, progress, next/prev |
| `/api/study/topics` | Topic listing |
| `/api/syllabus` | Syllabus/progress data |
| `/api/syllabus/[topicId]` | Update topic progress |
| `/api/onboarding/complete` | Save onboarding |
| `/api/user/stats` | Dashboard stats |
| `/api/user/analytics` | Analytics/readiness |
| `/api/flashcards/due` | Due flashcards |
| `/api/flashcards/[id]/review` | Review flashcard |
| `/api/mock-tests` | Mock test listing |
| `/api/mock-tests/[id]/start` | Start mock attempt |
| `/api/mock-tests/[id]/submit` | Submit mock |
| `/api/current-affairs/latest` | Current affairs feed |
| `/api/current-affairs/quiz` | Current affairs quiz |
| `/api/cron/current-affairs` | Cron RSS ingestion |
| `/api/answers/submit` | Answer writing submission |
| `/api/answers/history` | Answer history |
| `/api/essay` | Essay submissions |
| `/api/interview/generate` | Interview questions |
| `/api/interview/evaluate` | Interview evaluation |
| `/api/payments/create-subscription` | Razorpay subscription start |
| `/api/payments/verify` | Payment verification |
| `/api/webhooks/razorpay` | Razorpay webhook |

---

## Database Schema Summary

Main Supabase tables:

### User Tables

- `user_profiles`
- `subscriptions`
- `topic_progress`
- `flashcard_queue`
- `study_plans`
- `study_plan_tasks`
- `answer_submissions`
- `answer_evaluations`
- `mcq_attempts`
- `essay_submissions`
- `revision_schedule`
- `user_notes`
- `mock_test_attempts`
- `daf_entries`
- `mock_interview_sessions`
- `user_streaks`
- `user_badges`
- `notifications`

### Content Tables

- `topics`
- `topic_wiki_cache`
- `questions`
- `question_options`
- `current_affairs`
- `pyq_questions`
- `mock_tests`
- `mock_test_questions`

### Key RLS Policies

Public readable:

- topics
- topic wiki cache
- questions
- question options
- current affairs
- mock tests
- pyq questions

User-owned:

- profiles
- progress
- flashcards
- study plans
- answer submissions
- MCQ attempts
- DAF
- interview sessions
- streaks
- badges
- notifications
- essays
- revision schedule
- notes

---

## Environment Variables

Required names only. Do not expose values.

Local `.env.local` contains:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
```

Other likely production variables needed or planned:

```txt
ADMIN_EMAIL
ANTHROPIC_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SMTP_HOST
SMTP_USER
SMTP_PASS
```

Important:

- Never paste `SUPABASE_SERVICE_ROLE_KEY` into chat.
- Never paste OAuth client secrets.
- Only use service role from scripts or server-side trusted code.

---

## Main Scripts

Content and DB scripts:

- `scripts/codex-generate-all-notes.mjs`
- `scripts/codex-generate-notes.mjs`
- `scripts/codex-fix-notes-quality.mjs`
- `scripts/codex-fix-concise-notes.mjs`
- `scripts/codex-strip-boilerplate.mjs`
- `scripts/codex-rewrite-questions.mjs`
- `scripts/codex-generate-questions.mjs`
- `scripts/codex-fill-explanations.mjs`
- `scripts/codex-fill-question-explanations.mjs`
- `scripts/import-upsc-star-mains-pyqs.mjs`
- `scripts/import-upsc-official-pyqs.mjs`
- `scripts/codex-generate-mocks.mjs`
- `scripts/codex-seed-current-affairs.mjs`
- `scripts/seed-ncert-library.mjs`
- `scripts/seed-govt-sources.mjs`
- `scripts/map-topic-wiki-slugs.mjs`

Utility:

- `scripts/script-env.mjs`
- `scripts/check-topics.mjs`
- `scripts/codex-audit-content-quality.mjs`

Package scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "seed:sql": "node scripts/build-clearupsc-seed.mjs",
  "seed:db": "node scripts/seed-clearupsc-db.mjs",
  "content:wiki": "node scripts/map-topic-wiki-slugs.mjs",
  "content:ncert": "node scripts/seed-ncert-library.mjs",
  "content:sources": "node scripts/seed-govt-sources.mjs",
  "content:import-knowledge": "node scripts/import-course-knowledge.mjs",
  "notes:generate": "node scripts/generate-topic-notes.mjs",
  "notes:ncert": "node scripts/generate-ncert-enriched-notes.mjs",
  "notes:13yo": "node scripts/generate-13yo-ncert-explainers.mjs",
  "questions:generate": "node scripts/generate-upsc-question-bank.mjs",
  "questions:remove-placeholders": "node scripts/remove-placeholder-questions.mjs",
  "pyq:import-official": "node scripts/import-upsc-official-pyqs.mjs"
}
```

---

## Key Source Files

### Layout And Shell

- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/app/globals.css`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/LoginModal.tsx`
- `src/components/product/ProductShell.tsx`
- `src/components/product/ProductRail.tsx`
- `src/components/product/ProductBottomNav.tsx`

### Auth

- `src/app/auth/signin/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/middleware.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/config.ts`

### Course/Study

- `src/app/study/page.tsx`
- `src/app/study/[topicId]/page.tsx`
- `src/app/api/study/topic/[topicId]/route.ts`
- `src/lib/study/notes.ts`
- `src/lib/study/ncert.ts`
- `src/lib/study/knowledge/index.ts`
- `src/lib/study/knowledge/gs1-history.ts`
- `src/lib/study/knowledge/gs2-polity-gov.ts`
- `src/lib/study/knowledge/gs3-economy.ts`

### Product Logic

- `src/lib/product/db.ts`
- `src/lib/product/analytics.ts`
- `src/lib/product/plans.ts`
- `src/lib/product/sm2.ts`

### Optional Selector

- `src/app/optional-selector/page.tsx`
- `src/components/optional-selector/QuestionScreen.tsx`
- `src/components/optional-selector/ResultsScreen.tsx`
- `src/components/optional-selector/EmailCapture.tsx`
- `src/lib/optional-selector/questions.ts`
- `src/lib/optional-selector/scorer.ts`
- `src/lib/optional-selector/matrix.ts`

---

## Technology Stack

Frontend:

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React icons
- TanStack React Query

Backend:

- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase SSR client via `@supabase/ssr`

Other:

- Vercel hosting
- Vercel cron
- next-pwa
- pdf-parse
- fast-xml-parser
- TipTap editor
- Razorpay type support and API stubs

---

## Design Direction

Current intended design:

- Minimal dark homepage.
- Orange accent: `#f97316`.
- Dark base: `#0a0a0a`.
- Main brand line: `Clarity. Strategy. Rank.`
- Homepage visible content:
  - label: `UPSC 2026`
  - headline: `Clarity. Strategy. Rank.`
  - subtitle: `The only UPSC system you need.`
  - primary CTA: `Start Preparing`
  - secondary CTA: `Sign In`

Navbar:

- Left: `ClearUPSC`
- Right: hamburger only
- Slide-in menu opens on click
- Menu items:
  - Study
  - Practice
  - Mock Tests
  - Current Affairs
  - Planner
  - Dashboard
  - Flashcards
  - Answer Writing
  - Interview Prep
  - Pricing

Known UX issue:

- Some product pages still use older light dashboard/card style.
- Mobile polish at 375px is still needed.

---

## Known Gaps And Best Next Improvements

### 1. Personalize Topic Sequence From Onboarding

Current:

- Onboarding answers are saved.
- Dashboard next action does not deeply use them.

Improve:

- Build a personalized topic queue based on:
  - target exam year
  - daily hours
  - optional subject
  - weak GS paper
  - current level

Possible logic:

- Beginner: start with foundations, NCERT-heavy path.
- Intermediate: start with weak GS paper plus current affairs integration.
- Advanced: mock-test-first diagnostic, then weak-area repair.
- Low daily hours: high-yield compressed sequence.
- 2026 target: aggressive revision/mocks timeline.
- 2027/2028 target: foundational pacing.

### 2. Mobile UX Polish

Audit at:

- 375 x 667
- 390 x 844
- 430 x 932

Check:

- Homepage CTA fit
- Optional selector card fit
- Onboarding select dropdown readability
- Dashboard Next Action card
- Study page step sidebar/mobile progress
- Prove It option wrapping
- Mock test question pages
- Footer and bottom nav overlap

### 3. NCERT Layer Completion

Current:

- Some topics show NCERT coverage text.
- Many lack official NCERT PDF/page mapping.

Need:

- Proper NCERT chapter URL map.
- Topic to chapter mapping.
- Prefer official NCERT URLs.
- Show chapter cards with class, subject, book, chapter, official link.

### 4. Answer Writing AI Evaluation

Current:

- Answer writing UI/API exists.
- Evaluation needs external AI key.
- Anthropic API was planned, but no paid key available.

Need:

- Support free/cheap providers or local rubric mode.
- Add deterministic rubric feedback if no AI key.
- Save score trends.
- Link Mains PYQs to answer-writing practice.

### 5. Real Prelims PYQs With Verified Answer Keys

Current:

- No verified structured public dataset found.
- Official PDFs can be parsed but official answer key mapping is hard.

Need:

- Import UPSC official PDFs.
- OCR where needed.
- Parse options.
- Map official answer keys.
- Human review screen for disputed answers.
- Mark as `is_official = true` only when verified.

### 6. Current Affairs Depth

Current:

- 43 seeded entries.
- RSS ingestion route exists.

Need:

- Daily digest.
- Topic linking to syllabus.
- Prelims hook.
- Mains answer angle.
- Monthly compilation.
- Weekly quiz.
- Source reliability ranking.

### 7. Payments

Current:

- Pricing route exists.
- Razorpay routes exist.
- Razorpay not activated.

Need:

- Activate Razorpay account.
- Verify webhook.
- Define free/starter/pro/premium feature gates.
- Add subscription status UI.

---

## Suggested Product North Star

ClearUPSC should not become another PDF dump. It should become:

1. A guided learning path.
2. A revision engine.
3. A weak-area repair engine.
4. A Mains answer-writing gym.
5. A mock-test analytics cockpit.
6. A current affairs to syllabus mapper.

Best-world standard means:

- Every screen tells the aspirant what to do next.
- Every topic has learn, revise, test, and write.
- Every mistake changes the future study plan.
- Every current affairs item is tied to syllabus, Prelims trap, and Mains angle.
- Every mock produces a repair plan.

---

## Suggested Questions For Reviewing AI

Ask the reviewing AI:

1. What is the weakest part of this product today?
2. What should be improved first to increase aspirant trust?
3. What should be improved first to increase daily retention?
4. What should be improved first to make it feel premium/paid?
5. What features are unnecessary or distracting?
6. What should be removed?
7. What should be redesigned for mobile?
8. What data model changes are needed before scaling?
9. How should onboarding personalize the study path?
10. How should mock-test performance generate a repair plan?
11. How should Mains PYQs be integrated into answer-writing practice?
12. What is the ideal 30-day roadmap from here?

---

## Suggested 30-Day Roadmap

### Week 1: Personalization And Retention

- Use onboarding answers in dashboard next-action logic.
- Generate personalized first 30-day plan.
- Improve first-user dashboard state.
- Remove starter flashcards from overpowering first action.
- Add resume logic for last opened topic and last step.

### Week 2: Mobile UX And Study Page Polish

- Full 375px mobile audit.
- Fix overflow and bottom-nav overlap.
- Make study page easier to scan.
- Improve Prove It explanation UX.
- Add sticky progress and completion feedback.

### Week 3: NCERT And Mains Integration

- Complete NCERT official URL mapping.
- Link Mains PYQs to relevant topics.
- Add `Write Answer` CTA beside official Mains PYQs.
- Build answer-writing history by topic.

### Week 4: Analytics And Trust

- Mock-test analytics repair plan.
- Current affairs topic linking.
- Content source badges.
- Human-review status for content.
- Public content-quality dashboard.

---

## Current Git State At Session End

Recent important commits:

```txt
aec76ad fix: force onboarding after optional selector OAuth
b9397ad fix: preserve onboarding redirect through GitHub OAuth
d2eabd1 fix: make sign-in GitHub only
49f06cd chore: update captain handoff - core product complete
aeaa137 feat: track Prove It mistakes in dashboard weak areas
cefaf56 feat: import UPSC-Star Mains PYQs and track study time
4844961 feat: add GitHub OAuth sign-in button
55824e0 fix: preserve next redirect through magic link auth
1aaa128 feat: connect optional selector results to onboarding
b452f3b feat: connected onboarding and study continuation flow
9821693 feat: add primary next action dashboard card
```

Repository was clean at the end of the session.

---

## Final Honest Assessment

ClearUPSC is no longer just a scaffold. It has a working end-to-end course product:

- content
- practice
- auth
- onboarding
- dashboard
- progress
- weak-area detection
- mocks
- Mains PYQs

But to become "best in the world", it must now improve in these areas:

1. Trust: more official source mapping, NCERT mapping, verified PYQs.
2. Personalization: onboarding must change the actual study path.
3. Retention: dashboard should feel like a daily coach, not just stats.
4. Quality: content needs continuous auditing topic by topic.
5. Mobile: the core aspirant experience must be excellent on a phone.
6. Answer writing: Mains feedback must become a serious differentiator.

The next major build should be:

```txt
Use onboarding answers + mistake data + mock data to generate a personalized UPSC study sequence and daily plan.
```

