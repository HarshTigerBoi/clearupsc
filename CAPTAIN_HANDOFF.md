# Captain Handoff - ClearUPSC
## Status: All 8 Master Plan Prompts Complete

## Product State
- Live site: https://clearupsc.vercel.app
- GitHub: https://github.com/HarshTigerBoi/clearupsc
- Stack: Next.js 14, TypeScript, Tailwind, Supabase, Vercel
- Local project: C:\Users\harsh\Documents\Codex\2026-05-09\files-mentioned-by-the-user-ttp\clearupsc
- Product direction: guest-first full access, sign-in optional for cloud sync

## Core Course Layer
- 1196 UPSC topics with structured notes
- 5980 real factual MCQs with plausible distractors and explanations
- 565 official UPSC Mains PYQs imported from UPSC-Star
- 10 full Prelims mock tests with 100 questions each
- Study flow: Get It, Learn It, Memorise It, Revise It, Read It, Prove It
- Mark Complete & Continue moves users to the next topic

## Completed Master Plan Prompts
1. DONE - Personalized study sequence from onboarding
   - Onboarding answers now influence dashboard next action and study plan order.
   - Guest mode uses localStorage onboarding/progress for recommendations.

2. DONE - SM-2 spaced repetition engine
   - Topic progress stores review schedule fields.
   - Prove It scores influence review timing.
   - Dashboard revision card uses due topic reviews.

3. DONE - Deterministic answer writing evaluator
   - No AI key required.
   - Scores answer writing by content, structure, clarity, depth and presentation.
   - Saves submissions and shows feedback.

4. DONE - Complete NCERT URL mapping
   - NCERT URL map added.
   - Read It section shows official NCERT PDF links where mapped.
   - NCERT library refresh script updated.

5. DONE - Mobile UX audit and fixes
   - 375px audit completed.
   - Homepage, optional selector, onboarding, dashboard, study page, Prove It and mock tests fixed.
   - No horizontal overflow on audited main pages.

6. DONE - Mock test repair plan
   - Mock results show "Fix This Week".
   - Finds weakest subjects and recommends repair topics.
   - Add to My Plan saves tasks for the next 3 days.
   - Weak subjects update user_profiles automatically.

7. DONE - Current affairs complete system
   - 43 current affairs entries enhanced.
   - Fields added: upsc_angle, static_link, prelims_hook, mains_angle.
   - Cards show UPSC Angle, Prelims Hook, Mains Angle, Related Topic and Add to Flashcard.

8. DONE - End-to-end product flow
   - Homepage -> Optional Selector -> Sign In optional -> Onboarding -> Dashboard -> Study -> Next Topic works.
   - GitHub OAuth works.
   - Guest-first access remains preserved.

## Other Completed Work
- Minimal dark homepage with hamburger navigation
- GitHub OAuth sign-in only, avoiding email magic-link rate limits
- Adaptive dashboard with one primary next action card
- Progress tracking: time spent, correct count, mistakes count, last score
- Weak area detection from topic scores and mock performance
- Current affairs flashcard creation
- Mock test question mappings
- Vercel auto-deploy from GitHub main branch

## What Remains
1. Payments
   - Razorpay activation and production subscription flow.

2. Real Prelims PYQs
   - Need verified official Prelims MCQs with answer keys.
   - Public structured answer-key dataset was not found.

3. Content Quality Audit
   - Topic-by-topic review for depth, factual precision and source quality.
   - Priority: high-weight GS2 Polity, GS3 Economy, GS3 Environment, Modern History.

4. Interview Prep Module
   - Strengthen DAF-based question generation.
   - Add board-style mock interview sessions and evaluation history.

5. Essay Module
   - Dedicated essay prompts, outlines, scoring rubric and model frameworks.
   - Connect essay practice to dashboard streak and average score.

## How To Continue
For every new Claude/Codex session, start with:

```txt
Read CAPTAIN_HANDOFF.md in my project first.
Check git status before changing anything.
Continue from existing work, do not overwrite.
```

Next best session:

```txt
Audit the live app end to end as a serious UPSC aspirant. Identify the top 10 product gaps that still prevent ClearUPSC from feeling like a premium paid course, then fix the highest-impact one first.
```
