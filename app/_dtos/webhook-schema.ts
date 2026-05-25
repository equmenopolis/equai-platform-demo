import { z } from "zod";
import { AssessmentResultSchema } from "./assessment-schema";
import { SessionObjectSchema } from "./session-schema";

// Result payload — `data` fields may be null per scenario configuration.
export const AssessmentCompletedPayloadSchema = z.object({
  type: z.literal("assessment_completed"),
  session: SessionObjectSchema,
  completed_at: z.number(),
  data: AssessmentResultSchema,
});

// Lifecycle events carry only the session id.
export const SessionLifecyclePayloadSchema = z.object({
  type: z.enum(["session_started", "session_ended", "session_error"]),
  session_id: z.string(),
});

export const WebhookPayloadSchema = z.discriminatedUnion("type", [
  AssessmentCompletedPayloadSchema,
  SessionLifecyclePayloadSchema,
]);

export type AssessmentCompletedPayload = z.infer<
  typeof AssessmentCompletedPayloadSchema
>;
export type SessionLifecyclePayload = z.infer<
  typeof SessionLifecyclePayloadSchema
>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
