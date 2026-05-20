import { z } from "zod";

// Snake_case wire shape of the `data` field on the assessment webhook.

export const LocalizedTextSchema = z.object({
  en: z.string().optional(),
  ja: z.string().optional(),
});

export const CefrMetricSchema = z.object({
  label: z.string(),
  score: z.number(),
  description: LocalizedTextSchema,
});

export const CefrResultsSchema = z.object({
  range: CefrMetricSchema.optional(),
  fluency: CefrMetricSchema.optional(),
  overall: CefrMetricSchema.optional(),
  accuracy: CefrMetricSchema.optional(),
  coherence: CefrMetricSchema.optional(),
  phonology: CefrMetricSchema.optional(),
  interaction: CefrMetricSchema.optional(),
});

export const CanDoItemSchema = z.object({
  can_do: LocalizedTextSchema,
  is_achieved: z.boolean(),
  sort_order: z.number(),
});

export const CanDoResultSchema = z.object({
  success: z.boolean(),
  can_dos: z.array(CanDoItemSchema),
  overall_feedback: LocalizedTextSchema.nullable(),
});

export const ReviewQuestionSchema = z.object({
  target_system_utterance_english_text: z.string(),
  target_system_utterance_japanese_text: z.string(),
  target_user_utterance_english_text: z.string(),
  feedback_english_text: z.string(),
  feedback_japanese_text: z.string(),
  advice_english_text: z.string(),
  advice_japanese_text: z.string(),
  word_order_quiz: z.string(),
  user_scramble_input: z.string(),
});

export const AssessmentResultSchema = z.object({
  cefr_results: CefrResultsSchema.nullable(),
  feedback: z
    .object({
      strength: LocalizedTextSchema,
      weakness: LocalizedTextSchema,
    })
    .nullable(),
  level_description: LocalizedTextSchema.nullable(),
  can_do: CanDoResultSchema.nullable(),
  review_questions: z.array(ReviewQuestionSchema).nullable(),
});

export type LocalizedText = z.infer<typeof LocalizedTextSchema>;
export type CefrMetric = z.infer<typeof CefrMetricSchema>;
export type CefrResults = z.infer<typeof CefrResultsSchema>;
export type CanDoItem = z.infer<typeof CanDoItemSchema>;
export type CanDoResult = z.infer<typeof CanDoResultSchema>;
export type ReviewQuestion = z.infer<typeof ReviewQuestionSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
