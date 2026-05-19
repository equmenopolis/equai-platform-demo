"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { cefrBadgeClasses, cefrBarBg, cefrColor } from "@/app/_lib/cefrColor";
import { cn } from "@/lib/utils";

type Props = {
  cefrLabel: string;
  value: number;
  max: number;
  description: string;
};

const Overall = ({ cefrLabel, value, max, description }: Props) => {
  const color = cefrColor(cefrLabel);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">Overall</span>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
              cefrBadgeClasses[color],
            )}
          >
            {cefrLabel || "-"}
          </span>
        </div>
        <span className="text-2xl font-bold">
          {value}
          <span className="text-base font-normal text-muted-foreground">
            /{max}
          </span>
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", cefrBarBg[color])}
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export default memo(Overall);
