// Registers this app's /api/webhook URL with the EQU AI Platform so it can
// deliver session lifecycle and assessment events. The api_key sent here
// becomes the Bearer token EQU includes on every callback for the receiver
// to verify.
import type { EquApiResponse } from "@/app/_dtos";
import {
  PLATFORM_API_KEY,
  PLATFORM_API_KEY_VAR,
  PLATFORM_URL,
} from "./platform";
import { WEBHOOK_SECRET, webhookSecretFingerprint } from "./webhook-secret";

const PLATFORM_FETCH_TIMEOUT_MS = 10_000;
const TARGET_TYPES = [
  "assessment_completed",
  "session_ended",
  "session_error",
] as const;

type WebhookType = (typeof TARGET_TYPES)[number];

export async function registerWebhook(
  webhookBaseUrl: string | undefined = process.env.WEBHOOK_BASE_URL,
): Promise<void> {
  const apiKey = PLATFORM_API_KEY;

  if (!webhookBaseUrl) {
    console.log("[webhook] WEBHOOK_BASE_URL not set - skipping registration");
    return;
  }
  if (!apiKey) {
    console.warn(
      `[webhook] ${PLATFORM_API_KEY_VAR} not set - skipping registration`,
    );
    return;
  }

  const baseUrl = webhookBaseUrl.replace(/\/+$/, "");
  const callbackUrl = `${baseUrl}/api/webhook`;
  const body = Object.fromEntries(
    TARGET_TYPES.map((type) => [
      type,
      { url: callbackUrl, method: "POST", api_key: WEBHOOK_SECRET },
    ]),
  ) as Record<WebhookType, { url: string; method: "POST"; api_key: string }>;

  try {
    const response = await fetch(`${PLATFORM_URL}/v1/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(PLATFORM_FETCH_TIMEOUT_MS),
    });
    const json: EquApiResponse = await response.json();

    if (response.ok && json.status === "OK") {
      console.log(
        `[webhook] registered [${TARGET_TYPES.join(", ")}] -> ${callbackUrl} (secret ${webhookSecretFingerprint()})`,
      );
      return;
    }

    if (response.status === 401) {
      console.warn(
        `[webhook] registration failed: 401 - check ${PLATFORM_API_KEY_VAR}`,
      );
      return;
    }

    console.warn(
      `[webhook] registration failed: ${response.status} ${json.errorMessage ?? "unknown"}`,
    );
  } catch (err) {
    console.warn("[webhook] registration error:", err);
  }
}
