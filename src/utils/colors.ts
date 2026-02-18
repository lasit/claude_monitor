/**
 * Chart color palette - distinguishable on dark backgrounds.
 */
export const CHART_COLORS = [
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#84cc16", // lime
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#e11d48", // rose
] as const;

/**
 * Model-specific colors for consistent rendering.
 */
export const MODEL_COLORS: Record<string, string> = {
  "claude-sonnet-4-20250514": "#3b82f6",
  "claude-opus-4-20250514": "#8b5cf6",
  "claude-haiku-3-5-20241022": "#10b981",
  "claude-3-5-sonnet-20241022": "#f59e0b",
  "claude-3-5-haiku-20241022": "#06b6d4",
};

export function getModelColor(model: string): string {
  return MODEL_COLORS[model] || CHART_COLORS[Object.keys(MODEL_COLORS).length % CHART_COLORS.length];
}

export function getProjectColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Map model ID to a short display name.
 */
export function getModelShortName(model: string): string {
  if (model.includes("opus-4")) return "Opus 4";
  if (model.includes("sonnet-4")) return "Sonnet 4";
  if (model.includes("haiku-3-5") || model.includes("haiku-3.5")) return "Haiku 3.5";
  if (model.includes("sonnet-3-5") || model.includes("sonnet-3.5")) return "Sonnet 3.5";
  if (model.includes("opus-3")) return "Opus 3";
  // Fallback: take last meaningful segment
  const parts = model.split("-");
  return parts.slice(0, -1).join(" ").replace("claude ", "");
}
