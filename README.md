# EQU AI Platform Demo

Reference integration for the [EQU AI Platform](https://platform.equ.ai): pick a scenario, talk to InteLLA in an embedded iframe, see assessment results delivered via webhook. Single Next.js 16 app — the API key never reaches the browser.

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

Defined in `.env.local` (gitignored). **The demo is intended to run against production**; substitute staging URLs only for internal testing.

| Variable | Required | Example (production) | Description |
|---|---|---|---|
| `EQU_AI_PLATFORM_URL` | ✓ | `https://api.equ.ai` | EQU AI Platform API base URL |
| `EQU_AI_PLATFORM_API_KEY` | ✓ | `gm_…` | Bearer token from `platform.equ.ai` |
| `WEBHOOK_BASE_URL` | auto¹ | `https://<tunnel-host>` | Public URL of this app. Webhook registration appends `/api/webhook` |
| `WEBHOOK_SECRET` | — | _(leave blank)_ | Shared secret. Blank → a fresh one is generated per process at boot |
| `NEXT_PUBLIC_LEARNER_WEBAPP_URL` | ✓ | `https://speaking.langx.ai/` | InteLLA learner webapp URL, embedded as an iframe |

¹ `pnpm dev:tunnel` sets `WEBHOOK_BASE_URL` from cloudflared's published URL at startup, so it can be left blank in `.env.local` for that path. Set it explicitly in `.env.local` only when you run plain `pnpm dev` against a tunnel you manage yourself, or when deploying.

`instrumentation.ts` re-registers the webhook against `WEBHOOK_BASE_URL` on every boot. Restart `pnpm dev` after editing `.env.local`.

## Webhook tunnel

The platform delivers `assessment_completed`, `session_ended`, and `session_error` events to `POST /api/webhook`, so that route needs to be reachable over HTTPS during local development. `pnpm dev:tunnel` handles this end to end via Cloudflare's quick tunnel — no Cloudflare account, no manual copy-paste of URLs. The boot log line `[webhook] registered [...] -> <url>/api/webhook (secret …)` confirms the platform accepted the registration.

If you'd rather use a stable hostname (named Cloudflare tunnel, reserved ngrok domain, your own ingress, etc.), expose `localhost:3000` over HTTPS yourself, set the resulting URL as `WEBHOOK_BASE_URL` in `.env.local`, and start the demo with plain `pnpm dev`. Anything that publishes `localhost:3000` to a public HTTPS URL works.

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

1. User picks a scenario and clicks **Start Conversation** → `POST /api/sessions` proxies to the platform and returns `{ session, nonce }`.
2. Demo embeds `${NEXT_PUBLIC_LEARNER_WEBAPP_URL}/call?nonce=…` as an iframe.
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
