# ClearUPSC Antigravity Handoff

## One-Line Mission

Build ClearUPSC into the strongest UPSC preparation web app: a full course platform where every topic has easy explanations, deep notes, concise notes, revision notes, NCERT links, government sources, PYQ/practice questions, flashcards, answer writing, planner integration, analytics, and mobile-first UX.

Live product: https://clearupsc.vercel.app

Local project path used by Codex:
`C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc`

## Important Rule

Do not rebuild from scratch. Continue from the existing Next.js 14 + TypeScript + Tailwind + Supabase project.

Do not expose, print, or commit secrets. The upload ZIP excludes `.env.local`, `.vercel`, `.next`, and `node_modules`.

## What Is Already Built

The current app is not empty. It already has:

- Next.js 14 App Router
- TypeScript
- Tailwind
- Supabase auth/database foundation
- Vercel deployment
- Public routes:
  - `/`
  - `/optional-selector`
  - `/practice`
  - `/pricing`
  - `/study`
  - `/study/ncert`
  - SEO pages such as `/upsc-syllabus`, `/upsc-cutoff`, `/upsc-current-affairs`, `/upsc-answer-writing`
- Protected/product routes:
  - `/dashboard`
  - `/planner`
  - `/syllabus`
  - `/tracker`
  - `/answer-writing/practice`
  - `/flashcards`
  - `/prelims/mock-tests`
  - `/current-affairs`
  - `/interview`
  - `/profile`
  - `/billing`
  - `/admin`
- Study topic route:
  - `/study/[topicId]`
  - It was redesigned into a six-step study page:
    - Get It
    - Learn It
    - Memorise It
    - Revise It
    - Read It
    - Prove It
- Database/content work already exists:
  - 430 UPSC topics
  - 3000-ish generated MCQ target was started/planned
  - Wiki slug mapping scripts
  - NCERT library scripts
  - Government source scripts
  - Topic notes scripts
  - Content reports under `data/content-reports`

Read these files first:

1. `ANTIGRAVITY_START_HERE.md`
2. `CLEARUPSC_PROJECT_STATUS.md`
3. `CLEARUPSC_MASTER_FRAMEWORK.md`
4. `CLEARUPSC_REAL_CONTENT_REBUILD_PLAN.md`
5. `CLEARUPSC_NOTES_STYLE_GUIDE.md`
6. `supabase/schema.sql`
7. `src/app/study/[topicId]/page.tsx`
8. `src/app/api/study/topic/[topicId]/route.ts`

## Current Pain Point

The product foundation exists, but the user is unhappy because the course content is not yet genuinely UPSC-grade.

The next agent must focus on:

- Not just one polished topic like Judiciary.
- The whole course.
- Every important UPSC topic.
- Better explanations for beginners.
- Better MCQs/PYQs.
- Better NCERT coverage.
- Better real study workflow.

## Content Philosophy

The goal is coverage-complete, not copy-complete.

Use NCERT, Wikipedia, PIB, PRS, Economic Survey, Budget, Supreme Court, UPSC official papers, and other legal/free/public references as source material. Explain in original words. Do not copy long copyrighted passages.

For every topic, the app should help a beginner who is around 13 years old understand it:

1. Translate complex ideas into easy language.
2. Expand every important concept.
3. Add analogy where useful.
4. Preserve UPSC-relevant facts, institutions, dates, articles, schemes, judgments, reports, and traps.
5. Then provide concise notes and last-night revision notes.

## Target Study Topic Page Standard

Every `/study/[topicId]` page should have this quality:

### 01 Get It

Beginner-friendly explanation with analogy.

Example style:

> Think of Fundamental Rights like a shield the Constitution gives every citizen. The government is powerful, but this shield tells the government where it cannot cross the line.

### 02 Learn It

Full notes with:

- H2/H3 sections
- key terms
- article/year/fact chips
- cases/judgments callout
- schemes/reports callout
- prelims traps
- mains answer angles
- mindmap

### 03 Memorise It

Two-column table:

| Term | Definition |
| --- | --- |

Short official-style definitions, legal-safe, not long copied textbook text.

### 04 Revise It

Max 10 last-night bullets:

- the facts that are most exam-worthy
- red "Revise Before Exam" badge

### 05 Read It

NCERT chapter links and in-app viewer/fallback.

### 06 Prove It

5 topic-relevant questions:

- official PYQs first if answer is verified
- otherwise clearly labeled UPSC-pattern questions
- clickable A/B/C/D
- instant feedback
- explanation
- confidence score

## Immediate Work Order For Antigravity

Do this in order.

### Phase A: Stabilize The Course Page For All Topics

- Verify `/study/gs2_polity_judiciary`.
- Verify at least 10 very different topic pages:
  - GS1 history
  - GS1 geography
  - GS2 polity
  - GS2 governance
  - GS2 international relations
  - GS3 economy
  - GS3 environment
  - GS3 science and technology
  - GS4 ethics
  - CSAT
- Fix any blank sections, broken encoding, missing NCERT refs, missing source links, or repeated MCQs.

### Phase B: Make Notes Work Across All 430 Topics

Use `topics.structured_notes` as JSON text with this shape:

```json
{
  "analogy": "string",
  "full_notes": "markdown string",
  "concise_notes": [
    { "term": "string", "definition": "string" }
  ],
  "revision_bullets": ["string"],
  "mindmap": ["string"],
  "cases": [
    { "name": "string", "point": "string" }
  ],
  "schemes": [
    { "name": "string", "point": "string" }
  ],
  "ncert_coverage": ["string"],
  "prelims_traps": ["string"],
  "mains_angles": ["string"]
}
```

If Claude/Gemini/OpenAI keys are not available, use local template generation, Wikipedia summaries, NCERT headings, and curated public-source notes. If an AI key is available, generate stronger topic notes in batches, cache/store permanently, and never rely on live generation at page load.

### Phase C: Expand NCERT Layer

`src/lib/study/ncert.ts` and the seed scripts need to become a serious UPSC NCERT library:

- Class 6-12 History
- Class 6-12 Geography
- Class 6-12 Political Science
- Class 9-12 Economics
- Class 11-12 Sociology
- Class 9-12 Science basics
- Art & Culture where relevant

Each NCERT chapter should have:

- class
- subject
- book
- chapter
- official NCERT URL
- mapped topic keys
- GS paper

Do not rehost NCERT PDFs. Link official NCERT URLs and provide original explanations/notes.

### Phase D: Fix Questions

The current generated-looking questions are not enough.

Build a question pipeline:

- official PYQs where source/year/answer key is verified
- reconstructed questions clearly labeled "Based on UPSC pattern"
- practice MCQs with:
  - topic key
  - source label
  - difficulty
  - explanation
  - trap type
  - related study link

No repeated question stems.

For launch quality, aim:

- 3000 high-quality MCQs minimum
- 10 full-length 100-question Prelims mocks
- 20 sectional tests
- 5 CSAT mocks

### Phase E: Integrate Study Loop

The daily loop should be obvious:

1. Read easy explanation.
2. Read full notes.
3. Read NCERT/reference.
4. Attempt 10 MCQs.
5. Add flashcards for mistakes.
6. Write one answer.
7. Mark progress.
8. Review due flashcards.

Add links from:

- dashboard weak topics to `/study/[topicId]`
- syllabus rows to `/study/[topicId]`
- MCQ explanations to related study topics
- current affairs tags to related study topics

### Phase F: Then Build Full Product Features

After the study/course layer is real, continue the master framework:

- Essay module
- CSAT module
- Analytics and weak-area detection
- Revision calendar
- Notes system
- Current affairs ingestion
- Interview prep
- SEO tools
- Legal pages
- Payment activation only after Razorpay keys
- AI activation only after API keys + rate limits + caching

## Commands To Run

Install:

```powershell
npm install
```

Dev:

```powershell
npm run dev
```

Build:

```powershell
npm run lint
npm run build
```

Content scripts:

```powershell
node scripts/map-topic-wiki-slugs.mjs
node scripts/seed-ncert-library.mjs
node scripts/seed-govt-sources.mjs
node scripts/generate-topic-notes.mjs
```

If forcing notes regeneration, protect already high-quality/publish-ready topics unless intentionally regenerating everything.

## Environment

Use `.env.example` as the reference.

Expected categories:

- Supabase public URL and anon key
- Supabase service role key for admin/server scripts only
- Anthropic/OpenAI/Gemini key only if AI content generation is enabled
- Razorpay keys only when payments are ready
- Resend key only when email is ready
- Upstash Redis only when rate limits/cache are needed

Do not put secrets in source control or generated reports.

## Must-Pass Tests

Before handing back:

```powershell
npm run lint
npm run build
```

Manual test:

- `/study` lists topics
- `/study/ncert` filters and links work
- `/study/gs2_polity_judiciary` full page works
- one governance topic works
- one economy topic works
- one geography topic works
- one ethics topic works
- topic note/flashcard/progress actions persist
- mobile width 375px has no horizontal scroll

## Final Output Expected From Antigravity

When done, report:

- files changed
- how many topics now have structured notes
- how many topics have NCERT refs
- how many topics have govt sources
- question counts by subject
- PYQ count and source labels
- mocks created
- tests passed
- what still needs human review

