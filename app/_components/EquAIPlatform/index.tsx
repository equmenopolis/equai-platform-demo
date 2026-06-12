"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { startTransition, useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { AssessmentResult, WebhookPayload } from "@/app/_dtos";
import useSession from "@/app/_hooks/useSession";
import { useLoading } from "@/app/_hooks/useLoading";
import useWebhookSSE from "@/app/_hooks/useWebhookSSE";
import type { DemoScenario } from "@/app/_lib/scenarios";
import { Button } from "@/app/_components/ui/button";
import IntellaFrame from "./IntellaFrame";
import Result, { type EndReason } from "./Result";
import Scenario from "./Scenario";

const TOAST_MESSAGES = {
  sessionError: "The session ended with an error on the platform.",
} as const;

type Props = {
  scenarios: readonly DemoScenario[];
};

export const EquAIPlatform = ({ scenarios }: Props) => {
  const [chosenScenario, setChosenScenario] = useState<DemoScenario>(
    scenarios[0],
  );
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [endReason, setEndReason] = useState<EndReason | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);

  // Pinned to the scenario in flight so the webhook handler doesn't follow
  // dropdown changes mid-session.
  const activeScenarioRef = useRef<DemoScenario>(chosenScenario);

  // True once the iframe has already signaled an early termination, so the
  // matching webhook session_error that follows doesn't double-notify.
  const endedEarlyFromIframeRef = useRef(false);

  const { create: createSession } = useSession();
  const { isLoading: isSessionLoading, withLoading: withSessionLoading } =
    useLoading();

  const handleWebhookEvent = useCallback((payload: WebhookPayload) => {
    if (payload.type === "assessment_completed") {
      startTransition(() => {
        setResult(payload.data);
        setEndReason(null);
        setSessionId(null);
      });
      return;
    }

    if (payload.type === "session_error") {
      // Only toast when the iframe didn't already signal the end (rare path:
      // platform-side failure while iframe is unresponsive). Otherwise the
      // "ended-early" panel below is the canonical feedback.
      if (!endedEarlyFromIframeRef.current) {
        toast.error(TOAST_MESSAGES.sessionError);
      }
      startTransition(() => {
        setSrc(null);
        setEndReason("ended-early");
        setSessionId(null);
      });
      return;
    }

    if (payload.type === "session_ended") {
      if (!activeScenarioRef.current.producesResults) {
        startTransition(() => {
          setEndReason("no-analysis");
          setSessionId(null);
        });
      }
    }
  }, []);

  useWebhookSSE<WebhookPayload>(sessionId, handleWebhookEvent);

  const onClickStartConversation = useCallback(() => {
    setResult(null);
    setEndReason(null);
    setSessionId(null);
    activeScenarioRef.current = chosenScenario;
    endedEarlyFromIframeRef.current = false;
    withSessionLoading(
      async () => {
        const response = await createSession({
          scenarioId: chosenScenario.id,
        });
        setSrc(response.conversation_url);
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
    //
    // We also mark the iframe-end ref: if a later webhook session_error
    // arrives (manual termination, timeout), we already conveyed the end
    // here and the panel will show it, so a toast would double-notify.
    endedEarlyFromIframeRef.current = true;
    startTransition(() => {
      setSrc(null);
      if (!activeScenarioRef.current.producesResults) {
        setEndReason("no-analysis");
        setSessionId(null);
      }
    });
  }, []);

  const onConversationEndedEarly = useCallback(() => {
    // Manual cancel / timeout / platform error — no assessment will arrive.
    endedEarlyFromIframeRef.current = true;
    startTransition(() => {
      setSrc(null);
      setEndReason("ended-early");
      setSessionId(null);
    });
  }, []);

  const onChangeScenario = useCallback((scenario: DemoScenario) => {
    setChosenScenario(scenario);
  }, []);

  const showResult =
    !src && (result !== null || endReason !== null || sessionId !== null);

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
            scenarios={scenarios}
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
            {src && (
              <IntellaFrame
                src={src}
                onEnded={onConversationEnded}
                onError={onConversationEndedEarly}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showResult && <Result result={result} endReason={endReason} />}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default EquAIPlatform;
