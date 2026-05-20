"use client";

import { useEffect, useRef } from "react";

const useWebhookSSE = <T = unknown>(
  sessionId: string | null,
  onMessage: (data: T) => void,
  onError?: (event: Event) => void,
) => {
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!sessionId) return;

    const es = new EventSource(`/api/sse/${sessionId}`);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        onMessageRef.current(data);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = (event) => {
      es.close();
      onErrorRef.current?.(event);
    };

    return () => {
      es.close();
    };
  }, [sessionId]);
};

export default useWebhookSSE;
