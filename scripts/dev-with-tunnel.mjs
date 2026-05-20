#!/usr/bin/env node
// Boots cloudflared and runs next dev with WEBHOOK_BASE_URL set to the published tunnel URL.

import { spawn } from "node:child_process";

const TRYCLOUDFLARE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

const tunnel = spawn(
  "cloudflared",
  ["tunnel", "--url", "http://localhost:3000", "--no-autoupdate"],
  { stdio: ["ignore", "pipe", "pipe"] },
);

tunnel.on("error", (err) => {
  if (err.code === "ENOENT") {
    process.stderr.write(
      "cloudflared not found. Install it first:\n" +
        "  macOS:  brew install cloudflared\n" +
        "  Linux:  https://github.com/cloudflare/cloudflared/releases\n",
    );
  } else {
    process.stderr.write(`cloudflared spawn error: ${err.message}\n`);
  }
  process.exit(1);
});

let next = null;
let url = null;

const onTunnelData = (chunk) => {
  process.stderr.write(`[tunnel] ${chunk}`);
  if (url) return;
  const match = chunk.toString().match(TRYCLOUDFLARE);
  if (!match) return;
  url = match[0];
  process.stderr.write(`\n[dev-with-tunnel] WEBHOOK_BASE_URL=${url}\n\n`);

  next = spawn("next", ["dev"], {
    stdio: "inherit",
    env: { ...process.env, WEBHOOK_BASE_URL: url },
  });
  next.on("exit", (code) => {
    tunnel.kill("SIGTERM");
    process.exit(code ?? 0);
  });
};

tunnel.stdout.on("data", onTunnelData);
tunnel.stderr.on("data", onTunnelData);
tunnel.on("exit", (code) => {
  if (next) next.kill("SIGTERM");
  process.exit(code ?? 1);
});

const shutdown = (signal) => {
  if (next) next.kill(signal);
  tunnel.kill(signal);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
