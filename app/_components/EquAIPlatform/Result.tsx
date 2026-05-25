"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { memo, type ReactNode, useMemo } from "react";
import type { AssessmentResult } from "@/app/_dtos";
import Overall from "@/app/_components/Overall";
import {
  type EvaluationScore,
  RadarChart,
} from "@/app/_components/RadarChart";
import ScoreAccordion from "@/app/_components/ScoreAccordion";

type RadarMetricKey =
  | "range"
  | "fluency"
  | "accuracy"
  | "coherence"
  | "phonology"
  | "interaction";

const RADAR_METRIC_KEYS: RadarMetricKey[] = [
  "range",
  "fluency",
  "accuracy",
  "coherence",
  "phonology",
  "interaction",
];

const RADAR_MAX = 6;

export type EndReason = "no-analysis" | "ended-early";

type Props = {
  result: AssessmentResult | null;
  endReason: EndReason | null;
  title?: string;
};

const ENDED_COPY: Record<EndReason, { heading: string; body: string }> = {
  "no-analysis": {
    heading: "Conversation complete",
    body: "This scenario isn't configured to produce an analysis. Try the Speaking test or Can-Do lesson to see assessment results.",
  },
  "ended-early": {
    heading: "Conversation ended early",
    body: "The session was stopped before an assessment could be generated. Start a new session to try again.",
  },
};

type StatePanelProps = {
  minHeight: number;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
};

const StatePanel = ({
  minHeight,
  className,
  ariaLabel,
  children,
}: StatePanelProps) => (
  <div
    role="status"
    aria-live="polite"
    aria-label={ariaLabel}
    className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-8 ${className ?? ""}`}
    style={{ minHeight }}
  >
    {children}
  </div>
);

const LoadingState = () => (
  <StatePanel
    minHeight={300}
    className="border-border bg-muted/40"
    ariaLabel="Evaluating your conversation"
  >
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
      transition={{
        duration: 1.8,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
      className="flex"
    >
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
    </motion.div>
    <div className="flex flex-col items-center gap-1">
      <p className="text-base font-medium">Evaluating your conversation</p>
      <p className="text-sm text-muted-foreground">
        This may take up to 10 minutes.
      </p>
    </div>
    <div className="mt-1 flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
          className="inline-block h-1.5 w-1.5 rounded-full bg-foreground"
        />
      ))}
    </div>
  </StatePanel>
);

const EndedState = ({ reason }: { reason: EndReason }) => {
  const copy = ENDED_COPY[reason];
  return (
    <StatePanel
      minHeight={200}
      className="border-border bg-muted/40"
      ariaLabel={copy.heading}
    >
      <p className="text-lg font-medium">{copy.heading}</p>
      <p className="text-center text-sm text-muted-foreground">{copy.body}</p>
    </StatePanel>
  );
};

const JsonBlock = ({ value }: { value: unknown }) => (
  <pre className="m-0 overflow-x-auto whitespace-pre rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
    {JSON.stringify(value, null, 2)}
  </pre>
);

const toEvaluationScores = (result: AssessmentResult): EvaluationScore[] => {
  return RADAR_METRIC_KEYS.map((key) => {
    const metric = result.cefr_results?.[key];
    return {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value: Number(metric?.score?.toFixed(2) ?? 0),
      max: RADAR_MAX,
      cefrLabel: metric?.label ?? "",
      description: metric?.description?.en ?? "",
    };
  });
};

const Result = ({
  result,
  endReason,
  title = "Evaluation Results",
}: Props) => {
  const evaluationScores = useMemo<EvaluationScore[]>(
    () => (result ? toEvaluationScores(result) : []),
    [result],
  );
  const overall = useMemo(() => {
    if (!result?.cefr_results?.overall) return null;
    const o = result.cefr_results.overall;
    return {
      value: Number(o.score.toFixed(2)),
      max: RADAR_MAX,
      cefrLabel: o.label ?? "",
      description: o.description?.en ?? "",
    };
  }, [result]);

  const hasCefr = !!result?.cefr_results;
  const hasCanDo = !!result?.can_do;
  const hasReview =
    !!result?.review_questions && result.review_questions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {result && (
          <p className="text-sm text-muted-foreground">
            Your conversation has been evaluated.
          </p>
        )}
      </div>

      {!result && endReason && <EndedState reason={endReason} />}
      {!result && !endReason && <LoadingState />}

      {result && hasCefr && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-center">
            <RadarChart scores={evaluationScores} />
          </div>
          {overall && <Overall {...overall} />}
          <ScoreAccordion scores={evaluationScores} />
        </div>
      )}

      {result && hasCanDo && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Can-Do statements</h3>
          <JsonBlock value={result.can_do} />
        </div>
      )}

      {result && hasReview && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-medium">Review questions</h3>
          <JsonBlock value={result.review_questions} />
        </div>
      )}
    </motion.div>
  );
};

export default memo(Result);
