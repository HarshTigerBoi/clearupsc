import type { AnswerKey, OptionalResult } from "@/types";

type QuestionScores = Record<string, number>;
type SubjectScores = Record<AnswerKey, QuestionScores>;

export const OPTIONAL_META: Record<string, Omit<OptionalResult, "subject" | "score">> = {
  Sociology: {
    gsOverlap: "High",
    avgScoreRange: "240-300",
    reasoning: "Sociology suits aspirants who want readable theory, Indian society examples and strong GS overlap. It rewards clear thinkers who can connect concepts with current social issues.",
  },
  Anthropology: {
    gsOverlap: "Medium",
    avgScoreRange: "250-310",
    reasoning: "Anthropology is compact and scoring for students who can handle diagrams, definitions and scientific-social concepts. It is especially good if you like structured notes and predictable topics.",
  },
  "Political Science": {
    gsOverlap: "High",
    avgScoreRange: "240-300",
    reasoning: "Political Science overlaps strongly with polity, governance, IR and essay. It works well for aspirants who enjoy thinkers, institutions and analytical answer writing.",
  },
  Geography: {
    gsOverlap: "High",
    avgScoreRange: "230-290",
    reasoning: "Geography supports GS1 and environment but needs map practice, diagrams and conceptual clarity. It is best for students who enjoy spatial thinking and physical processes.",
  },
  History: {
    gsOverlap: "Medium",
    avgScoreRange: "220-280",
    reasoning: "History rewards memory, chronology and narrative understanding. It suits students who enjoy stories of societies, empires, ideas and freedom movements.",
  },
  PublicAdministration: {
    gsOverlap: "High",
    avgScoreRange: "230-290",
    reasoning: "Public Administration is practical and governance-oriented with strong GS2 and GS4 overlap. It suits aspirants who like administration, case studies and management-style clarity.",
  },
};

export const COMPATIBILITY_MATRIX: Record<string, SubjectScores> = {
  Sociology: {
    background: { humanities: 10, science: 6, commerce: 7, mixed: 9 },
    mapComfort: { high: 6, medium: 8, low: 10 },
    dailyHours: { low: 9, medium: 10, high: 8 },
    language: { simple: 10, analytical: 9, technical: 5 },
    technicalComfort: { low: 9, medium: 10, high: 7 },
    primaryGoal: { gs_overlap: 10, scoring: 8, interest: 9 },
  },
  Anthropology: {
    background: { humanities: 7, science: 10, commerce: 6, mixed: 8 },
    mapComfort: { high: 7, medium: 8, low: 7 },
    dailyHours: { low: 8, medium: 10, high: 10 },
    language: { simple: 8, analytical: 7, technical: 10 },
    technicalComfort: { low: 6, medium: 9, high: 10 },
    primaryGoal: { gs_overlap: 7, scoring: 10, interest: 8 },
  },
  "Political Science": {
    background: { humanities: 10, science: 7, commerce: 7, mixed: 8 },
    mapComfort: { high: 6, medium: 8, low: 9 },
    dailyHours: { low: 7, medium: 9, high: 10 },
    language: { simple: 7, analytical: 10, technical: 6 },
    technicalComfort: { low: 7, medium: 9, high: 8 },
    primaryGoal: { gs_overlap: 10, scoring: 8, interest: 10 },
  },
  Geography: {
    background: { humanities: 7, science: 9, commerce: 6, mixed: 7 },
    mapComfort: { high: 10, medium: 8, low: 4 },
    dailyHours: { low: 5, medium: 8, high: 10 },
    language: { simple: 7, analytical: 8, technical: 9 },
    technicalComfort: { low: 5, medium: 8, high: 10 },
    primaryGoal: { gs_overlap: 10, scoring: 7, interest: 8 },
  },
  History: {
    background: { humanities: 10, science: 6, commerce: 6, mixed: 8 },
    mapComfort: { high: 7, medium: 8, low: 8 },
    dailyHours: { low: 5, medium: 8, high: 10 },
    language: { simple: 8, analytical: 9, technical: 4 },
    technicalComfort: { low: 8, medium: 7, high: 5 },
    primaryGoal: { gs_overlap: 8, scoring: 6, interest: 10 },
  },
  PublicAdministration: {
    background: { humanities: 8, science: 7, commerce: 10, mixed: 8 },
    mapComfort: { high: 6, medium: 8, low: 9 },
    dailyHours: { low: 8, medium: 9, high: 8 },
    language: { simple: 9, analytical: 8, technical: 7 },
    technicalComfort: { low: 8, medium: 9, high: 7 },
    primaryGoal: { gs_overlap: 10, scoring: 7, interest: 8 },
  },
};
