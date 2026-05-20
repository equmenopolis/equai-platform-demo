import type { WebhookPayload } from "@/app/_dtos";

// In-memory state, intentional for the demo. Production deployments should
// persist webhook results in a database to survive restarts and to bound memory.
//
// Known limitation: FIFO eviction at MAX_STORED_RESULTS. A long-running SSE
// subscriber receives live fan-out, but a later GET /webhook/:sessionId can
// 404 if its entry was evicted.
const MAX_STORED_RESULTS = 1000;

class BoundedStore<V> {
  private readonly map = new Map<string, V>();
  constructor(private readonly capacity: number) {}
  set(key: string, value: V): void {
    if (this.map.size >= this.capacity) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, value);
  }
  get(key: string): V | undefined {
    return this.map.get(key);
  }
}

export const webhookStore = new BoundedStore<WebhookPayload>(
  MAX_STORED_RESULTS,
);

// SSE subscribers are stream controllers. Each session can have N subscribers.
type SseController = ReadableStreamDefaultController<Uint8Array>;
const sseClients = new Map<string, Set<SseController>>();
const encoder = new TextEncoder();

export function addSseClient(
  sessionId: string,
  controller: SseController,
): void {
  let set = sseClients.get(sessionId);
  if (!set) {
    set = new Set();
    sseClients.set(sessionId, set);
  }
  set.add(controller);
}

export function removeSseClient(
  sessionId: string,
  controller: SseController,
): void {
  const set = sseClients.get(sessionId);
  if (!set) return;
  set.delete(controller);
  if (set.size === 0) sseClients.delete(sessionId);
}

export function notifySseClients(
  sessionId: string,
  data: WebhookPayload,
): void {
  const set = sseClients.get(sessionId);
  if (!set) return;
  const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const controller of set) {
    try {
      controller.enqueue(chunk);
    } catch {
      // Controller already closed — drop it.
      set.delete(controller);
    }
  }
}
