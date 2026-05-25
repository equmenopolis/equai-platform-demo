# EQU AI Platform Demo

A minimal reference for integrating the EQU AI Platform: pick a scenario, run a conversation in an embedded iframe, and receive assessment results via webhook. Single Next.js 16 app — the API key stays server-side.

## Quick start

**macOS / Linux**
```bash
cp .env.example .env.local       # fill in the platform values (see Environment variables)
pnpm install
brew install cloudflared          # one-time, see Webhook tunnel for alternatives
pnpm dev:tunnel                   # http://localhost:3000
```

**Windows (PowerShell)**
```powershell
Copy-Item .env.example .env.local  # fill in the platform values (see Environment variables)
pnpm install
winget install Cloudflare.cloudflared  # one-time, see Webhook tunnel for alternatives
pnpm dev:tunnel                        # http://localhost:3000
```

`pnpm dev:tunnel` boots a Cloudflare quick tunnel, captures the public URL, and starts `next dev` with `WEBHOOK_BASE_URL` set to that URL so the platform webhook is registered automatically. Use plain `pnpm dev` if you only want to iterate on UI without webhook delivery.

## Environment variables

Defined in `.env.local` (gitignored). The demo targets `https://api.equ.ai` by default and embeds the iframe at the `conversation_url` returned by the platform — partners only need to provide their API key.

| Variable | Required | Example | Description |
|---|---|---|---|
| `EQU_AI_PLATFORM_API_KEY` | ✓ | `gm_…` | Bearer token from `platform.equ.ai` |
| `WEBHOOK_BASE_URL` | auto¹ | `https://<tunnel-host>` | Public URL of this app. Webhook registration appends `/api/webhook` |
| `WEBHOOK_SECRET` | — | _(leave blank)_ | Shared secret. Blank → a fresh one is generated per process at boot |

¹ `pnpm dev:tunnel` sets `WEBHOOK_BASE_URL` from cloudflared's published URL at startup, so it can be left blank in `.env.local` for that path. Set it explicitly only when you run plain `pnpm dev` against a tunnel you manage yourself, or when deploying.

`instrumentation.ts` re-registers the webhook against `WEBHOOK_BASE_URL` on every boot. Restart `pnpm dev` after editing `.env.local`.

## Webhook tunnel

The platform delivers `assessment_completed`, `session_ended`, and `session_error` events to `POST /api/webhook`. For local development that route needs to be reachable over HTTPS.

**Recommended: `pnpm dev:tunnel`** spawns Cloudflare's quick tunnel, captures the `https://*.trycloudflare.com` URL, and starts `next dev` with `WEBHOOK_BASE_URL` already set. One command, Ctrl+C tears down both. Requires `cloudflared` installed (`brew install cloudflared` on macOS/Linux; `winget install Cloudflare.cloudflared` on Windows). No Cloudflare account needed.

If you'd rather run the tunnel manually — for instance to use a stable hostname or ngrok — set `WEBHOOK_BASE_URL` yourself in `.env.local` and start the demo with `pnpm dev`:

```bash
# Option A — Cloudflare quick tunnel, run in a separate terminal:
cloudflared tunnel --url http://localhost:3000

# Option B — ngrok (free account + authtoken):
# macOS:
brew install --cask ngrok
# Windows (PowerShell):
winget install ngrok.ngrok

ngrok config add-authtoken <token-from-dashboard.ngrok.com>   # first time only
ngrok http 3000
```

Copy the printed `https://…` URL into `.env.local` as `WEBHOOK_BASE_URL`, then run `pnpm dev`. The boot log line `[webhook] registered [...] -> <url>/api/webhook (secret …)` confirms the platform accepted the registration. Quick tunnels rotate URLs on each launch — restart `pnpm dev` after a tunnel restart so the new URL is re-registered.

**Resilience:** if the browser's SSE connection to `/api/sse/[sessionId]` drops mid-wait (Turbopack hot reload, sleep, network blip), the demo automatically falls back to polling `/api/webhook/[sessionId]` every few seconds and resumes delivery once the payload lands. The stored result is never lost server-side; the UI just picks it up via poll instead of push.

## Scenarios

Defined in `app/_lib/scenarios.ts`. Edit that file to swap in IDs supplied by your EQU contact.

| Label | Scenario ID | Produces results |
|---|---|---|
| Free conversation | `develop/con-school-10min-gemini-1` | No |
| Speaking test | `develop/speaking-test-1` | CEFR |
| Can-Do lesson | `develop/S1_T1_about-me` | Can-Do + review questions |

`producesResults: false` makes the demo treat the iframe's `SESSION_ENDED` postMessage as terminal, so a free-conversation user sees the "no analysis" panel immediately rather than waiting for a webhook that will never carry an assessment.

## Flow

1. User picks a scenario and clicks **Start Conversation** → `POST /api/sessions` proxies to the platform and returns `{ session, nonce, conversation_url }`.
2. Demo embeds the `conversation_url` as an iframe.
3. iframe emits `SESSION_STARTED` / `SESSION_ENDED` / `SESSION_ERROR` via `postMessage`; the demo closes the iframe on `SESSION_ENDED`.
4. Platform calls `POST /api/webhook` with `assessment_completed` (scored scenarios) or `session_ended` (always).
5. Demo persists payloads in an in-memory store and fans them out to the browser via `GET /api/sse/[sessionId]`.
6. Result panel renders CEFR (radar + accordion), Can-Do (raw JSON), and review questions (raw JSON), each shown only when its field is non-null.

## API routes

| Route | Description |
|---|---|
| `POST /api/sessions` | Creates a platform session and returns `{ session, nonce }`. Injects the API key server-side. |
| `POST /api/webhook` | Platform → demo callback. Validates the `Authorization` header against the registered secret (constant-time compare). |
| `GET /api/webhook/[sessionId]` | Polls the stored payload for a given session (404 until received). |
| `GET /api/sse/[sessionId]` | Server-Sent Events stream that fans out webhook payloads to the browser. |

## iframe postMessage events

The parent listens to `window.message` and **must** validate `event.origin` against the iframe `src` (see `app/_components/EquAIPlatform/IntellaFrame.tsx`).

| Type | Trigger |
|---|---|
| `SESSION_ID_ASSIGNED` | InteLLA assigns a session ID. |
| `SESSION_STARTED` | User enters the active conversation. |
| `SESSION_ENDED` | Conversation ended (natural or manual). |
| `SESSION_ERROR` | Timeout, termination, or other in-session error. |

## Scripts

- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build (`output: "standalone"`)
- `pnpm start` — serve production build
- `pnpm lint` — ESLint

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 + shadcn/ui + Base UI · Framer Motion · Sonner · Zod · ulidx.

See [`AGENTS.md`](./AGENTS.md) for Next.js 16 breaking-change notes.

## Production hardening

This repository is a reference demo and favours readability over hardening. Before shipping:

- **Persist the webhook secret** across restarts; the demo regenerates a per-process secret on every boot when `WEBHOOK_SECRET` is blank.
- **Replace the in-memory webhook store** (`app/api/_lib/sse-store.ts`) with a database — restarts and multi-instance deploys drop in-flight payloads.
- **Use a stable tunnel hostname** (named Cloudflare tunnel, reserved ngrok domain, or a real public host) instead of free-tier rotating URLs.
- **Replace `DEMO_USER_ID = ulid()`** in `app/_components/EquAIPlatform/index.tsx` with your authenticated user's identifier; the platform echoes it in every webhook payload.
