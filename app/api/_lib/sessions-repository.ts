import { createHash } from "node:crypto";
import type {
  CreateSessionRequestSchema,
  CreateSessionResponse,
  EquApiResponse,
} from "@/app/_dtos";
import { AppError } from "./app-error";
import {
  PLATFORM_API_KEY,
  PLATFORM_API_KEY_VAR,
  PLATFORM_URL,
} from "./platform";

// Default timeout for outbound HTTP requests to the EQU AI Platform.
const PLATFORM_FETCH_TIMEOUT_MS = 10_000;

export class SessionsRepository {
  private readonly apiKey = PLATFORM_API_KEY;

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  // Deterministic per-API-key user id derived from the SHA-256 digest of the
  // key, so the cleartext value never leaves the server.
  private get stableUserId(): string {
    return `demo_${createHash("sha256")
      .update(this.apiKey)
      .digest("hex")
      .slice(0, 24)}`;
  }

  // EQU session bootstrap: scenario_id selects the platform flow; the returned
  // nonce is the one-time credential the browser embeds in the learner-webapp
  // iframe URL to authenticate the conversation.
  async create(
    data: CreateSessionRequestSchema,
  ): Promise<CreateSessionResponse> {
    if (!this.apiKey) {
      throw new AppError(
        `${PLATFORM_API_KEY_VAR} not configured`,
        "PLATFORM_NOT_CONFIGURED",
        500,
      );
    }

    const response = await fetch(`${PLATFORM_URL}/v1/sessions`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        scenario_id: data.scenarioId,
        user_id: this.stableUserId,
        // Send `false` for production sessions; required by the platform.
        dummy_intella: false,
      }),
      signal: AbortSignal.timeout(PLATFORM_FETCH_TIMEOUT_MS),
    });
    const res: EquApiResponse<CreateSessionResponse> = await response.json();
    if (res.status === "OK" && res.result) {
      return res.result;
    }
    throw new AppError(
      res.errorMessage || "Failed to create session",
      "FAILED_TO_CREATE_SESSION",
      response.status,
    );
  }
}
