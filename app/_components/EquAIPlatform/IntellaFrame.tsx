"use client";

// Embeds the learner webapp at the conversation_url returned by the platform
// and forwards its SESSION_* postMessage events to the parent. Each message is
// origin-guarded against the iframe src to drop spoofed messages.
import { motion } from "framer-motion";
import { memo, useCallback, useEffect, useSyncExternalStore } from "react";
import {
  INTELLA_MESSAGE_TYPES,
  type IntellaMessageType,
} from "@/app/_lib/const";

const computeHeight = () =>
  Math.min(600, Math.floor(window.innerHeight * 0.65));
const subscribeToResize = (cb: () => void) => {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
};
const serverHeight = () => 600;

type IntellaMessage = {
  type: IntellaMessageType;
  dialogId?: string;
};

type Props = {
  src: string;
  onMessage?: (message: IntellaMessage) => void;
  onEnded?: () => void;
  onStart?: () => void;
  onError?: () => void;
  onReporting?: () => void;
};

const IntellaFrame = ({
  src,
  onMessage,
  onEnded,
  onStart,
  onError,
  onReporting,
}: Props) => {
  const expectedOrigin = new URL(src).origin;
  const frameHeight = useSyncExternalStore(
    subscribeToResize,
    computeHeight,
    serverHeight,
  );

  const handler = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;

      const data = event.data;
      if (
        data?.type &&
        Object.values(INTELLA_MESSAGE_TYPES).includes(data.type)
      ) {
        onMessage?.(data as IntellaMessage);
        switch (data.type) {
          case "SESSION_STARTED":
            onStart?.();
            break;
          case "SESSION_ENDED":
            onEnded?.();
            break;
          case "SESSION_ERROR":
            // Manual termination, timeout, or platform error — no assessment will arrive.
            onError?.();
            break;
          case "SESSION_REPORTING":
            // Learner is filling the in-call error report: keep the iframe open.
            onReporting?.();
            break;
          default:
            break;
        }
      }
    },
    [expectedOrigin, onMessage, onEnded, onStart, onError, onReporting],
  );

  useEffect(() => {
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handler]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: frameHeight, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <iframe
        title="Intella session"
        src={src}
        width="100%"
        height={frameHeight}
        allow="camera; microphone"
        className="block border-0"
      />
    </motion.div>
  );
};

export default memo(IntellaFrame);
