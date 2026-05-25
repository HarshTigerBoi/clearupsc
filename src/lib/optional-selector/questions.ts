import type { AnswerKey } from "@/types";

export interface SelectorOption {
  value: string;
  label: string;
  description: string;
}

export interface SelectorQuestion {
  key: AnswerKey;
  question: string;
  options: SelectorOption[];
}

export const OPTIONAL_QUESTIONS: SelectorQuestion[] = [
  {
    key: "background",
    question: "What was your strongest academic background?",
    options: [
      { value: "humanities", label: "Humanities / Arts", description: "You enjoy society, polity, history, culture or theory-heavy subjects." },
      { value: "science", label: "Science / Engineering", description: "You are comfortable with concepts, diagrams, logic and structured systems." },
      { value: "commerce", label: "Commerce / Management", description: "You like economy, administration, organisations and practical examples." },
      { value: "mixed", label: "Mixed / Not sure", description: "You want a safe subject that does not punish a non-specialist." },
    ],
  },
  {
    key: "mapComfort",
    question: "How comfortable are you with maps, regions and physical geography?",
    options: [
      { value: "high", label: "Very comfortable", description: "Maps and locations feel natural to you." },
      { value: "medium", label: "Manageable", description: "You can learn with regular practice." },
      { value: "low", label: "Not comfortable", description: "You prefer concepts and arguments over map-based recall." },
    ],
  },
  {
    key: "dailyHours",
    question: "How much time can you give to optional subject daily?",
    options: [
      { value: "low", label: "Under 1.5 hours", description: "You need high GS overlap and low overhead." },
      { value: "medium", label: "1.5 to 3 hours", description: "You can manage a balanced optional." },
      { value: "high", label: "3+ hours", description: "You can handle deeper theory or technical material." },
    ],
  },
  {
    key: "language",
    question: "Which answer-writing style feels easiest?",
    options: [
      { value: "simple", label: "Simple and direct", description: "Clear points, examples and short paragraphs." },
      { value: "analytical", label: "Analytical", description: "Arguments, thinkers, causes and consequences." },
      { value: "technical", label: "Technical", description: "Definitions, diagrams, models and precision." },
    ],
  },
  {
    key: "technicalComfort",
    question: "How much technical or specialised content can you tolerate?",
    options: [
      { value: "low", label: "Low", description: "I want mostly readable, GS-linked content." },
      { value: "medium", label: "Medium", description: "Some technical parts are fine if the scoring is stable." },
      { value: "high", label: "High", description: "I can go deep if the syllabus is predictable." },
    ],
  },
  {
    key: "primaryGoal",
    question: "What matters most in your optional?",
    options: [
      { value: "gs_overlap", label: "Maximum GS overlap", description: "I want optional to support Prelims and GS Mains too." },
      { value: "scoring", label: "Scoring potential", description: "I want a subject with a reputation for high marks." },
      { value: "interest", label: "Long-term interest", description: "I want something I can read for months without hating it." },
    ],
  },
];
