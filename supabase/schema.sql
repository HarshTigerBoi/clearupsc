create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  top_recommendation text,
  second_recommendation text,
  third_recommendation text,
  created_at timestamptz default now()
);

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  attempt_number int default 1,
  educational_background text,
  optional_subject text,
  daily_hours_available int default 6,
  target_exam_year int,
  prelims_cleared_before boolean default false,
  weak_subjects text[] default '{}',
  strong_subjects text[] default '{}',
  total_xp int default 0,
  streak_freezes_remaining int default 2,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  plan text check (plan in ('free','starter','pro','premium')) default 'free',
  status text check (status in ('active','cancelled','expired','trial')) default 'active',
  razorpay_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  subject text not null,
  parent_key text,
  title text not null,
  upsc_weightage int default 1,
  exam_stage text check (exam_stage in ('prelims','mains','both')) default 'both'
);

alter table public.topics add column if not exists wiki_slug text;
alter table public.topics add column if not exists structured_notes text;
alter table public.topics add column if not exists govt_sources jsonb default '[]'::jsonb;
alter table public.topics add column if not exists ncert_refs jsonb default '[]'::jsonb;
alter table public.topics add column if not exists content_quality text check (content_quality in ('fallback','wiki_seeded','ncert_enriched','human_review_needed','publish_ready','source_packet_ready_for_human_decode','textbook_decoded')) default 'fallback';

create table if not exists public.topic_wiki_cache (
  topic_key text primary key,
  wiki_slug text not null,
  summary text,
  description text,
  image_url text,
  source_url text,
  fetched_at timestamptz default now()
);

create table if not exists public.topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete cascade,
  topic_key text,
  status text check (status in ('not_started','in_progress','completed','needs_revision','done')) default 'not_started',
  confidence_score int default 0,
  last_studied_at timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, topic_id),
  unique(user_id, topic_key)
);

create table if not exists public.flashcard_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_key text not null,
  question text not null,
  answer text not null,
  next_review_at timestamptz default now(),
  interval_days int default 1,
  ease_factor float default 2.5,
  repetitions int default 0,
  last_quality int
);

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  generated_at timestamptz default now(),
  total_hours int,
  completed boolean default false,
  unique(user_id, date)
);

create table if not exists public.study_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.study_plans(id) on delete cascade not null,
  topic_key text,
  task_type text check (task_type in ('read','revise','practice','answer_writing','current_affairs')) not null,
  duration_minutes int not null,
  completed boolean default false,
  completed_at timestamptz
);

create table if not exists public.questions (
  id text primary key default gen_random_uuid()::text,
  topic_key text,
  question_text text not null,
  question_type text check (question_type in ('mcq','mains_10','mains_15','essay','current_affairs')) not null,
  year int,
  source text,
  difficulty int check (difficulty between 1 and 5) default 3,
  model_answer text,
  tags text[] default '{}'
);

create table if not exists public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id text references public.questions(id) on delete cascade not null,
  option_text text not null,
  is_correct boolean default false,
  option_label text,
  unique(question_id, option_label)
);

alter table public.questions add column if not exists explanation text;
alter table public.questions add column if not exists source_label text default 'Topic practice';
alter table public.questions add column if not exists trap_type text;
alter table public.questions add column if not exists related_topic_key text;

create table if not exists public.answer_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_text text not null,
  answer_text text not null,
  word_count int,
  time_taken_seconds int,
  submitted_at timestamptz default now()
);

create table if not exists public.answer_evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.answer_submissions(id) on delete cascade unique not null,
  content_score int,
  structure_score int,
  clarity_score int,
  depth_score int,
  presentation_score int,
  total_score int,
  ai_feedback text,
  strengths text[] default '{}',
  improvements text[] default '{}',
  model_answer_hint text,
  evaluated_at timestamptz default now()
);

create table if not exists public.mcq_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text not null,
  selected_option text,
  is_correct boolean,
  time_taken_seconds int,
  attempted_at timestamptz default now()
);

create table if not exists public.current_affairs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  summary text not null,
  source_url text,
  tags text[] default '{}',
  upsc_relevance text,
  created_at timestamptz default now(),
  unique(date, title)
);

alter table public.current_affairs add column if not exists category text;
alter table public.current_affairs add column if not exists source text;
alter table public.current_affairs add column if not exists upsc_angle text;
alter table public.current_affairs add column if not exists static_link text;
alter table public.current_affairs add column if not exists prelims_hook text;
alter table public.current_affairs add column if not exists mains_angle text;

create table if not exists public.pyq_questions (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  paper text check (paper in ('GS1','GS2','GS3','GS4','CSAT','Essay')) not null,
  question_text text not null,
  options jsonb,
  correct_option int,
  explanation text,
  topics text[] default '{}',
  difficulty text check (difficulty in ('easy','medium','hard')) default 'medium',
  source text default 'Based on UPSC pattern',
  created_at timestamptz default now()
);

alter table public.pyq_questions add column if not exists trap_type text;
alter table public.pyq_questions add column if not exists related_topic_key text;

create table if not exists public.essay_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic text not null,
  content text not null,
  word_count int default 0,
  time_spent_minutes int default 0,
  self_score int check (self_score between 1 and 10),
  rubric jsonb,
  created_at timestamptz default now()
);

create table if not exists public.revision_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_key text not null,
  due_date date not null,
  interval_days int default 1,
  last_quality int,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, topic_key)
);

create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  content text not null,
  topic_key text,
  tags text[] default '{}',
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mock_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  test_type text check (test_type in ('prelims_full','prelims_sectional','mains_gs','mains_optional')) not null,
  duration_minutes int,
  total_marks int,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  test_id text not null,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  total_score numeric,
  percentile numeric,
  time_taken_minutes int,
  status text check (status in ('in_progress','submitted','evaluated')) default 'in_progress'
);

create table if not exists public.daf_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  graduation_subject text,
  college_name text,
  state_of_domicile text,
  hobbies text[] default '{}',
  work_experience text,
  optional_subject text,
  service_preference text[] default '{}',
  achievements text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mock_interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  session_type text check (session_type in ('ai','peer')) default 'ai',
  questions_asked jsonb,
  overall_feedback text,
  confidence_score int,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.user_streaks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  total_study_days int default 0
);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  question_id text not null,
  created_at timestamptz default now()
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text,
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;
alter table public.user_profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.topics enable row level security;
alter table public.topic_wiki_cache enable row level security;
alter table public.topic_progress enable row level security;
alter table public.flashcard_queue enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_plan_tasks enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.answer_submissions enable row level security;
alter table public.answer_evaluations enable row level security;
alter table public.mcq_attempts enable row level security;
alter table public.current_affairs enable row level security;
alter table public.pyq_questions enable row level security;
alter table public.essay_submissions enable row level security;
alter table public.revision_schedule enable row level security;
alter table public.user_notes enable row level security;
alter table public.mock_tests enable row level security;
alter table public.mock_test_attempts enable row level security;
alter table public.daf_entries enable row level security;
alter table public.mock_interview_sessions enable row level security;
alter table public.user_streaks enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.user_badges enable row level security;
alter table public.notifications enable row level security;

create policy "Waitlist insert public" on public.waitlist for insert with check (true);
create policy "Topics readable" on public.topics for select using (true);
create policy "Topic wiki cache readable" on public.topic_wiki_cache for select using (true);
create policy "Questions readable" on public.questions for select using (true);
create policy "Question options readable" on public.question_options for select using (true);
create policy "Current affairs readable" on public.current_affairs for select using (true);
create policy "Mock tests readable" on public.mock_tests for select using (true);
create policy "PYQ readable" on public.pyq_questions for select using (true);

create policy "Profiles own" on public.user_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Subscriptions own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Progress own" on public.topic_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Flashcards own" on public.flashcard_queue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Study plans own" on public.study_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Answer submissions own" on public.answer_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "MCQ attempts own" on public.mcq_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "DAF own" on public.daf_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Interview own" on public.mock_interview_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Streaks own" on public.user_streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Daily challenges readable" on public.daily_challenges for select using (true);
create policy "Badges own" on public.user_badges for select using (auth.uid() = user_id);
create policy "Notifications own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Essay own" on public.essay_submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Revision own" on public.revision_schedule for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Notes own" on public.user_notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Plan tasks through own plan" on public.study_plan_tasks
  for all using (
    exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.study_plans p where p.id = plan_id and p.user_id = auth.uid())
  );

create policy "Evaluations through own submission" on public.answer_evaluations
  for select using (
    exists (select 1 from public.answer_submissions s where s.id = submission_id and s.user_id = auth.uid())
  );
