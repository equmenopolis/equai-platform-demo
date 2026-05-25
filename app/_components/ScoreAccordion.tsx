"use client";

import { memo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/_components/ui/accordion";
import { cefrBadgeClasses, cefrColor } from "@/app/_lib/cefrColor";
import { cn } from "@/lib/utils";
import type { EvaluationScore } from "./RadarChart";

type Props = {
  scores: EvaluationScore[];
};

const ScoreAccordion = ({ scores }: Props) => {
  return (
    <Accordion multiple className="rounded-xl border border-border bg-card">
      {scores.map((score) => {
        const color = cefrColor(score.cefrLabel);
        return (
          <AccordionItem
            key={score.label}
            value={score.label}
            className="px-4"
          >
            <AccordionTrigger className="py-3">
              <div className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-medium">{score.label}</span>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="font-bold">
                    {score.value}/{score.max}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                      cefrBadgeClasses[color],
                    )}
                  >
                    {score.cefrLabel || "-"}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {score.description && (
                <p className="text-sm text-muted-foreground">
                  {score.description}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default memo(ScoreAccordion);
