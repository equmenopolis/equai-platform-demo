import type { NextConfig } from "next";

/**
 * Hostnames allowed to reach the Next.js dev server from a non-localhost origin.
 *
 * Next.js 15+ blocks cross-origin requests to dev-only assets (HMR, JS chunks,
 * RSC payloads) from any host other than the one `next dev` was started on.
 * When the demo is opened through a public tunnel — for partner demos,
 * mobile/tablet QA, or remote review — the initial HTML loads but JS chunks
 * are blocked, leaving the page stuck with only the header rendered.
 *
 * The wildcards below cover every tunnel path the README documents:
 *  - `pnpm dev:tunnel` (Cloudflare quick tunnels, `*.trycloudflare.com`)
 *  - the manual ngrok fallback, across free, paid, and legacy domains
 *
 * For cases the wildcards can't enumerate ahead of time — a LAN IP for
 * on-device testing, a named Cloudflare tunnel with a custom domain, or a
 * different tunnel service — set `DEV_EXTRA_ORIGINS` to a comma-separated
 * list of hostnames.
 *
 * Ignored in production builds.
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
const DEV_TUNNEL_ORIGINS = [
  // Cloudflare quick tunnels (used by `pnpm dev:tunnel`)
  "*.trycloudflare.com",
  // ngrok — current free + paid tiers
  "*.ngrok-free.app",
  "*.ngrok-free.dev",
  "*.ngrok.app",
  "*.ngrok.dev",
  // ngrok — legacy domains (older accounts may still receive these)
  "*.ngrok.io",
];

const extraDevOrigins =
  process.env.DEV_EXTRA_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...DEV_TUNNEL_ORIGINS, ...extraDevOrigins],
};

export default nextConfig;
