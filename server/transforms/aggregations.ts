import type { DailyEntry, MonthlyEntry } from "../../src/types/index.js";

/**
 * Group an array by a key function and aggregate values.
 */
export function groupBy<T, K extends string>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

export function sumCost<T extends { cost: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.cost, 0);
}

export function sumTokens<T extends { inputTokens: number; outputTokens: number }>(
  items: T[]
): { inputTokens: number; outputTokens: number } {
  return items.reduce(
    (acc, item) => ({
      inputTokens: acc.inputTokens + item.inputTokens,
      outputTokens: acc.outputTokens + item.outputTokens,
    }),
    { inputTokens: 0, outputTokens: 0 }
  );
}
