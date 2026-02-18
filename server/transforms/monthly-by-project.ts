import type { DailyEntry, MonthlyEntry } from "../../src/types/index.js";

/**
 * Derives monthly-per-project data from daily data.
 * ccusage `monthly` doesn't support per-project grouping, so we aggregate daily data.
 */
export function deriveMonthlyByProject(dailyData: DailyEntry[]): MonthlyEntry[] {
  const grouped = new Map<string, MonthlyEntry>();

  for (const entry of dailyData) {
    // Extract YYYY-MM from date
    const yearMonth = entry.date.substring(0, 7);
    const key = `${yearMonth}|${entry.project}|${entry.model}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.inputTokens += entry.inputTokens;
      existing.outputTokens += entry.outputTokens;
      existing.cacheCreationTokens += entry.cacheCreationTokens;
      existing.cacheReadTokens += entry.cacheReadTokens;
      existing.cost += entry.cost;
    } else {
      grouped.set(key, {
        yearMonth,
        project: entry.project,
        projectShort: entry.projectShort,
        model: entry.model,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        cacheCreationTokens: entry.cacheCreationTokens,
        cacheReadTokens: entry.cacheReadTokens,
        cost: entry.cost,
      });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}
