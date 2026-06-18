export const INTELLA_MESSAGE_TYPES = {
  SESSION_ID_ASSIGNED: "SESSION_ID_ASSIGNED",
  SESSION_STARTED: "SESSION_STARTED",
  SESSION_ENDED: "SESSION_ENDED",
  SESSION_ERROR: "SESSION_ERROR",
  // Sent by the iframe when the learner enters the in-call error-report flow.
  // Signals the host to keep the iframe open until the report is finished.
  SESSION_REPORTING: "SESSION_REPORTING",
} as const;
export type IntellaMessageType = keyof typeof INTELLA_MESSAGE_TYPES;
