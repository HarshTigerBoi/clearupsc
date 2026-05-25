# ClearUPSC — Master Build Framework
**Director: Claude | Worker: Codex**
**Last updated: May 25, 2026**
**Stack: Next.js 14 App Router + TypeScript + Tailwind + Supabase + Vercel**

---

## HONEST STATUS BEFORE WE START

You are NOT starting from zero. Foundation is solid:
- ✅ Live at clearupsc.vercel.app
- ✅ Auth (magic-link), DB schema, RLS, 20 routes
- ✅ 430 topics, 500 MCQs, planner, flashcards, answer writing, interview, mock tests
- ✅ Recharts, Framer Motion, Zustand, Zod already installed

What is actually missing:
- ❌ Content quality (MCQs are AI-generated, not UPSC standard)
- ❌ Full 100-question mock tests (only 10-question minis)
- ❌ Live current affairs pipeline (3 seeded examples only)
- ❌ Admin protection
- ❌ Mobile QA
- ❌ PYQ actual papers (2010–2025)
- ❌ Essay module
- ❌ CSAT module
- ❌ Notes system
- ❌ Analytics / weak-area detection
- ❌ Payments active
- ❌ Email system active
- ❌ Free SEO tools for traffic

---

## PHASE 0 — STABILISATION (Do this FIRST, before adding anything)
**Goal: Make what exists actually work end-to-end**
**Time estimate: 1–2 days**

### Task 0.1 — Admin Protection
**File:** `src/app/admin/page.tsx` + `src/middleware.ts`

Codex instruction:
```
Add an ADMIN_EMAIL env variable. In middleware.ts, if the route starts 
with /admin, check session user email against process.env.ADMIN_EMAIL. 
If not matching, redirect to /dashboard. No third-party needed.
```

### Task 0.2 — Full Auth Journey Test Script
**File:** new file `scripts/test-auth-journey.md`

Codex instruction:
```
Create a manual QA checklist markdown file. Cover: magic-link login, 
onboarding completion, dashboard load, planner task toggle, syllabus 
topic status update, flashcard review, answer writing submission, 
mock test attempt, current affairs page, interview DAF save, 
profile update, billing page, logout. Each item has pass/fail checkbox.
```

### Task 0.3 — Mobile QA Fix Pass
**All page files under src/app/**

Codex instruction:
```
For every page component, add a mobile viewport audit. 
Fix: overflow-x issues, text truncation on small screens, 
button tap targets below 44px, tables that break on 375px. 
Use Tailwind responsive prefixes (sm:, md:). 
Target: every page renders cleanly at 375px width.
```

### Task 0.4 — Fix Dashboard Encoding
**File:** `src/app/dashboard/page.tsx`

Codex instruction:
```
Search for and replace all broken apostrophes (â€™), ellipsis 
artifacts (â€¦), and dot separator artifacts. Replace with 
proper Unicode: ' for apostrophe, … for ellipsis, · for middot.
```

### Task 0.5 — Plan Gating Decision (implement)
**File:** `src/lib/product/plans.ts`

Codex instruction:
```
Define three tiers:
- FREE: practice (10 questions), optional selector, syllabus tracker 
  (view only), 5 flashcards/day
- PRO (₹999/month): full planner, full flashcards, answer writing 
  (10/day), mock tests (3/month), current affairs
- PREMIUM (₹1999/month): everything + interview prep + unlimited 
  answer writing + priority

Add a canAccess(feature: string, plan: string): boolean utility.
Apply gates to protected routes via a useFeatureGate hook.
Show upgrade prompts instead of hard blocks.
```

---

## PHASE 1 — CONTENT ENGINE (Most critical for product value)
**Goal: Real UPSC-quality content at scale**
**Time estimate: 3–5 days**
**All free — no paid APIs needed**

### Task 1.1 — PYQ Bank (2010–2025 Actual Papers)
**New table:** `pyq_questions` in Supabase
**New seed:** `scripts/build-pyq-seed.mjs`

Codex instruction:
```
Create a new Supabase table: pyq_questions
Schema:
- id uuid primary key
- year int (2010–2025)
- paper text ('GS1'|'GS2'|'GS3'|'GS4'|'CSAT'|'Essay')
- question_text text
- options jsonb (array of 4 strings for MCQ, null for essay)
- correct_option int (0-3, null for essay)
- explanation text
- topics text[] (array of topic tags)
- difficulty text ('easy'|'medium'|'hard')
- source text ('UPSC Official')
- created_at timestamptz

Add RLS: public read, no user write.

Create seed script that inserts 500 real PYQ-style questions 
organized by year and paper. Use actual UPSC question patterns 
from public domain papers. Do NOT use hallucinated questions — 
format them as "Based on UPSC [year] pattern" if not exact.

Create API route: GET /api/pyq/questions?year=&paper=&limit=
```

### Task 1.2 — Upgrade MCQ Quality (500 → 3000)
**Existing table:** `questions`
**File:** `scripts/build-clearupsc-seed.mjs`

Codex instruction:
```
Expand the existing MCQ seed to 3000 questions. 
Distribution:
- Polity: 500 questions (Constitutional articles, amendments, 
  SC judgments, schemes)
- Geography: 400 (Physical, Human, Indian resources)
- Economy: 400 (Monetary policy, banking, government schemes)
- History: 400 (Ancient, Medieval, Modern — equal split)
- Environment: 350 (Biodiversity, conventions, climate)
- Science & Tech: 300 (Space, biotech, defence)
- Current Affairs 2024–2025: 250 (integrated with static topics)
- CSAT: 200 (comprehension, logical reasoning, numeracy)
- Ethics: 200 (case studies, thinkers, concepts)

Each question MUST have:
- 4 options (A, B, C, D)
- Correct answer
- 150-word explanation with source reference 
  (article number, committee name, year, etc.)
- Difficulty tag
- Topic tags (2–3 per question)
- Year tag if PYQ-pattern

Re-run seed script after expansion.
```

### Task 1.3 — Full 100-Question Mock Tests (UPSC Prelims Standard)
**Existing table:** `mock_tests`

Codex instruction:
```
Upgrade mock_tests table: add field 'type' 
('mini'|'sectional'|'full_length')

Create 10 full-length mock tests:
- Each: 100 questions, 120 minutes, -0.67 negative marking
- Mix: match actual UPSC subject weightage from research doc
  (Current Affairs 22%, Polity 18%, Geography 16%, Economy 14%, 
   Environment 14%, History 17%, S&T 8%)

Create 20 sectional tests:
- Each: 30 questions, 35 minutes, specific subject
- Cover all 7 GS subjects

Create 5 CSAT mock tests:
- Each: 80 questions, 120 minutes

Update mock test UI at /prelims/mock-tests to:
- Show test type badge (Mini/Sectional/Full Length)
- Show subject distribution pie chart before starting
- Show time remaining with color warning below 15 minutes
- Add pause functionality (save state to DB)
- Show detailed analysis after submission:
  - Score, percentile estimate, time per question
  - Subject-wise accuracy breakdown
  - Weak area identification
  - Question-wise review with explanations
```

### Task 1.4 — Essay Module (New Feature)
**New route:** `/essay`
**New table:** `essay_submissions`

Codex instruction:
```
New Supabase table: essay_submissions
- id, user_id, topic text, content text (TipTap JSON), 
  word_count int, time_spent_minutes int, 
  self_score int (1-10), created_at

New page: /essay with:
1. Essay topic browser (100 topics organized by category:
   - Abstract concepts: Democracy, Justice, Freedom
   - Social issues: Women empowerment, Poverty
   - Economic: Globalization, Development
   - Philosophy: Ethics, Values
   - UPSC past essay topics 2010-2025)
2. Essay writing zone:
   - TipTap editor (reuse existing)
   - Word count live counter (target: 1000-1200 words)
   - Timer (3-hour countdown, UPSC standard)
   - Auto-save every 60 seconds
3. Self-evaluation rubric after submission:
   - Introduction quality (1-5)
   - Argument depth (1-5)  
   - Structure clarity (1-5)
   - Conclusion strength (1-5)
   - Overall impression (1-5)
4. Essay history with past attempts

Add /essay to protected routes in middleware.ts
```

### Task 1.5 — CSAT Module (New Feature)
**New route:** `/csat`

Codex instruction:
```
New page: /csat with three sub-sections:
1. Comprehension Practice
   - Load reading passages (200-500 words)
   - 3-5 questions per passage
   - Immediate feedback
   
2. Logical Reasoning Practice  
   - Question types: Series, Analogies, Syllogisms, Puzzles
   - Difficulty levels: Easy/Medium/Hard
   - Timer per question
   - Technique hints (from research doc: extreme elimination, 
     opposite options, qualifier analysis)
   
3. Data Interpretation
   - Tables, bar charts, pie charts
   - 4-5 questions per set
   - Show chart visually using Recharts

Use existing questions table with paper='CSAT' filter.
Add to protected routes.
Track attempts in mcq_attempts table with paper='CSAT'.
```

---

## PHASE 2 — INTELLIGENCE LAYER (Makes app smarter)
**Goal: Personalized experience without AI cost**
**Time estimate: 3–4 days**

### Task 2.1 — Weak Area Detection Engine
**File:** `src/lib/product/analytics.ts` (new)

Codex instruction:
```
Create analytics engine that reads from:
- mcq_attempts (accuracy per topic)
- mock_test_attempts (subject-wise scores)
- topic_progress (revision status)
- answer_submissions (self-scores)
- flashcard_queue (overdue cards)

Compute for each user:
- weakTopics: topics with <60% accuracy AND not marked 'needs revision'
- strongTopics: topics with >85% accuracy
- neglectedTopics: topics with no activity in 14+ days
- preparednessScore: 0-100 composite score per GS paper
- estimatedPrelimsScore: based on MCQ accuracy patterns
- streakRisk: days since last activity by module

Expose via: GET /api/user/analytics
Return all computed fields, cached in user_profiles.analytics_cache jsonb column.
Recompute on: mock test submit, 10 MCQ attempts, daily cron.
```

### Task 2.2 — Smart Dashboard (Replace current)
**File:** `src/app/dashboard/page.tsx`

Codex instruction:
```
Redesign dashboard using Recharts and analytics endpoint.
Layout:
1. Header: Streak, days to UPSC 2027 countdown, preparedness score
2. Row 1 — Three stat cards:
   - Prelims readiness % (based on MCQ accuracy)
   - Mains readiness % (based on answer writing count)
   - Topics covered % (from topic_progress)
3. Row 2 — Weak Area Alert:
   - List top 5 weak topics with "Practice Now" buttons
   - Each button links to filtered MCQ practice
4. Row 3 — Two charts side by side:
   - Radar chart: GS1/GS2/GS3/GS4/Optional preparedness
   - Line chart: Daily study time last 14 days
5. Row 4 — Today's Plan preview (from planner)
6. Row 5 — Recent activity feed

Use Recharts RadarChart, LineChart, BarChart.
Use Framer Motion for number countup animations on stats.
```

### Task 2.3 — Revision Calendar
**New route:** `/revision`
**New table:** `revision_schedule`

Codex instruction:
```
Build a monthly calendar view at /revision that shows:
- Days color-coded by study activity (GitHub contribution style)
- Topics due for revision today (SM-2 algorithm from sm2.ts)
- Overdue revisions highlighted in red
- Upcoming revisions for next 7 days

Calendar interaction:
- Click any day → see what was studied / what's due
- "Mark Revised" button for each topic
- Topics auto-schedule next revision using SM-2 intervals:
  0→1→3→7→14→30→60→120 days

This uses existing flashcard_queue SM-2 logic, extended to topics.
```

### Task 2.4 — Performance Analytics Page
**New route:** `/analytics`

Codex instruction:
```
Full analytics page with:

Section 1 — Prelims Tracker
- MCQ accuracy by subject (bar chart)
- Accuracy trend over last 30 days (line chart)  
- Mock test scores history (scatter plot)
- Estimated Prelims score vs cutoff benchmark

Section 2 — Mains Tracker
- Answer writing count by GS paper
- Self-score average trend
- Word count average trend
- Days since last answer writing session

Section 3 — Subject Heatmap
- Grid of all 430 topics
- Color: red (not started) → yellow (in progress) → green (completed)
- Click topic → jump to syllabus tracker at that topic

Section 4 — Study Consistency
- Calendar heatmap (last 3 months)
- Streak statistics (current, longest, average)
- Module-wise activity breakdown

All charts use Recharts. No external analytics service needed.
```

### Task 2.5 — Notes System
**New route:** `/notes`
**New table:** `user_notes`

Codex instruction:
```
New Supabase table: user_notes
- id, user_id, title text, content text (TipTap JSON), 
  topic_id uuid references topics(id) nullable,
  tags text[], is_pinned bool, created_at, updated_at

Notes page at /notes:
1. Left sidebar: All notes list (title + date + tags)
   - Search bar (searches title + content)
   - Filter by topic or tag
   - Pin/unpin toggle
2. Right pane: TipTap editor (reuse existing)
   - Auto-save every 30 seconds
   - Tag input
   - Link to syllabus topic (dropdown selector)

Also: Add "Add Note" button to syllabus tracker 
next to each topic → opens note pre-linked to that topic.

This is critical because toppers maintain consolidated notes.
```

---

## PHASE 3 — CURRENT AFFAIRS ENGINE (Free pipeline)
**Goal: Daily current affairs without paying for content**
**Time estimate: 2–3 days**

### Task 3.1 — Free RSS Pipeline
**New file:** `src/lib/current-affairs/rss-fetcher.ts`
**New API:** `src/app/api/cron/current-affairs/route.ts`

Codex instruction:
```
Free RSS sources (all public, no auth needed):
- PIB (Press Information Bureau): https://pib.gov.in/RssMain.aspx
- RSTV: available via RSS
- Rajya Sabha TV: public RSS
- Ministry of Finance: press releases RSS
- NITI Aayog: newsroom RSS
- MEA (Ministry of External Affairs): public statements RSS

Build RSS fetcher:
import { XMLParser } from 'fast-xml-parser'

Fetch each source, parse items, extract:
- title, description, link, pubDate, source

Classify each item into UPSC categories:
- Polity, Economy, International Relations, Environment, 
  Science & Tech, Social Issues, Defence, Awards

Store in current_affairs table with:
- headline, summary (200 words), source_url, category, date

Set up Vercel Cron Job (free tier allows 1/day):
// vercel.json
{
  "crons": [{ "path": "/api/cron/current-affairs", "schedule": "0 8 * * *" }]
}

Cron runs at 8 AM IST daily, fetches last 24h items.
```

### Task 3.2 — Current Affairs Page Upgrade
**File:** `src/app/current-affairs/page.tsx`

Codex instruction:
```
Upgrade current affairs page:
1. Daily digest view: grouped by date, categorized
2. Category filter tabs (Polity, Economy, IR, etc.)
3. Search across all entries
4. Each entry:
   - Headline
   - 200-word summary
   - UPSC relevance tag ("Important for Prelims"/"Mains GS-2" etc.)
   - Source link
   - "Add to Notes" button → creates note with this content
   - "Add to Flashcard" button → creates flashcard for this item
5. Monthly archive view
6. "Download Monthly PDF" button (generate PDF using jsPDF — free)

Monthly PDF format:
- Organized by category
- Key facts highlighted
- Important for UPSC annotations
```

### Task 3.3 — Current Affairs Recall Quiz
**New route:** `/current-affairs/quiz`

Codex instruction:
```
Auto-generate quiz from recent current affairs entries.
- Pull last 7 days of current affairs
- Convert headlines → MCQ questions automatically using template:
  "Which [category] was recently [action] by [entity]?"
- 10-question daily quiz
- Score and track in mcq_attempts with source='current_affairs'
- Show explanation with full article link after each answer
```

---

## PHASE 4 — INTERVIEW PREP UPGRADE
**Goal: Complete interview preparation system**
**Time estimate: 2 days**

### Task 4.1 — DAF Deep Analysis
**File:** `src/app/interview/page.tsx`

Codex instruction:
```
Upgrade the interview module:

1. DAF Form (expanded):
   - Name, DOB, hometown, state
   - Educational qualifications (all degrees)
   - Work experience (each job: company, role, years, key achievements)
   - Hobbies (up to 5, with depth questions for each)
   - Optional subject
   - Sports/extracurriculars
   - Family background (father/mother occupation)
   - Native language
   - Visited places
   
2. Question Generation Engine (without AI):
   Create a rule-based question generator using templates:
   
   From hometown → "What is [hometown] known for? 
                     What issues does [state] face?"
   From education → "Why did you choose [degree] if you want IAS?"
   From work experience → "What did you learn from your role at [company]?"
   From hobby → "How does [hobby] prepare you for administration?"
   From optional → "How is [optional subject] relevant to governance?"
   
   Generate 20 questions per DAF entry.
   Categorize: Introductory, DAF-based, Current Affairs, 
   Philosophical, Administrative Scenario.

3. Practice Mode:
   - Show question, user types answer
   - Timer (2 minutes per answer)
   - Self-evaluation: Confidence (1-5), Completeness (1-5)
   - Save session with all Q&A
   
4. Model Answer Library:
   - 50 common UPSC interview questions with model answers
   - Categories: "Tell me about yourself", "Why IAS?", 
     "Current issues", "Ethical dilemmas"
   
5. Board-specific preparation:
   - Add board member info (Smita Nagraj board, etc.)
   - Known question patterns per board
```

---

## PHASE 5 — SEO & FREE TRAFFIC TOOLS
**Goal: Get Google traffic without spending money**
**Time estimate: 2 days**

### Task 5.1 — SEO Meta System
**File:** `src/app/layout.tsx` + all page files

Codex instruction:
```
Add Next.js Metadata API to every page:

Landing page: 
  title: "ClearUPSC — Free UPSC Study Planner & Practice Tests"
  description: "Free UPSC preparation app with syllabus tracker, 
  PYQ practice, answer writing, mock tests and current affairs. 
  Used by IAS aspirants across India."
  keywords: "upsc preparation, upsc study planner, upsc mock test, 
  upsc syllabus tracker, upsc current affairs, ias preparation"

Practice page:
  title: "Free UPSC Practice Questions — 500+ MCQs with Explanations"
  
Optional selector:
  title: "UPSC Optional Subject Selector — Which Optional is Best for You?"

Each blog/static page:
  Use generateMetadata() for dynamic titles.

Add: robots.txt allowing all crawlers
Add: sitemap.xml (Next.js built-in generation)
Add: OpenGraph images for social sharing
```

### Task 5.2 — Free SEO Landing Pages
**New routes:** static content pages

Codex instruction:
```
Create these static pages (no DB needed, pure content):

/upsc-syllabus — Full GS1/GS2/GS3/GS4 syllabus in structured HTML
  Target: "upsc syllabus 2026" (high volume)

/upsc-cutoff — Historical cutoff marks table 2015–2025
  Target: "upsc cutoff 2025" (high volume)

/upsc-optional-subjects — Guide to all 48 optional combinations
  Target: "upsc optional subject" (high volume)

/upsc-answer-writing — Guide to IBC format with examples
  Target: "upsc answer writing tips"

/upsc-current-affairs — Redirect to /current-affairs with SEO text

Each page:
- 1500+ words of real content
- Tables with data
- Internal links to app features
- CTA to sign up
- Schema.org markup (FAQPage, HowTo)
```

### Task 5.3 — UPSC Eligibility Checker (Free Tool)
**New route:** `/tools/eligibility`

Codex instruction:
```
Interactive eligibility checker (client-side only, no DB):
Questions:
1. Nationality (Indian citizen only)
2. Date of birth → calculate age
3. Category (General/OBC/SC/ST/PH)
4. Number of attempts used

Output:
- Are you eligible? Yes/No
- Age limit remaining
- Attempts remaining
- Final attempt year
- Recommended preparation timeline

Pure client-side calculation using UPSC rules:
- General: 21-32 years, 6 attempts
- OBC: 21-35 years, 9 attempts  
- SC/ST: 21-37 years, unlimited
- PH General: 21-42 years, 9 attempts

Add to public routes. This gets Google traffic.
```

### Task 5.4 — Study Schedule Generator (Free Tool)
**New route:** `/tools/study-planner`

Codex instruction:
```
Interactive study schedule generator (client-side only):
Inputs:
- Exam date (Prelims: June 2027 expected)
- Daily study hours available (4/6/8/10+)
- Current preparation level (Beginner/Intermediate/Advanced)
- Weak subjects (multi-select)
- Optional subject chosen

Output:
- Week-by-week study plan (scrollable)
- Subject-wise hour allocation
- Milestone checkpoints
- Downloadable as PDF (use jsPDF, free)

Pure calculation, no DB. Shareable URL with params.
This is highly searchable: "upsc study plan 2026"
```

---

## PHASE 6 — PAYMENTS & EMAIL (Monetisation activation)
**Goal: Activate revenue**
**Time estimate: 1–2 days when ready**

### Task 6.1 — Razorpay Activation
**Files:** `src/app/api/payments/` routes

Codex instruction:
```
When Razorpay credentials are available:
1. Add to .env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, 
   RAZORPAY_WEBHOOK_SECRET
2. Create Razorpay subscription plans in dashboard:
   - starter_monthly: ₹999/month
   - pro_monthly: ₹1999/month
3. Add plan IDs to .env
4. Activate create-subscription route (already scaffolded)
5. Add Razorpay checkout SDK to pricing page
6. Test full flow: checkout → webhook → subscription update in DB
7. Add subscription status check to useFeatureGate hook
```

### Task 6.2 — Email System (Resend — 100 free/day)
**Files:** `src/app/api/` email routes

Codex instruction:
```
Add RESEND_API_KEY to .env (free tier: 100 emails/day).

Email sequences to build:
1. Welcome email (trigger: new signup)
   - Subject: "Welcome to ClearUPSC — Your UPSC Journey Starts Now"
   - Content: Feature tour, 3 things to do first
   
2. Day 3 retention email (trigger: no login for 3 days)
   - Subject: "Your UPSC preparation is waiting"
   - Content: Show their progress stats
   
3. Weekly progress email (trigger: every Sunday 8 AM)
   - Subject: "Your week in ClearUPSC — [X] topics covered"
   - Content: Weekly stats, upcoming revision topics
   
4. Mock test completion email
   - Subject: "Your mock test result — [score]/200"
   - Content: Score analysis, improvement areas

Use Resend React Email templates.
All emails triggered via Supabase Edge Functions or Vercel API routes.
```

---

## PHASE 7 — AI ACTIVATION (When budget allows)
**Goal: Add Claude for answer evaluation and interview**
**Time estimate: 1 day (wiring only, infra already exists)**

### Task 7.1 — Answer Writing AI Evaluation
**File:** `src/lib/ai/answer-eval.ts`

Codex instruction:
```
When ANTHROPIC_API_KEY is available:
Upgrade answer-eval.ts to call Claude API.
System prompt for evaluation:
"You are a UPSC Mains examiner. Evaluate the answer on:
1. Content Accuracy (40%): Correct facts, relevant information
2. Structure (25%): IBC format, subheadings, logical flow
3. Clarity (20%): Simple language, concise writing
4. Depth (10%): Critical thinking, multi-dimensional approach
5. Presentation (5%): Organisation and readability

Score each criterion out of 10.
Return JSON: { content: N, structure: N, clarity: N, depth: N, 
presentation: N, total: N, feedback: '...', improvements: ['...'] }"

Add cost tracking: log each API call cost to user_profiles.
Add rate limiting: max 10 AI evaluations/day per user on Pro plan.
Add Upstash Redis cache: cache evaluation for identical answers.
```

### Task 7.2 — Interview Question Generation (AI upgrade)
**File:** `src/lib/ai/interview.ts`

Codex instruction:
```
Upgrade interview.ts to use Claude for:
1. DAF analysis → generate personalized questions
2. Answer evaluation → give feedback on each response
3. Mock interview summary report

System prompt:
"You are a UPSC Interview Board member. Based on this DAF, 
generate 12 questions covering: personal background (3), 
academic/professional (3), optional subject (2), 
current affairs (2), philosophical/ethical (2).
Questions should be realistic board-style questions."

Add streaming response for better UX during generation.
```

---

## PHASE 8 — POLISH & LAUNCH HARDENING
**Goal: Production-ready for public launch**
**Time estimate: 2 days**

### Task 8.1 — Legal Pages
**New routes:** `/privacy`, `/terms`, `/refund`

Codex instruction:
```
Create three static pages:
/privacy — Privacy policy (DPDP Act 2023 compliant for India)
  Cover: data collected, how used, third parties, user rights
/terms — Terms of service  
  Cover: subscription terms, cancellation, prohibited use
/refund — Refund policy
  Cover: 7-day refund for annual plans, no refund monthly

Add to footer links.
```

### Task 8.2 — Error Handling & Loading States
**All page files**

Codex instruction:
```
Add to every page:
1. Loading skeleton (not spinner) — use Tailwind animate-pulse
2. Empty state component when no data
3. Error boundary with retry button
4. Network error toast notifications

Create shared components:
- <LoadingSkeleton rows={N} /> 
- <EmptyState icon message cta />
- <ErrorMessage message onRetry />
```

### Task 8.3 — PWA (Progressive Web App)
**Files:** `public/manifest.json`, `next.config.js`

Codex instruction:
```
Make ClearUPSC installable on mobile (free, no service needed):
1. Add manifest.json to /public:
   name: "ClearUPSC"
   short_name: "ClearUPSC"
   theme_color: "#1a1a2e"
   background_color: "#ffffff"
   display: "standalone"
   icons: [192px, 512px PNG versions of logo]

2. Add next-pwa package (free):
   npm install next-pwa
   Configure in next.config.js

3. Add offline page: /offline — shows "No internet connection" 
   with cached content options

This lets students install the app on Android like a native app.
Free. No app store needed.
```

---

## FREE TOOLS & SERVICES SUMMARY

| Service | What For | Free Tier |
|---------|----------|-----------|
| Vercel | Hosting + Cron jobs | 100GB bandwidth/month |
| Supabase | DB + Auth + Storage | 500MB DB, 50MB storage |
| Resend | Transactional email | 100 emails/day |
| Upstash Redis | Caching + rate limits | 10,000 requests/day |
| jsPDF | PDF generation | Free, client-side |
| fast-xml-parser | RSS parsing | Free npm package |
| next-pwa | PWA/offline support | Free npm package |
| Recharts | All charts/graphs | Free, already installed |
| PIB RSS | Government news | Completely free |
| UPSC website | PYQ papers | Public domain |

**Everything except Claude API and Razorpay is free.**

---

## PRIORITY ORDER FOR CODEX (exact sequence)

```
WEEK 1:
Day 1: Phase 0 (all 5 stabilisation tasks)
Day 2: Phase 1, Task 1.2 (MCQ expansion to 3000)
Day 3: Phase 1, Task 1.3 (full 100-question mock tests)
Day 4: Phase 1, Task 1.1 (PYQ bank)
Day 5: Phase 2, Task 2.1 + 2.2 (analytics engine + smart dashboard)

WEEK 2:
Day 6: Phase 1, Task 1.4 + 1.5 (Essay + CSAT modules)
Day 7: Phase 2, Task 2.5 (Notes system)
Day 8: Phase 3, Task 3.1 + 3.2 (current affairs pipeline)
Day 9: Phase 5, Task 5.1 + 5.2 (SEO pages)
Day 10: Phase 5, Task 5.3 + 5.4 (free tools for traffic)

WEEK 3:
Day 11: Phase 2, Task 2.3 + 2.4 (revision calendar + analytics page)
Day 12: Phase 4, Task 4.1 (interview upgrade)
Day 13: Phase 8, Task 8.1 + 8.2 + 8.3 (polish + PWA)
Day 14: Phase 6 (payments + email activation)
```

---

## HOW TO GIVE TASKS TO CODEX

Always include this context block at the start of every Codex session:

```
Project: ClearUPSC UPSC preparation web app
Stack: Next.js 14 App Router, TypeScript, Tailwind CSS, 
       Supabase (Auth + PostgreSQL), Vercel, TanStack Query, 
       TipTap, Recharts, Framer Motion, Zustand, Zod, Radix UI
Live URL: https://clearupsc.vercel.app
Local path: C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc

Today's task: [paste exact task from this framework]
```

---

## WHAT MAKES CLEARUPSC THE BEST (non-negotiables)

Every topper needs these — build them all:

1. **Real PYQ bank** — 15 years of actual papers, not generated MCQs
2. **Full-length mock tests** — 100 questions, real timer, real negative marking
3. **SM-2 flashcards** — spaced repetition is the #1 retention technique
4. **Answer writing with rubric** — structured IBC feedback
5. **Daily current affairs** — automated, categorized, quiz-able
6. **Syllabus tracker** — every topic, every paper, with progress %
7. **Notes system** — linked to topics, searchable
8. **Analytics** — know your weak areas before the exam does
9. **Interview prep** — DAF-based, realistic board questions
10. **Essay module** — most neglected, highest differentiator

No competitor has all 10 working well for free. That is the moat.
