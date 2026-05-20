# EquAI Platform Demo

Demo app showing how to use the Equmenopolis LANGX platform.

Built with [Next.js](https://nextjs.org) 16, React 19, Tailwind CSS 4, and shadcn/ui.

## API Reference

Read more about the LANGX platform API at [https://platform.equ.ai/](https://platform.equ.ai/).

## Getting Started

Install deps and run dev server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Expose the webhook publicly

The EQU AI Platform delivers `assessment_completed`, `session_ended`, and
`session_error` events to this app's `POST /api/webhook` route. For local
development that route needs to be reachable over HTTPS, so you need to
publish `http://localhost:3000` through a tunnel and point the demo at the
resulting public URL. The app's `instrumentation.ts` registers the webhook
against `WEBHOOK_BASE_URL` when the server boots.

Copy the env example first:

```bash
cp .env.example .env.local
```

Then start one of the tunnels below in a separate terminal alongside
`pnpm dev`.

### Option A — Cloudflare quick tunnel (no account required)

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

Copy the printed `https://<random>.trycloudflare.com` URL.

### Option B — ngrok (requires a free ngrok account + authtoken)

```bash
brew install --cask ngrok
ngrok config add-authtoken <your-token-from-dashboard.ngrok.com>   # first time only
ngrok http 3000
```

Copy the printed `https://<random>.ngrok-free.app` URL.

### Wire the tunnel URL into the demo

Set the URL you copied as `WEBHOOK_BASE_URL` in `.env.local`:

```
WEBHOOK_BASE_URL=https://<your-tunnel-host>
```

Restart `pnpm dev`. On boot the log line
`[webhook] registered [...] -> <your-tunnel-host>/api/webhook` confirms the
platform has accepted the registration. Both tunnels assign a fresh URL on
every launch — if you restart the tunnel, update `.env.local` and restart
`pnpm dev` so the new URL is re-registered.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — production build
- `pnpm start` — serve production build
- `pnpm lint` — ESLint

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 + shadcn/ui + Base UI
- Framer Motion, Lucide icons, Sonner toasts
- Zod validation, ulidx IDs

## Notes

See `AGENTS.md` — this Next.js version has breaking changes from older releases. Check `node_modules/next/dist/docs/` before extending.
