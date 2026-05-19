"use client";

import { motion } from "framer-motion";
import { memo, useMemo } from "react";

export type EvaluationScore = {
  label: string;
  value: number;
  max: number;
  description?: string;
  cefrLabel?: string;
};

const VIEWBOX_SIZE = 360;
const CX = VIEWBOX_SIZE / 2;
const CY = VIEWBOX_SIZE / 2;
const R = 120;
const LEVELS = 5;
const AXES = 6;

function angleOf(i: number) {
  return -Math.PI / 2 + (2 * Math.PI * i) / AXES;
}

function polarToXY(angle: number, radius: number) {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function pointsToPath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  return `${points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")} Z`;
}

const GRID_LEVELS = Array.from({ length: LEVELS }, (_, i) => (i + 1) / LEVELS);
const AXIS_END_POINTS = Array.from({ length: AXES }, (_, i) =>
  polarToXY(angleOf(i), R),
);
const GRID_PATHS = GRID_LEVELS.map((level) =>
  pointsToPath(
    Array.from({ length: AXES }, (_, i) => polarToXY(angleOf(i), R * level)),
  ),
);

export const RadarChart = memo(({ scores }: { scores: EvaluationScore[] }) => {
  const dataPoints = useMemo(
    () =>
      scores.map((score, i) => {
        const ratio = Math.min(score.value / score.max, 1);
        return polarToXY(angleOf(i), R * ratio);
      }),
    [scores],
  );

  const dataPath = useMemo(() => pointsToPath(dataPoints), [dataPoints]);

  const labelPoints = useMemo(
    () =>
      scores.map((score, i) => {
        const angle = angleOf(i);
        const labelR = R + 28;
        const pt = polarToXY(angle, labelR);
        const anchor =
          Math.abs(Math.cos(angle)) < 0.1
            ? "middle"
            : Math.cos(angle) > 0
              ? "start"
              : "end";
        return { ...pt, label: score.label, anchor };
      }),
    [scores],
  );

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Evaluation Results"
      className="block aspect-square max-w-[360px] text-foreground"
    >
      {GRID_PATHS.map((d, idx) => (
        <path
          // biome-ignore lint/suspicious/noArrayIndexKey: static precomputed list
          key={idx}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeWidth="1"
        />
      ))}

      {scores.map((score, i) => {
        const pt = AXIS_END_POINTS[i];
        return (
          <line
            key={score.label}
            x1={CX}
            y1={CY}
            x2={pt.x}
            y2={pt.y}
            stroke="currentColor"
            strokeOpacity={0.18}
            strokeWidth="1"
          />
        );
      })}

      <motion.path
        d={dataPath}
        fill="currentColor"
        fillOpacity={0.18}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
      />

      {scores.map((score, i) => (
        <circle
          key={score.label}
          cx={dataPoints[i].x}
          cy={dataPoints[i].y}
          r="4"
          fill="currentColor"
        />
      ))}

      {labelPoints.map((pt) => (
        <text
          key={pt.label}
          x={pt.x}
          y={pt.y}
          textAnchor={pt.anchor as "middle" | "start" | "end"}
          dominantBaseline="middle"
          fontSize="16"
          fill="currentColor"
          fontFamily="inherit"
        >
          {pt.label}
        </text>
      ))}
    </svg>
  );
});

RadarChart.displayName = "RadarChart";
