import type {
  CreateSessionRequestSchema,
  CreateSessionResponse,
  EquApiResponse,
} from "@/app/_dtos";
import { AppError } from "./app-error";

// Default timeout for outbound HTTP requests to the EQU AI Platform.
const PLATFORM_FETCH_TIMEOUT_MS = 10_000;

export class SessionsRepository {
  private readonly equAiPlatformUrl = process.env.EQU_AI_PLATFORM_URL ?? "";
  private readonly equAiPlatformApiKey =
    process.env.EQU_AI_PLATFORM_API_KEY ?? "";

  private get headers() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.equAiPlatformApiKey}`,
    };
  }

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
      return res.result;
    }
    throw new AppError(
      res.errorMessage || "Failed to create session",
      "FAILED_TO_CREATE_SESSION",
      response.status,
    );
  }
}
