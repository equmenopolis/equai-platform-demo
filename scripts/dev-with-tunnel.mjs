#!/usr/bin/env node
// Boots cloudflared and runs next dev with WEBHOOK_BASE_URL set to the published
// tunnel URL. Stale `next dev` / cloudflared processes from previous runs are
// terminated first: quick-tunnel hostnames expire when the connection drops, so
// a leftover server keeps serving the app while the platform delivers webhooks
// to a dead URL.

import { execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = Number(process.env.PORT) || 3000;
const ORIGIN = `http://localhost:${PORT}`;
const TRYCLOUDFLARE = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

const isWindows = process.platform === "win32";

const sh = (cmd) => {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
};

const ps = (script) =>
  sh(`powershell -NoProfile -Command "${script.replaceAll('"', '\\"')}"`);

const parsePids = (raw) =>
  raw
    .split(/\s+/)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0 && n !== process.pid);

// PIDs listening on PORT.
function listeningPids() {
  if (isWindows) {
    return parsePids(
      ps(
        `(Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess`,
      ),
    );
  }
  return parsePids(sh(`lsof -ti tcp:${PORT} -sTCP:LISTEN`));
}

function commandOf(pid) {
  if (isWindows) {
    return ps(
      `(Get-CimInstance Win32_Process -Filter 'ProcessId=${pid}').CommandLine`,
    );
  }
  return sh(`ps -o command= -p ${pid}`);
}

// cloudflared processes tunneling this port (left over from previous runs).
function staleCloudflaredPids() {
  if (isWindows) {
    return parsePids(
      ps(
        `(Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'cloudflared' -and $_.CommandLine -match 'localhost:${PORT}' }).ProcessId`,
      ),
    );
  }
  return parsePids(sh(`pgrep -f "cloudflared tunnel --url ${ORIGIN}"`));
}

function tryKill(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch {
    return false;
  }
}

async function killStaleProcesses() {
  const blockers = listeningPids();
  for (const pid of blockers) {
    const cmd = commandOf(pid);
    if (!/next|node/i.test(cmd)) {
      process.stderr.write(
        `Port ${PORT} is in use by an unrelated process (PID ${pid}: ${cmd || "unknown"}).\n` +
          `Stop it manually, or set PORT to use a different port.\n`,
      );
      process.exit(1);
    }
    process.stderr.write(
      `[dev-with-tunnel] killing stale dev server (PID ${pid})\n`,
    );
    tryKill(pid, "SIGTERM");
  }

  // Wait for the port to free up; escalate if a process ignores SIGTERM.
  if (blockers.length > 0) {
    for (let i = 0; i < 20 && listeningPids().length > 0; i++) {
      if (i === 10) listeningPids().forEach((pid) => tryKill(pid, "SIGKILL"));
      await sleep(250);
    }
    if (listeningPids().length > 0) {
      process.stderr.write(`Could not free port ${PORT}.\n`);
      process.exit(1);
    }
  }

  // Killing the server first lets a previous dev-with-tunnel parent clean up
  // its own cloudflared; sweep whatever is still left (orphaned tunnels).
  await sleep(250);
  for (const pid of staleCloudflaredPids()) {
    process.stderr.write(
      `[dev-with-tunnel] killing stale cloudflared tunnel (PID ${pid})\n`,
    );
    tryKill(pid, "SIGTERM");
  }
}

await killStaleProcesses();

const tunnel = spawn(
  "cloudflared",
  ["tunnel", "--url", ORIGIN, "--no-autoupdate"],
  { stdio: ["ignore", "pipe", "pipe"], shell: isWindows },
);

tunnel.on("error", (err) => {
  if (err.code === "ENOENT") {
    process.stderr.write(
      "cloudflared not found. Install it first:\n" +
        "  macOS:    brew install cloudflared\n" +
        "  Windows:  winget install Cloudflare.cloudflared\n" +
        "  Linux:    https://github.com/cloudflare/cloudflared/releases\n",
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

  next = spawn("next", ["dev", "--port", String(PORT)], {
    stdio: "inherit",
    shell: isWindows,
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
