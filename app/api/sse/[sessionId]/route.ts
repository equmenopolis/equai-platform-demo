// GET /api/sse/:sessionId — Server-Sent Events stream that forwards EQU
// webhook payloads (received at /api/webhook) to the browser in real time.
import type { NextRequest } from "next/server";
import { addSseClient, removeSseClient } from "../../_lib/sse-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await ctx.params;
  if (!sessionId) {
    return new Response(
      JSON.stringify({
        status: "ERROR",
        errorMessage: "sessionId is required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      controller.enqueue(encoder.encode(": connected\n\n"));
      addSseClient(sessionId, controller);
    },
    cancel() {
      if (controllerRef) removeSseClient(sessionId, controllerRef);
    },
  });

  // Client disconnect via fetch abort.
  req.signal.addEventListener("abort", () => {
    if (controllerRef) {
      removeSseClient(sessionId, controllerRef);
      try {
        controllerRef.close();
      } catch {
        // Already closed.
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
