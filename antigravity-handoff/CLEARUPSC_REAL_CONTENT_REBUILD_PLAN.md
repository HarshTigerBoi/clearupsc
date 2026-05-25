# ClearUPSC Real Content Rebuild Plan

## Why This Exists

ClearUPSC cannot become a serious UPSC platform if the content layer is made of shallow generated notes, repeated synthetic MCQs, and vague syllabus labels. UPSC preparation needs:

- Official syllabus coverage, not a small topic sample.
- Official PYQs, clearly separated from reconstructed practice questions.
- Source-grounded notes built from NCERTs, government sources, standard public references, and current affairs.
- Topic tagging that connects reading, MCQs, PYQs, answer writing, flashcards, and revision.
- Honest labels: official, source-derived, reconstructed, generated, reviewed, unreviewed.

This document is the execution plan for making ClearUPSC a real exam-prep product instead of a demo shell.

## Current State After This Pass

Implemented now:

- Added `scripts/import-upsc-official-pyqs.mjs`.
- Added `npm run pyq:import-official`.
- Downloaded official UPSC Civil Services Prelims PDFs from UPSC's own previous-question-paper archive.
- Imported 71 clean official 2023 GS Paper I questions into `pyq_questions`.
- Labeled imported rows as `UPSC Official Question Paper`.
- Set `correct_option` to `null` because no official answer key has been attached yet.
- Updated the study topic UI so official PYQs without answer keys appear as review-mode, not fake auto-scored questions.
- Created `data/upsc-official-pyq-import-report.json`.

Important discovery:

- Many official UPSC PDFs from 2020-2025 are scanned/image-only. Plain PDF text extraction returns only page markers.
- These must go through OCR before they can become searchable in-app questions.
- The importer now marks those papers as `needs_ocr` instead of silently creating bad synthetic data.

## Content Integrity Rules

1. Do not fake official answers.
2. Do not label reconstructed questions as official.
3. Do not copy full copyrighted notes from coaching websites.
4. NCERT/government/public-domain material should be used to create original explanations, not pasted wholesale.
5. Wikipedia can be displayed only with attribution and should not be treated as final exam authority.
6. Every question should eventually have:
   - source label
   - year
   - paper
   - topic tags
   - difficulty
   - correct answer source
   - explanation source
   - reviewer status

## Phase 1: Official PYQ Pipeline

Goal: turn UPSC's own papers into a clean searchable PYQ database.

Already done:

- Official PDF downloader.
- Text parser for text-readable papers.
- Topic inference.
- Supabase upsert into `pyq_questions`.
- Import report.

Next work:

- Add OCR for scanned PDFs:
  - Convert PDF pages to images.
  - OCR each page.
  - Detect English question blocks.
  - Remove Hindi duplicate blocks from bilingual papers.
  - Save a confidence score per parsed question.
- Add manual review status fields:
  - `parse_status`
  - `answer_status`
  - `explanation_status`
  - `reviewed_by`
- Import at least 10 years of Prelims GS I and CSAT.
- Import Mains GS and Essay question papers as answer-writing prompts.

## Phase 2: Official Answer Key Pipeline

Goal: make PYQs usable for scored practice only when answers are verified.

Implementation:

- Locate official answer keys where available.
- Build `scripts/import-upsc-answer-keys.mjs`.
- Map answer keys to `pyq_questions`.
- Only questions with verified `correct_option` become auto-scored.
- Questions without verified answers remain review-mode.

UI behavior:

- `verified`: show correct answer and explanation.
- `unverified`: show question only, with note: "Answer key pending verification."
- `disputed`: show multiple views and explanation note.

## Phase 3: Syllabus Expansion

Goal: replace broad placeholder syllabus with a serious topic graph.

Current database has 430 topics. That is useful as a product skeleton, but not enough for serious UPSC preparation.

Target:

- 1,500-2,500 nodes:
  - GS1 History: ancient, medieval, modern, post-independence, world history, art and culture.
  - GS1 Geography: physical, world, Indian, economic, environment linkages.
  - GS1 Society: social issues, demography, women, vulnerable groups, urbanisation.
  - GS2 Polity: constitution, institutions, governance, welfare, IR.
  - GS3 Economy: macro, banking, fiscal, agriculture, infrastructure, industry, employment.
  - GS3 Environment: ecology, biodiversity, climate, disaster management.
  - GS3 Science and Tech: space, biotech, IT, defence, health tech.
  - GS4 Ethics: theory, thinkers, values, case-study patterns.
  - CSAT: comprehension, reasoning, numeracy, data interpretation.
  - Essay themes.

Every topic should include:

- parent topic
- paper
- stage
- priority
- PYQ frequency
- NCERT mapping
- government source mapping
- current-affairs tags
- answer-writing angles

## Phase 4: Notes That Are Actually Useful

Goal: build source-grounded notes, not generic summaries.

Each topic note should include:

- Plain-English conceptual explanation.
- UPSC syllabus wording.
- Why UPSC asks this.
- Static foundation from NCERT / standard public sources.
- Government source angle where relevant.
- PYQ pattern.
- Prelims traps.
- Mains dimensions:
  - constitutional/legal
  - historical
  - social
  - economic
  - ethical
  - federal
  - international
  - environmental
- Diagrams/frameworks where useful.
- 150-word and 250-word answer skeletons.
- Flashcard candidates.
- Revision checklist.

Implementation:

- Continue source-grounded NCERT extraction.
- Add source references per note.
- Add `note_quality` and `review_status`.
- Generate draft notes locally, then improve topic-by-topic.

## Phase 5: Question Bank Quality

Goal: stop repeated weak questions.

Question categories:

- `UPSC Official`: exact official question from UPSC PDF.
- `Official Answer Verified`: official question with verified answer key.
- `Based on UPSC Pattern`: reconstructed practice question, not official.
- `Concept Drill`: tests one concept.
- `Trap Drill`: tests common wrong assumptions.
- `Mains Prompt`: answer-writing question.

Question quality requirements:

- No repeated stem with swapped options.
- Options must be plausible.
- Explanation must explain why wrong options are wrong.
- Tag each question to topic and subtopic.
- Track user mistakes to update weak areas.

## Phase 6: Study Loop Integration

Every topic page should become:

1. Read notes.
2. Read linked NCERT/source.
3. Attempt topic MCQs.
4. Review official PYQs.
5. Add flashcards for missed facts.
6. Write one answer if Mains-relevant.
7. Mark progress.
8. Schedule revision.

Dashboard should show:

- Today's topic.
- Weak topic from MCQs.
- Due flashcards.
- One answer-writing task.
- PYQ trend for current topic.

## Immediate Next Steps

1. Add OCR support for official UPSC scanned PDFs.
2. Import 2020-2025 Prelims GS I and CSAT fully.
3. Add answer-key importer and verified answer status.
4. Expand syllabus from 430 broad nodes to at least 1,500 serious nodes.
5. Replace generic generated MCQs with topic-tagged question sets.
6. Add reviewer/status fields so unverified content is never presented as final truth.

## Sources Used For This Pass

- UPSC official previous question papers archive: https://upsc.gov.in/examinations/previous-question-papers
- UPSC official filtered Civil Services Preliminary papers page: https://upsc.gov.in/examinations/previous-question-papers?field_exam_name_value=civil+services+%28Preliminary%29

