import type { NextRequest } from "next/server";
import { AppError, errorToResponse } from "../../_lib/app-error";
import { ok } from "../../_lib/response";
import { webhookStore } from "../../_lib/sse-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await ctx.params;
    if (!sessionId) {
      throw new AppError("sessionId is required", "SESSION_ID_REQUIRED", 400);
    }
    const result = webhookStore.get(sessionId);
    if (!result) {
      throw new AppError(
        "No webhook result found",
        "WEBHOOK_RESULT_NOT_FOUND",
        404,
      );
    }
    return ok(result);
  } catch (err) {
    return errorToResponse(err);
  }
}
