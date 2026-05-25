import { randomBytes } from "node:crypto";

// Per-process shared secret used to authenticate inbound webhook deliveries.
// Generated once at module load; if WEBHOOK_SECRET env var is set, use that
// instead so the value survives Next dev-mode module reloads.
export const WEBHOOK_SECRET: string =
  process.env.WEBHOOK_SECRET ?? randomBytes(32).toString("hex");

// Short, safe identifier for logging — never log the full secret.
export const webhookSecretFingerprint = (): string =>
  `${WEBHOOK_SECRET.slice(0, 8)}…`;
