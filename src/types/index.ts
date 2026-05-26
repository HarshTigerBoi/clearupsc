export type AnswerKey =
  | "background"
  | "mapComfort"
  | "dailyHours"
  | "language"
  | "technicalComfort"
  | "primaryGoal";

export type UserAnswers = Partial<Record<AnswerKey, string>>;

export interface OptionalResult {
  subject: string;
  score: number;
  gsOverlap: "High" | "Medium" | "Low";
  avgScoreRange: string;
  reasoning: string;
}

export type TopicStatus = "not_started" | "in_progress" | "completed" | "needs_revision" | "done";
export type PlanName = "free" | "starter" | "pro" | "premium";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export interface Topic {
  key: string;
  title: string;
  subject: "GS1" | "GS2" | "GS3" | "GS4" | "CSAT" | "Essay";
  parent?: string;
  upscWeightage?: number;
  examStage?: "prelims" | "mains" | "both";
}

export interface TopicProgressRecord {
  topic_key: string;
  status: TopicStatus;
  confidence_score?: number;
  last_studied_at?: string | null;
}

export interface PYQOption {
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface PYQQuestion {
  id: string;
  subject:
    | "GS1"
    | "GS2"
    | "GS3"
    | "GS4"
    | "CSAT"
    | "Essay"
    | "History"
    | "Polity"
    | "Governance"
    | "Geography"
    | "Economy"
    | "Environment"
    | "Science"
    | "Ethics"
    | "Security"
    | "Society";
  year: number;
  question: string;
  options: PYQOption[];
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  sourceLabel?: string;
  sourceType?: "official_pyq" | "official_review_only" | "pattern_practice" | "clearupsc_original";
  topicKey?: string | null;
  trapType?: string | null;
}

export interface UserProfile {
  attemptNumber: number;
  educationalBackground: string;
  optionalSubject: string | null;
  dailyHoursAvailable: number;
  targetExamYear: number;
  prelimsClearedBefore: boolean;
  weakSubjects: string[];
  strongSubjects: string[];
}

export interface StudyPlanTask {
  id: string;
  topicKey: string;
  topicTitle: string;
  taskType: "read" | "revise" | "practice" | "answer_writing" | "current_affairs";
  durationMinutes: number;
  completed: boolean;
  date: string;
}

export interface Flashcard {
  id: string;
  topicKey: string;
  topicTitle: string;
  question: string;
  answer: string;
  nextReviewAt: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface AnswerEvaluation {
  content_score: number;
  structure_score: number;
  clarity_score: number;
  depth_score: number;
  presentation_score: number;
  total_score: number;
  strengths: string[];
  improvements: string[];
  model_answer_hint: string;
  overall_feedback: string;
}

export interface AnswerSubmission {
  id: string;
  questionText: string;
  answerText: string;
  wordCount: number;
  timeTakenSeconds: number;
  submittedAt: string;
  evaluation?: AnswerEvaluation;
}

export interface CurrentAffair {
  date: string;
  title: string;
  tags: string[];
  summary: string;
  upscAngle: string;
}

export interface MockTest {
  id: string;
  title: string;
  testType: "prelims_full" | "prelims_sectional" | "mains_gs" | "mains_optional";
  durationMinutes: number;
  totalMarks: number;
  questionIds: string[];
}

export interface MockResult {
  score: number;
  correct: number;
  wrong: number;
  unattempted: number;
  totalQuestions: number;
  subjectBreakdown: Array<{ subject: string; correct: number; total: number }>;
  weakAreas: string[];
}

export interface DafEntry {
  name?: string;
  dateOfBirth?: string;
  hometown?: string;
  graduationSubject: string;
  collegeName: string;
  stateOfDomicile: string;
  hobbies: string[];
  workExperience: string;
  optionalSubject: string;
  servicePreference: string[];
  achievements: string;
  educationDetails?: string;
  familyBackground?: string;
  nativeLanguage?: string;
  visitedPlaces?: string;
  extracurriculars?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  whyAsked: string;
}

export interface UserStats {
  plan: PlanName;
  nextAction: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    href: string;
    topicTitle?: string;
    stepLabel?: string;
    cardCount?: number;
  };
  syllabusCompletion: number;
  currentStreak: number;
  cardsDue: number;
  mockScoreTrend: string;
  weakAreas: string[];
  todayTasks: StudyPlanTask[];
  recentScores: number[];
}
