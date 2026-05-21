// POST /api/sessions — server-side proxy that injects the EQU API key and
// returns the platform's { session, nonce } payload. The browser never sees
// the API key; the nonce it does receive is what authorises the iframe URL.
import type { NextRequest } from "next/server";
import { createSessionRequestSchema } from "@/app/_dtos";
import { errorToResponse } from "../_lib/app-error";
import { validateBody } from "../_lib/validate-body";
import { ok } from "../_lib/response";
import { SessionsRepository } from "../_lib/sessions-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repository = new SessionsRepository();

export async function POST(req: NextRequest) {
  try {
    const body = await validateBody(req, createSessionRequestSchema);
    const result = await repository.create(body);
    return ok(result, 201);
  } catch (err) {
    return errorToResponse(err);
  }
}
