import type {
  CreateSessionRequestSchema,
  CreateSessionResponse,
  EquApiResponse,
} from "@/app/_dtos";
import { AppError } from "./app-error";

// Default timeout for outbound HTTP requests to the EQU AI Platform.
const PLATFORM_FETCH_TIMEOUT_MS = 10_000;

// Production API base URL. Override via EQU_AI_PLATFORM_URL only for internal
// staging tests; partners cloning the demo never need to set it.
const DEFAULT_PLATFORM_URL = "https://api.equ.ai";

export class SessionsRepository {
  private readonly equAiPlatformUrl =
    process.env.EQU_AI_PLATFORM_URL ?? DEFAULT_PLATFORM_URL;
  private readonly equAiPlatformApiKey =
    process.env.EQU_AI_PLATFORM_API_KEY ?? "";

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.equAiPlatformApiKey}`,
    };
  }

  // EQU session bootstrap: scenario_id selects the platform flow; the returned
  // nonce is the one-time credential the browser embeds in the learner-webapp
  // iframe URL to authenticate the conversation.
  async create(
    data: CreateSessionRequestSchema,
  ): Promise<CreateSessionResponse> {
    if (!this.equAiPlatformUrl || !this.equAiPlatformApiKey) {
      throw new AppError(
        "EQU_AI_PLATFORM_URL or EQU_AI_PLATFORM_API_KEY not configured",
        "PLATFORM_NOT_CONFIGURED",
        500,
      );
    }

    const response = await fetch(`${this.equAiPlatformUrl}/v1/sessions`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        scenario_id: data.scenarioId,
        user_id: data.userId,
        // Send `false` for production sessions; required by the platform.
        dummy_intella: false,
      }),
      signal: AbortSignal.timeout(PLATFORM_FETCH_TIMEOUT_MS),
    });
    const res: EquApiResponse<CreateSessionResponse> = await response.json();
    if (res.status === "OK" && res.result) {
      return {
        ...res.result,
        conversation_url: applyLearnerWebappOverride(res.result.conversation_url),
      };
    }
    throw new AppError(
      res.errorMessage || "Failed to create session",
      "FAILED_TO_CREATE_SESSION",
      response.status,
    );
  }
}

// Optional override for internal testing: when LEARNER_WEBAPP_URL is set,
// replace the origin of the platform's conversation_url so the demo embeds a
// different learner-webapp build (e.g. a preview channel still pending merge
// into prod). Path and query (?nonce=…) are preserved.
function applyLearnerWebappOverride(conversationUrl: string): string {
  const override = process.env.LEARNER_WEBAPP_URL;
  if (!override) return conversationUrl;
  try {
    const target = new URL(conversationUrl);
    const replacement = new URL(override);
    target.protocol = replacement.protocol;
    target.host = replacement.host;
    return target.toString();
  } catch {
    return conversationUrl;
  }
}
