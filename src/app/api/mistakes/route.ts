import { z } from "zod";
import { fail, ok } from "@/lib/api/response";
import { ProductDataError, requireProductUser } from "@/lib/product/db";

const attemptSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]),
  correctOption: z.enum(["A", "B", "C", "D"]).optional(),
  isCorrect: z.boolean(),
  timeTakenSeconds: z.number().int().min(0).optional(),
  topicKey: z.string().optional().nullable(),
  question: z.string().optional(),
  explanation: z.string().optional(),
});

export async function GET() {
  try {
    const { supabase, user } = await requireProductUser();
    const { data: attempts, error } = await supabase
      .from("mcq_attempts")
      .select("id,question_id,selected_option,time_taken_seconds,attempted_at")
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("attempted_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const questionIds = [...new Set((attempts ?? []).map((attempt) => String(attempt.question_id)))];
    const { data: questions } = questionIds.length
      ? await supabase
          .from("questions")
          .select("id,topic_key,question_text,explanation,source_label,question_options(option_label,option_text,is_correct)")
          .in("id", questionIds)
      : { data: [] };
    const questionMap = new Map((questions ?? []).map((question) => [String(question.id), question as Record<string, any>]));

    return ok({
      mistakes: (attempts ?? []).map((attempt) => {
        const question = questionMap.get(String(attempt.question_id));
        const options = [...(question?.question_options ?? [])].sort((a, b) => String(a.option_label).localeCompare(String(b.option_label)));
        const selected = options.find((option) => option.option_label === attempt.selected_option);
        const correct = options.find((option) => option.is_correct);
        return {
          id: String(attempt.id),
          questionId: String(attempt.question_id),
          topicKey: question?.topic_key ? String(question.topic_key) : null,
          question: String(question?.question_text ?? "Question text unavailable"),
          selectedOption: String(attempt.selected_option ?? ""),
          selectedText: selected?.option_text ? String(selected.option_text) : "",
          correctOption: correct?.option_label ? String(correct.option_label) : "",
          correctText: correct?.option_text ? String(correct.option_text) : "",
          explanation: String(question?.explanation ?? "Review the linked topic and make one flashcard for the missed concept."),
          source: String(question?.source_label ?? "ClearUPSC practice"),
          attemptedAt: String(attempt.attempted_at ?? ""),
        };
      }),
    });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok({ mistakes: [], guest: true });
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not load mistakes.", 500);
  }
}

export async function POST(request: Request) {
  const parsed = attemptSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid attempt.", 400, parsed.error.flatten());
  if (parsed.data.isCorrect) return ok({ recorded: false });

  try {
    const { supabase, user } = await requireProductUser();
    const { data, error } = await supabase
      .from("mcq_attempts")
      .insert({
        user_id: user.id,
        question_id: parsed.data.questionId,
        selected_option: parsed.data.selectedOption,
        is_correct: false,
        time_taken_seconds: parsed.data.timeTakenSeconds ?? 0,
      })
      .select("id")
      .single();
    if (error) throw error;

    if (parsed.data.topicKey && parsed.data.question && parsed.data.explanation) {
      await supabase.from("flashcard_queue").insert({
        user_id: user.id,
        topic_key: parsed.data.topicKey,
        question: `Why was this wrong? ${parsed.data.question}`.slice(0, 400),
        answer: parsed.data.explanation,
        next_review_at: new Date().toISOString(),
        interval_days: 1,
        ease_factor: 2.5,
        repetitions: 0,
      });
    }

    return ok({ recorded: true, id: data.id }, 201);
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok({ recorded: false, guest: true });
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not record mistake.", 500);
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Missing mistake id.", 400);
  try {
    const { supabase, user } = await requireProductUser();
    const { error } = await supabase.from("mcq_attempts").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return ok({ removed: true });
  } catch (error) {
    if (error instanceof ProductDataError && error.status === 401) return ok({ removed: false, guest: true });
    if (error instanceof ProductDataError) return fail(error.message, error.status);
    return fail("Could not clear mistake.", 500);
  }
}
