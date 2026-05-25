# ClearUPSC Project Status

Last updated: 2026-05-25  
Live app: https://clearupsc.vercel.app  
Local project path: `C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc`

This document is a deep handoff report for the ClearUPSC UPSC preparation web app. It explains what has been built so far, how the project is structured, what is connected to Supabase/Vercel, what works today, what is intentionally pending, and what should be done next.

No private credentials are included in this document. Supabase keys, service-role keys, tokens, passwords, and payment secrets are intentionally redacted.

## 1. Project Overview

**Product name:** ClearUPSC  
**Tagline:** Clarity. Strategy. Rank.  
**Positioning:** A UPSC preparation operating system that combines optional selection, syllabus tracking, PYQ practice, daily planning, answer writing, spaced revision, current affairs, mock tests, and interview preparation in one product.

The product is aimed at UPSC CSE aspirants who need a structured preparation system instead of scattered PDFs, videos, notes, and generic timetables.

The current build covers:

- Landing page and acquisition funnel.
- Optional subject selector.
- Public PYQ-style practice.
- Supabase-backed authenticated product workspace.
- Onboarding profile.
- Syllabus tracker.
- Adaptive planner.
- Answer writing editor and local rubric evaluation.
- Flashcards with SM-2 review logic.
- Mock tests with negative marking.
- Current affairs digest and recall quiz.
- DAF-based interview practice.
- Profile, billing, pricing, and admin metric pages.

The live app is deployed at:

```text
https://clearupsc.vercel.app
```

## 2. Tech Stack

The app is a Next.js 14 App Router project.

Core stack:

- **Framework:** Next.js 14 App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth/database:** Supabase Auth + PostgreSQL
- **Security:** Supabase Row Level Security policies
- **Deployment:** Vercel
- **Client data fetching:** TanStack Query
- **Answer editor:** TipTap
- **UI primitives:** Radix Accordion and Progress
- **Icons:** Lucide React
- **State utility:** Zustand dependency is installed for future shared app state
- **Validation:** Zod
- **Charts dependency:** Recharts is installed for future analytics/reporting
- **Animation dependency:** Framer Motion is installed for later polish

Configured but not fully activated yet:

- **Claude/Anthropic:** adapter exists; real calls require `ANTHROPIC_API_KEY`
- **Razorpay:** checkout/verification routes exist; real payments require Razorpay keys and plan IDs
- **Upstash Redis:** environment placeholders exist; cache/rate-limit layer not active yet
- **Resend:** environment placeholder exists; transactional email not active yet

Important scripts:

```bash
npm run dev
npm run lint
npm run build
npm run seed:sql
npm run seed:db
```

## 3. Deployment and Environment

The project has been deployed to Vercel and aliased to:

```text
https://clearupsc.vercel.app
```

Vercel production deployment has been completed multiple times after the Supabase connection and later product fixes.

Supabase project has been created and connected. The app uses Supabase for:

- Auth
- PostgreSQL database
- RLS-protected user data
- Public read access for seed content such as topics, questions, mock tests, and current affairs

Supabase auth URL configuration completed:

```text
Site URL: https://clearupsc.vercel.app
Redirect callback: https://clearupsc.vercel.app/auth/callback
```

Environment categories expected:

- Public Supabase URL
- Public Supabase anon key
- Supabase service-role key for admin/server-only counts
- Anthropic API key and model
- Razorpay key ID, secret, webhook secret, and plan IDs
- Upstash Redis URL/token
- Resend API key
- Public app URL

Security note:

- The document must never include real values for service role keys, JWTs, tokens, database passwords, Razorpay secrets, or API keys.
- Public Supabase anon keys are technically client-visible, but they are still omitted here to avoid accidental credential sprawl.

## 4. Database and Seed State

The full database schema is defined in:

```text
supabase/schema.sql
```

The schema was applied successfully in Supabase.

### Tables Created

The schema includes:

- `waitlist`
- `user_profiles`
- `subscriptions`
- `topics`
- `topic_progress`
- `flashcard_queue`
- `study_plans`
- `study_plan_tasks`
- `questions`
- `question_options`
- `answer_submissions`
- `answer_evaluations`
- `mcq_attempts`
- `current_affairs`
- `mock_tests`
- `mock_test_attempts`
- `daf_entries`
- `mock_interview_sessions`
- `user_streaks`
- `user_badges`
- `notifications`

### RLS Summary

Row Level Security is enabled on all product tables.

Public-readable seed/content tables:

- `topics`
- `questions`
- `question_options`
- `current_affairs`
- `mock_tests`

Public insert:

- `waitlist`

User-owned tables are protected so users can only read/write their own data:

- profiles
- subscriptions
- progress
- flashcards
- study plans
- answer submissions
- MCQ attempts
- DAF entries
- interview sessions
- streaks
- badges
- notifications

Relational policies exist for:

- `study_plan_tasks` through the owning `study_plans` row
- `answer_evaluations` through the owning `answer_submissions` row

### Seed State

Seed scripts:

```text
scripts/build-clearupsc-seed.mjs
scripts/seed-clearupsc-db.mjs
```

Current seeded content:

- `430` UPSC syllabus topics
- `500` MCQ/practice questions
- `2000` answer options
- `3` mock tests
- `3` current affairs entries

The direct database seeder was added because very large SQL pastes through the Supabase SQL editor were unreliable. The database seeder uses the Supabase service-role key locally and should never expose that key in docs or commits.

## 5. Public Routes Built

These routes are public and do not require login:

```text
/
/optional-selector
/practice
/pricing
/auth/callback
```

### Public Acquisition Funnel

The public funnel is:

1. User lands on `/`.
2. User sees the ClearUPSC positioning, problem framing, feature overview, pricing, and answer-evaluation preview.
3. User can open `/optional-selector` to get a free optional recommendation.
4. User can open `/practice` to try a 10-question UPSC-style sprint.
5. User can view `/pricing`.
6. When the user wants persistent tracking, protected routes redirect them to login with `/?login=true`.

The login modal uses Supabase magic-link auth.

## 6. Protected Product Routes Built

Protected routes:

```text
/dashboard
/onboarding
/tracker
/syllabus
/planner
/answer-writing/practice
/flashcards
/prelims/mock-tests
/prelims/mock-tests/[id]
/current-affairs
/interview
/profile
/billing
/admin
```

Middleware behavior:

- The middleware lives in `src/middleware.ts`.
- It protects product routes.
- If the user is not logged in, protected routes redirect to:

```text
/?login=true
```

- If Supabase env vars are missing, protected routes also redirect to login instead of crashing.

## 7. Feature-by-Feature Status

### Landing Page

Status: built.

Includes:

- ClearUPSC hero section.
- Product promise.
- Problem cards explaining why aspirants fail.
- Feature modules.
- Answer-evaluation preview card.
- Pricing preview.
- Waitlist count pulled from Supabase when available.
- CTA links to optional selector and dashboard/login.

Known note:

- Some copy still mentions AI evaluation as a future/pro capability. This should be aligned with the current local-rubric evaluator before public launch.

### Optional Subject Selector

Status: built.

Includes:

- Six-question flow.
- Question screen and results screen.
- Weighted scoring matrix.
- Top optional recommendations.
- Email capture into Supabase `waitlist`.

Files involved:

- `src/lib/optional-selector/questions.ts`
- `src/lib/optional-selector/matrix.ts`
- `src/lib/optional-selector/scorer.ts`
- `src/components/optional-selector/*`

### Syllabus Tracker

Status: built and upgraded to use database topics.

Includes:

- 430-topic DB-backed syllabus pool.
- Statuses:
  - not started
  - in progress
  - completed
  - needs revision
- Subject accordions.
- Progress calculations.
- Supabase persistence through `topic_progress`.

Important route aliases:

- `/tracker`
- `/syllabus`

### Planner

Status: built.

Includes:

- Today's generated plan.
- Study task cards.
- Task completion toggle.
- Persistent study plans and tasks.
- Overdue-task count.
- Recovery Mode indicator.
- Carry-forward logic for overdue tasks into today's plan.

The planner currently creates a practical starter plan when no plan exists for the current day.

### PYQ Practice

Status: built and public.

Includes:

- Public 10-question sprint.
- Subject filter.
- Instant feedback.
- Score screen.
- Uses `/api/practice/questions`.
- Live API returns 500 database questions.
- Local bundled PYQ set remains as fallback if Supabase is unreachable.

Live verification:

```text
/api/practice/questions -> 500 questions
```

### Mock Tests

Status: built and protected.

Includes:

- Mock list from DB.
- Start attempt.
- Active mock page.
- Timer.
- Answer selection.
- Submit attempt.
- Negative marking:
  - correct: +2
  - wrong: -0.67
  - unattempted: 0
- Subject breakdown.
- Weak area detection.
- Attempt stored in `mock_test_attempts`.

Current state:

- Starter/pro payment gates were removed from mock-test flow so the protected product can be tested without payment setup.
- Mock tests still require login.

### Answer Writing

Status: built.

Includes:

- TipTap editor.
- Live word count.
- Timer.
- Question picker.
- Submit flow.
- Local rubric evaluator when Claude key is absent.
- Saves answer submissions and evaluations.
- Claude adapter exists for real AI mode.

Rubric dimensions:

- Content
- Structure
- Clarity
- Depth
- Presentation

Current behavior:

- Without `ANTHROPIC_API_KEY`, it uses local scoring logic.
- With `ANTHROPIC_API_KEY`, it is designed to call Claude through the adapter.

### Flashcards

Status: built.

Includes:

- Due-card queue.
- Starter flashcards generated if the queue is empty.
- Flip-card UI.
- Quality ratings:
  - 0 Forgot
  - 3 Hard
  - 4 Good
  - 5 Easy
- SM-2 style scheduling.
- Persistent review updates.
- Keyboard shortcuts:
  - Space flips card.
  - 0, 3, 4, 5 submit quality after flip.

SM-2 logic lives in:

```text
src/lib/product/sm2.ts
```

### Current Affairs

Status: built.

Includes:

- DB-backed latest current affairs.
- Date, title, tags, summary, and UPSC angle.
- Small recall quiz generated from loaded current affairs entries.

Current limitation:

- Real news scraping/RSS/cron pipeline is not active.
- Current affairs entries are seeded examples.

### Interview

Status: built.

Includes:

- DAF form.
- Inputs:
  - graduation subject
  - college
  - state
  - hobbies
  - work experience
  - optional subject
  - service preference
  - achievements
- Generates 12 DAF-based interview questions.
- Lets user type answers.
- Saves session and returns a readiness report.

Current behavior:

- Works through local DAF question generation.
- Claude-backed interview intelligence is pending `ANTHROPIC_API_KEY`.

### Profile

Status: built.

Includes:

- Reads current user.
- Reads onboarding profile.
- Displays:
  - email
  - plan
  - attempt
  - daily availability
  - optional
  - target year
  - weak areas
  - strong areas

### Billing

Status: partially built.

Includes:

- Plan display.
- Pricing/billing route.
- Razorpay API route skeletons.

Current limitation:

- Real checkout is not active because Razorpay keys and plan IDs are not configured.

### Admin

Status: built.

Includes:

- Server-side service-role admin client.
- Table-count metrics:
  - profiles
  - waitlist
  - subscriptions
  - answer submissions
  - mock attempts
  - seeded topics
  - seeded MCQs

Security note:

- Admin page is currently protected only by login middleware, not by an admin role. Before public launch, restrict `/admin` to a specific admin email or role.

## 8. API Routes Built

### Onboarding

```text
POST /api/onboarding/complete
```

Purpose:

- Saves user preparation profile.
- Seeds first 7 days of study plans.
- Seeds starter flashcards.

Auth:

- Requires login.

Persistence:

- `user_profiles`
- `study_plans`
- `study_plan_tasks`
- `flashcard_queue`

### Plans

```text
GET /api/plans/today
POST /api/plans/tasks/[id]/complete
```

Purpose:

- Load today's plan.
- Create today's plan if missing.
- Complete/uncomplete tasks.
- Carry forward overdue tasks.

Auth:

- Requires login.

Persistence:

- `study_plans`
- `study_plan_tasks`

### Syllabus

```text
GET /api/syllabus
PATCH /api/syllabus/[topicId]
```

Purpose:

- Load syllabus topics and user progress.
- Update topic status.

Auth:

- Requires login.

Persistence:

- `topics`
- `topic_progress`

### Answers

```text
POST /api/answers/submit
GET /api/answers/history
```

Purpose:

- Submit answer.
- Evaluate through local rubric or Claude adapter.
- Save submission and evaluation.
- Load answer history.

Auth:

- Requires login.

Persistence:

- `answer_submissions`
- `answer_evaluations`

### Flashcards

```text
GET /api/flashcards/due
POST /api/flashcards/[id]/review
```

Purpose:

- Load due cards.
- Seed starter cards if none exist.
- Apply SM-2 review scheduling.

Auth:

- Requires login.

Persistence:

- `flashcard_queue`

### Practice Questions

```text
GET /api/practice/questions
```

Purpose:

- Public endpoint for DB-backed practice question pool.

Auth:

- Public.

Persistence:

- Reads `questions` and `question_options`.

### Mock Tests

```text
GET /api/mock-tests
POST /api/mock-tests/[id]/start
POST /api/mock-tests/[id]/submit
```

Purpose:

- Load mock tests.
- Start mock attempt.
- Submit answers.
- Score with negative marking.
- Store attempt and weak-area results.

Auth:

- Requires login.

Persistence:

- `mock_tests`
- `mock_test_attempts`
- `topic_progress` for weak area auto-flagging

### Current Affairs

```text
GET /api/current-affairs/latest
```

Purpose:

- Load latest current affairs digest entries.

Auth:

- Requires login through page/middleware.

Persistence:

- Reads `current_affairs`.

### Interview

```text
POST /api/interview/generate
POST /api/interview/evaluate
```

Purpose:

- Save DAF.
- Generate 12 DAF-based questions.
- Capture answers.
- Generate report.
- Save interview session.

Auth:

- Requires login.

Persistence:

- `daf_entries`
- `mock_interview_sessions`

### User Stats and Badges

```text
GET /api/user/stats
GET /api/user/badges
```

Purpose:

- Dashboard stats.
- Badge data.

Auth:

- Requires login.

Persistence:

- Reads across progress, plans, flashcards, answer history, streaks, badges.

### Payments

```text
POST /api/payments/create-subscription
POST /api/payments/verify
POST /api/webhooks/razorpay
```

Purpose:

- Payment flow skeleton for Razorpay.
- Verification/webhook routes.

Auth:

- Checkout creation expects user context once fully activated.

Current limitation:

- Real payment activation is pending Razorpay credentials and plan IDs.

## 9. AI and Payment Status

### AI Status

Claude adapter files exist:

```text
src/lib/ai/answer-eval.ts
src/lib/ai/interview.ts
```

Current behavior:

- Answer writing works without Claude by using a local rubric evaluator.
- Interview works without Claude by using local DAF-based generated questions.

Pending:

- Add `ANTHROPIC_API_KEY`.
- Confirm model name.
- Validate Claude JSON output.
- Add cost/rate limiting before public launch.
- Add Redis cache if AI usage becomes expensive.

### Payment Status

Pricing and billing pages exist.

Payment-related routes exist:

- create subscription
- verify payment
- Razorpay webhook

Pending:

- Razorpay key ID
- Razorpay key secret
- Razorpay webhook secret
- Starter plan ID
- Pro plan ID
- Premium plan ID
- signature verification hardening
- real subscription lifecycle updates

### Redis, Email, Current Affairs Automation

Environment placeholders exist for:

- Upstash Redis
- Resend email
- app URL

Not active yet:

- Redis cache
- rate limiting
- transactional email
- current-affairs scraping/RSS/cron pipeline
- monthly current affairs PDF generation

## 10. Verification Already Done

Local checks completed:

```bash
npm run lint
npm run build
```

Both passed cleanly after the latest fixes.

Production deployment completed through Vercel.

Live smoke checks completed:

```text
https://clearupsc.vercel.app/ -> 200
https://clearupsc.vercel.app/pricing -> 200
https://clearupsc.vercel.app/practice -> 200
https://clearupsc.vercel.app/dashboard -> 307 to /?login=true
https://clearupsc.vercel.app/interview -> 307 to /?login=true
https://clearupsc.vercel.app/syllabus -> 307 to /?login=true
https://clearupsc.vercel.app/api/practice/questions -> 500 questions
```

This means the public app works, protected route redirects work, and the public practice question API is reading the Supabase database.

## 11. Known Issues and Remaining Polish

Important remaining issues:

- A full authenticated user journey still needs to be tested with a real magic-link login.
- Some UI copy should receive a final human-polish pass before public launch.
- The dashboard source should be rechecked for encoding/mojibake artifacts such as broken apostrophes or dot separators.
- `/admin` must be restricted to an admin role or allowlisted email before public launch.
- Plan gating strategy is not final. Some features have been opened for testing, but public/free/paid boundaries need a product decision.
- Generated seed MCQs are useful for wiring and demos, but real UPSC launch quality needs hand-curated questions and stronger explanations.
- Current affairs are seeded examples, not a live automated pipeline.
- Mock tests are 10-question mini tests, not full 100-question UPSC Prelims simulations yet.
- No real payment transaction has been tested.
- No real Claude API call has been tested in production.
- Mobile QA at 375px has not been fully completed after the latest feature additions.

## 12. Next Best Steps

Recommended immediate next steps:

1. Create one real test user through the live login modal.
2. Complete onboarding.
3. Verify these as a logged-in user:
   - dashboard
   - planner
   - syllabus/tracker
   - flashcards
   - answer writing
   - mock tests
   - current affairs
   - interview
   - profile
4. Restrict `/admin` to only the owner/admin.
5. Run mobile QA at 375px width.
6. Fix any UI copy/encoding issues.
7. Decide what stays free and what becomes paid.
8. Replace generated MCQs with higher-quality UPSC-style content.
9. Add better explanations to all MCQs.
10. Add Razorpay credentials when payment launch is needed.
11. Add Claude key when AI launch is needed.
12. Add Redis rate limiting before high-traffic AI launch.
13. Add SEO/legal pages if public acquisition is the goal.
14. Add real current-affairs ingestion pipeline later.

## 13. Important Files and Responsibilities

Core app routes:

```text
src/app/page.tsx
src/app/practice/page.tsx
src/app/dashboard/page.tsx
src/app/planner/page.tsx
src/app/tracker/page.tsx
src/app/answer-writing/practice/page.tsx
src/app/flashcards/page.tsx
src/app/prelims/mock-tests/page.tsx
src/app/interview/page.tsx
src/app/profile/page.tsx
src/app/admin/page.tsx
```

Core product logic:

```text
src/lib/product/db.ts
src/lib/product/sm2.ts
src/lib/product/plans.ts
```

Supabase clients:

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/admin.ts
src/lib/supabase/config.ts
```

AI adapters:

```text
src/lib/ai/answer-eval.ts
src/lib/ai/interview.ts
```

Database:

```text
supabase/schema.sql
supabase/seed.sql
scripts/build-clearupsc-seed.mjs
scripts/seed-clearupsc-db.mjs
```

Types:

```text
src/types/index.ts
src/types/razorpay.d.ts
```

Middleware:

```text
src/middleware.ts
```

## 14. Honest Status Summary

ClearUPSC is no longer just a visual shell. It now has a real Supabase-backed product foundation:

- Auth-aware protected workspace.
- Real database schema.
- Seeded syllabus and questions.
- Persistent user progress.
- Persistent planner.
- Persistent answer writing.
- Persistent flashcards.
- Persistent mock attempts.
- Persistent DAF/interview sessions.
- Public acquisition pages.
- Vercel live deployment.

However, it is not yet a full commercial UPSC platform. The next step is quality and launch hardening:

- real user QA
- stronger content
- admin protection
- final plan gates
- Claude activation
- Razorpay activation
- current-affairs automation
- mobile polish

The project is in a strong product-foundation stage, ready for a serious QA and content-quality pass.
