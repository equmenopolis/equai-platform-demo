"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { startTransition, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ulid } from "ulidx";
import type { AssessmentResult, WebhookPayload } from "@/app/_dtos";
import useSession from "@/app/_hooks/useSession";
import { useLoading } from "@/app/_hooks/useLoading";
import useWebhookSSE from "@/app/_hooks/useWebhookSSE";
import { LEARNER_WEBAPP_URL } from "@/app/_lib/const";
import { DEMO_SCENARIOS, type DemoScenario } from "@/app/_lib/scenarios";
import { Button } from "@/app/_components/ui/button";
import IntellaFrame from "./IntellaFrame";
import Result from "./Result";
import Scenario from "./Scenario";

// Stable per-page-load identifier sent to POST /api/sessions. Replace with your
// authenticated user's identifier; the platform echoes it in webhook payloads.
const DEMO_USER_ID = ulid();

const TOAST_MESSAGES = {
  sessionError: "The session ended with an error on the platform.",
  sseConnectionLost:
    "Connection lost — session results may not arrive in this tab.",
  learnerWebappMissing: "NEXT_PUBLIC_LEARNER_WEBAPP_URL is not configured.",
} as const;

export const EquAIPlatform = () => {
  const [chosenScenario, setChosenScenario] = useState<DemoScenario>(
    DEMO_SCENARIOS[0],
  );
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [endedWithoutResults, setEndedWithoutResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  // Pinned to the scenario in flight so the webhook handler doesn't follow
  // dropdown changes mid-session.
  const activeScenarioRef = useRef<DemoScenario>(chosenScenario);

  const { create: createSession } = useSession();
  const { isLoading: isSessionLoading, withLoading: withSessionLoading } =
    useLoading();

  const handleWebhookEvent = useCallback((payload: WebhookPayload) => {
    if (payload.type === "assessment_completed") {
      startTransition(() => {
        setResult(payload.data);
        setEndedWithoutResults(false);
        setSessionId(null);
      });
      return;
    }

    if (payload.type === "session_error") {
      toast.error(TOAST_MESSAGES.sessionError);
      setSessionId(null);
      return;
    }

    if (payload.type === "session_ended") {
      if (!activeScenarioRef.current.producesResults) {
        startTransition(() => {
          setEndedWithoutResults(true);
          setSessionId(null);
        });
      }
    }
  }, []);

  useWebhookSSE<WebhookPayload>(sessionId, handleWebhookEvent, () => {
    toast.error(TOAST_MESSAGES.sseConnectionLost);
  });

  const onClickStartConversation = useCallback(() => {
    setResult(null);
    setEndedWithoutResults(false);
    setSessionId(null);
    activeScenarioRef.current = chosenScenario;
    if (!LEARNER_WEBAPP_URL) {
      toast.error(TOAST_MESSAGES.learnerWebappMissing);
      return;
    }
    withSessionLoading(
      async () => {
        const response = await createSession({
          scenarioId: chosenScenario.id,
          userId: DEMO_USER_ID,
        });
        setSrc(`${LEARNER_WEBAPP_URL}/call?nonce=${response.nonce}`);
        setSessionId(response.session.id);
      },
      (error) => {
        toast.error(error instanceof Error ? error.message : String(error));
      },
    );
  }, [chosenScenario, withSessionLoading, createSession]);

  const onConversationEnded = useCallback(() => {
    // For scenarios that don't produce an assessment, the iframe's
    // SESSION_ENDED is the terminal signal — surface the "no analysis"
    // panel immediately rather than waiting for the platform's
    // session_ended webhook, which may lag or be unreliable.
    startTransition(() => {
      setSrc(null);
      if (!activeScenarioRef.current.producesResults) {
        setEndedWithoutResults(true);
        setSessionId(null);
      }
    });
  }, []);

  const onChangeScenario = useCallback((scenario: DemoScenario) => {
    setChosenScenario(scenario);
  }, []);

  const showResult =
    !src && (result !== null || endedWithoutResults || sessionId !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-4">
          <Scenario
            chosenScenario={chosenScenario}
            onChangeScenario={onChangeScenario}
            disabled={isSessionLoading || !!src}
          />
          <Button
            disabled={isSessionLoading || !!src}
            onClick={onClickStartConversation}
          >
            {isSessionLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Start Conversation
          </Button>
          <AnimatePresence>
            {src && <IntellaFrame src={src} onEnded={onConversationEnded} />}
          </AnimatePresence>
          <AnimatePresence>
            {showResult && (
              <Result
                result={result}
                endedWithoutResults={endedWithoutResults}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default EquAIPlatform;
