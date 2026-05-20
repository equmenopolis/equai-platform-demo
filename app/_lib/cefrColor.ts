export type CefrColor =
  | "green"
  | "cyan"
  | "blue"
  | "orange"
  | "red"
  | "gray";

export const cefrColor = (label?: string): CefrColor => {
  switch (label) {
    case "C2":
    case "C1":
      return "green";
    case "B2":
      return "cyan";
    case "B1":
      return "blue";
    case "A2":
      return "orange";
    case "A1":
      return "red";
    default:
      return "gray";
  }
};

export const cefrBadgeClasses: Record<CefrColor, string> = {
  green: "bg-green-100 text-green-800 border border-green-200",
  cyan: "bg-cyan-100 text-cyan-800 border border-cyan-200",
  blue: "bg-blue-100 text-blue-800 border border-blue-200",
  orange: "bg-orange-100 text-orange-800 border border-orange-200",
  red: "bg-red-100 text-red-800 border border-red-200",
  gray: "bg-zinc-100 text-zinc-700 border border-zinc-200",
};

export const cefrBarBg: Record<CefrColor, string> = {
  green: "bg-green-500",
  cyan: "bg-cyan-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  gray: "bg-zinc-400",
};
