import type { AnswerEvaluation } from "@/types";

export interface Question {
  questionText?: string;
  text?: string;
  marks?: number;
  recommendedWords?: number;
}

interface DimensionScore {
  label: string;
  score: number;
  max: number;
}

const CRITICAL_ANALYSIS_TERMS = ["however", "although", "despite", "nevertheless"];
const LOGICAL_FLOW_TERMS = ["therefore", "thus", "hence", "consequently"];
const EXAMPLE_TERMS = ["example", "instance", "case", "such as"];

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

function containsAny(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function getQuestionText(question: Question | string) {
  if (typeof question === "string") return question;
  return question.questionText ?? question.text ?? "";
}

function getRecommendedWords(question: Question | string) {
  if (typeof question !== "string" && question.recommendedWords) return question.recommendedWords;
  if (typeof question !== "string" && question.marks) {
    if (question.marks >= 125) return 1000;
    if (question.marks <= 10) return 150;
    return 250;
  }
  return 250;
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|\r\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function scoreContent(text: string, wordCount: number) {
  const numberScore = Math.min(10, countMatches(text, /\b\d+(?:\.\d+)?%?\b/g) * 2);
  const properNounScore = Math.min(10, countMatches(text, /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g));
  const lengthScore = (wordCount > 100 ? 5 : 0) + (wordCount > 200 ? 10 : 0) + (wordCount > 300 ? 15 : 0);
  return Math.min(40, numberScore + properNounScore + lengthScore);
}

function scoreStructure(text: string, paragraphs: string[]) {
  const firstParagraph = paragraphs[0] ?? "";
  const lastParagraph = paragraphs[paragraphs.length - 1] ?? "";
  const hasBoldOrHeaders = /(^|\n)\s{0,3}#{1,6}\s+\S|\*\*[^*]+\*\*/.test(text);
  return (
    (countWords(firstParagraph) > 30 ? 8 : 0) +
    (countWords(lastParagraph) > 20 && paragraphs.length > 1 ? 7 : 0) +
    (paragraphs.length >= 3 ? 5 : 0) +
    (hasBoldOrHeaders ? 5 : 0)
  );
}

function scoreDepth(text: string) {
  return (
    (containsAny(text, CRITICAL_ANALYSIS_TERMS) ? 5 : 0) +
    (containsAny(text, LOGICAL_FLOW_TERMS) ? 5 : 0) +
    (containsAny(text, EXAMPLE_TERMS) ? 5 : 0) +
    (text.includes("?") ? 5 : 0)
  );
}

function scorePresentation(text: string, wordCount: number, recommendedWords: number) {
  const lowerBound = Math.floor(recommendedWords * 0.8);
  const upperBound = Math.ceil(recommendedWords * 1.1);
  const sentences = text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const hasNoLongSentence = sentences.length > 0 && sentences.every((sentence) => countWords(sentence) <= 50);
  return (wordCount >= lowerBound && wordCount <= upperBound ? 10 : 0) + (hasNoLongSentence ? 5 : 0);
}

function strengthsFor(dimensions: DimensionScore[]) {
  const strengths = dimensions
    .filter((dimension) => dimension.score >= dimension.max * 0.6)
    .map((dimension) => `${dimension.label} is working: ${dimension.score}/${dimension.max}.`);
  return strengths.length ? strengths : ["The answer has a usable starting point, but it needs sharper exam structure and evidence."];
}

function missingFor(dimensions: DimensionScore[]) {
  return dimensions
    .filter((dimension) => dimension.score < dimension.max * 0.4)
    .map((dimension) => `${dimension.label} is weak: ${dimension.score}/${dimension.max}.`);
}

function improvementsFor(dimensions: DimensionScore[], text: string, questionText: string) {
  const missing = missingFor(dimensions);
  const suggestions: string[] = [];
  if (missing.some((item) => item.startsWith("Content"))) suggestions.push("Add 2-3 concrete facts: article, committee, year, scheme, data point or judgment.");
  if (missing.some((item) => item.startsWith("Structure"))) suggestions.push("Use a visible intro-body-conclusion structure with short paragraphs or headings.");
  if (missing.some((item) => item.startsWith("Depth"))) suggestions.push("Add analysis using however/therefore framing and one example or case.");
  if (missing.some((item) => item.startsWith("Presentation"))) suggestions.push("Keep the answer near the expected word limit and break long sentences.");
  if (!suggestions.length && questionText) suggestions.push("Tie the final paragraph back to the exact demand of the question.");
  if (!/\b(article|committee|scheme|case|judgment|report|data|percent|%)\b/i.test(text)) suggestions.push("Anchor one point in an official source, report, scheme or constitutional provision.");
  return suggestions.slice(0, 3);
}

export function evaluateAnswer(text: string, question: Question | string): AnswerEvaluation {
  const answerText = text.trim();
  const questionText = getQuestionText(question);
  const recommendedWords = getRecommendedWords(question);
  const wordCount = countWords(answerText);
  const paragraphs = splitParagraphs(answerText);
  const contentScore = scoreContent(answerText, wordCount);
  const structureScore = scoreStructure(answerText, paragraphs);
  const depthScore = scoreDepth(answerText);
  const presentationScore = scorePresentation(answerText, wordCount, recommendedWords);
  const dimensions = [
    { label: "Content", score: contentScore, max: 40 },
    { label: "Structure", score: structureScore, max: 25 },
    { label: "Depth", score: depthScore, max: 20 },
    { label: "Presentation", score: presentationScore, max: 15 },
  ];
  const totalScore = contentScore + structureScore + depthScore + presentationScore;
  const missing = missingFor(dimensions);

  return {
    content_score: contentScore,
    structure_score: structureScore,
    clarity_score: 0,
    depth_score: depthScore,
    presentation_score: presentationScore,
    total_score: totalScore,
    strengths: strengthsFor(dimensions),
    improvements: improvementsFor(dimensions, answerText, questionText),
    model_answer_hint:
      "Use a direct definition or context line, 3-4 body points with facts/examples, one balanced counterpoint, and a concise way forward.",
    overall_feedback: missing.length
      ? `Deterministic rubric flagged gaps: ${missing.join(" ")}`
      : "This answer is balanced on the deterministic rubric. Improve further by adding more topic-specific evidence and sharper phrasing.",
  };
}
