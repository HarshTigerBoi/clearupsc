import type { AnswerEvaluation } from "@/types";

interface EvaluateInput {
  questionText: string;
  answerText: string;
  wordCount: number;
  timeTakenSeconds: number;
}

export async function evaluateAnswer(input: EvaluateInput): Promise<AnswerEvaluation> {
  if (process.env.ANTHROPIC_API_KEY) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: 700,
        temperature: 0.2,
        system:
          "You are a UPSC Mains answer evaluator. Evaluate strictly against the IAS rubric. Return only valid JSON with keys: content_score, structure_score, clarity_score, depth_score, presentation_score, total_score, strengths, improvements, model_answer_hint, overall_feedback.",
        messages: [
          {
            role: "user",
            content: `Question: ${input.questionText}\n\nAnswer: ${input.answerText}\n\nWord count: ${input.wordCount}\nTime taken: ${input.timeTakenSeconds} seconds`,
          },
        ],
      }),
    });
    if (!response.ok) throw new Error("Claude evaluation failed.");
    const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = payload.content?.find((item) => item.type === "text")?.text ?? "";
    const parsed = JSON.parse(text) as AnswerEvaluation;
    return {
      content_score: parsed.content_score,
      structure_score: parsed.structure_score,
      clarity_score: parsed.clarity_score,
      depth_score: parsed.depth_score,
      presentation_score: parsed.presentation_score,
      total_score: parsed.total_score,
      strengths: parsed.strengths ?? [],
      improvements: parsed.improvements ?? [],
      model_answer_hint: parsed.model_answer_hint,
      overall_feedback: parsed.overall_feedback,
    };
  }

  const hasIntro = /\b(introduction|firstly|to begin|context)\b/i.test(input.answerText);
  const hasConclusion = /\b(conclusion|therefore|way forward|thus)\b/i.test(input.answerText);
  const structureScore = hasIntro && hasConclusion ? 22 : hasIntro || hasConclusion ? 17 : 13;
  const lengthFit = input.wordCount >= 120 && input.wordCount <= 280;
  const contentScore = Math.min(38, Math.max(20, Math.round(input.wordCount / 7)));
  const clarityScore = lengthFit ? 17 : 14;
  const depthScore = /\b(example|data|committee|case|scheme|article)\b/i.test(input.answerText) ? 8 : 6;
  const presentationScore = input.answerText.includes("\n") ? 4 : 3;

  return {
    content_score: contentScore,
    structure_score: structureScore,
    clarity_score: clarityScore,
    depth_score: depthScore,
    presentation_score: presentationScore,
    total_score: contentScore + structureScore + clarityScore + depthScore + presentationScore,
    strengths: ["Relevant points are present", "The answer is readable and exam-oriented"],
    improvements: [
      "Add a sharper introduction that directly defines the issue",
      "Use one constitutional, committee, data or scheme reference",
      "End with a practical way-forward paragraph",
    ],
    model_answer_hint:
      "Use intro, 3-4 analytical dimensions, one example, and a balanced way forward linked to governance outcomes.",
    overall_feedback:
      "This is a safe draft. To move towards a rank-quality answer, increase specificity and make the structure visibly examiner-friendly.",
  };
}
