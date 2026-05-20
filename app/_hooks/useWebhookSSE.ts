"use client";

import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 5000;

// EQU webhooks are server-to-server, so the demo's backend bridges them to the
// browser via SSE; if the SSE drops we fall back to polling /api/webhook/[sessionId].
const useWebhookSSE = <T = unknown>(
  sessionId: string | null,
  onMessage: (data: T) => void,
) => {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let lastDeliveredKey = "";

    const deliverOnce = (payload: T) => {
      const key = JSON.stringify(payload);
      if (key === lastDeliveredKey) return;
      lastDeliveredKey = key;
      onMessageRef.current(payload);
    };

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/webhook/${sessionId}`);
        if (res.ok) {
          const body = (await res.json()) as { status: string; result?: T };
          if (body.status === "OK" && body.result) deliverOnce(body.result);
        }
      } catch {
        // ignore network errors, the next tick retries
      }
      if (!cancelled) {
        pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    const es = new EventSource(`/api/sse/${sessionId}`);

    es.onmessage = (event) => {
      try {
        deliverOnce(JSON.parse(event.data) as T);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    return () => {
      cancelled = true;
      es.close();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [sessionId]);
};

export default useWebhookSSE;
