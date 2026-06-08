import { z } from "zod";

export const createSessionRequestSchema = z.object({
  scenarioId: z.string().min(1, "scenarioId is required"),
});

export type CreateSessionRequestSchema = z.infer<
  typeof createSessionRequestSchema
>;

export const CreateSessionResponseSchema = z.object({
  session: z.object({
    id: z.string(),
    scenario_id: z.string().nullable(),
    user_id: z.string().nullable(),
    language: z.string().nullable(),
    started_at: z.number().nullable(),
    ended_at: z.number().nullable(),
    created_at: z.number().nullable(),
  }),
  nonce: z.string(),
  conversation_url: z.string(),
  status: z.string(),
});

export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

// SessionObject carried inside the assessment webhook. Timestamps are epoch
// seconds; only `id` is guaranteed — every other field may be null.
export const SessionObjectSchema = z.object({
  id: z.string(),
  scenario_id: z.string().nullable(),
  user_id: z.string().nullable(),
  language: z.string().nullable(),
  started_at: z.number().nullable(),
  ended_at: z.number().nullable(),
  created_at: z.number().nullable(),
});

export type SessionObject = z.infer<typeof SessionObjectSchema>;
