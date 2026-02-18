/**
 * Format a number as USD currency.
 */
export function formatCost(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format large token counts with K/M suffixes.
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}

/**
 * Format a number with commas.
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Format duration in minutes to human-readable.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format an ISO date string to a locale-appropriate short date.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO datetime string to a short datetime.
 */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a percentage.
 */
export function formatPct(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}
