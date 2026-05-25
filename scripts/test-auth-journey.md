# ClearUPSC Auth Journey QA

Use one real test email and complete this checklist on production and local.

- [ ] Open `/` and trigger `?login=true`.
- [ ] Request magic link and confirm the email arrives.
- [ ] Click the magic link and land through `/auth/callback`.
- [ ] Complete `/onboarding`.
- [ ] Verify `/dashboard` loads live stats.
- [ ] Open `/planner` and toggle one task complete.
- [ ] Open `/syllabus` and change one topic status.
- [ ] Open `/flashcards`, flip a card, and review with quality `4`.
- [ ] Open `/answer-writing/practice`, write a short answer, submit, and see a rubric score.
- [ ] Open `/prelims/mock-tests`, start a test, answer questions, submit, and see negative marking.
- [ ] Open `/current-affairs` and complete the recall quiz.
- [ ] Open `/interview`, save DAF details, answer questions, and see the report.
- [ ] Open `/profile` and confirm onboarding data appears.
- [ ] Open `/billing` and confirm plan state appears without real checkout.
- [ ] Log out, then confirm protected routes redirect to `/?login=true`.
- [ ] Confirm `/admin` redirects non-admin users to `/dashboard`.
