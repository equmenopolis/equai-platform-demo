import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { WebhookPayloadSchema } from "@/app/_dtos";
import { AppError, errorToResponse } from "../_lib/app-error";
import { validateBody } from "../_lib/validate-body";
import { okEmpty } from "../_lib/response";
import { notifySseClients, webhookStore } from "../_lib/sse-store";
import { WEBHOOK_SECRET } from "../_lib/webhook-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const provided = req.headers.get("authorization") ?? "";
    const expected = WEBHOOK_SECRET;
    // Length check first — timingSafeEqual requires equal-length buffers.
    const ok =
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!ok) {
      throw new AppError("Unauthorized", "UNAUTHORIZED", 401);
    }

    const payload = await validateBody(req, WebhookPayloadSchema);
    const sessionId =
      payload.type === "assessment_completed"
        ? payload.session.id
        : payload.session_id;

    if (payload.type === "session_started") {
      console.log(`[webhook] session_started for ${sessionId} — acknowledged`);
    } else if (
      payload.type !== "assessment_completed" &&
      webhookStore.get(sessionId)?.type === "assessment_completed"
    ) {
      // A late lifecycle retry must not overwrite a stored assessment_completed.
      console.log(
        `[webhook] ignoring late ${payload.type} for session ${sessionId} (assessment_completed already stored)`,
      );
    } else {
      webhookStore.set(sessionId, payload);
      console.log(`[webhook] stored ${payload.type} for session ${sessionId}`);
      notifySseClients(sessionId, payload);
    }

    return okEmpty();
  } catch (err) {
    return errorToResponse(err);
  }
}
