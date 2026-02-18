import { cache } from "./cache-manager.js";
import { config } from "../config.js";
import { execCcusage } from "../ccusage/executor.js";
import { parseFirstJson } from "../ccusage/parser.js";
import { normalizeDaily, normalizeMonthly, normalizeSessions, normalizeBlocks } from "../ccusage/normalizer.js";
import type {
  CcusageDailyResponse,
  CcusageMonthlyResponse,
  CcusageSessionResponse,
  CcusageBlocksResponse,
} from "../../src/types/index.js";

/**
 * Pre-fetch all ccusage data on server start.
 * Runs all commands concurrently (limited by executor semaphore).
 */
export async function warmUpCache() {
  console.log("[cache] Warming up cache...");
  const start = Date.now();

  const jobs = [
    cache.refresh("daily", config.cache.dailyTtl, async () => {
      const raw = await execCcusage(["daily", "--json", "--instances"]);
      return normalizeDaily(parseFirstJson<CcusageDailyResponse>(raw));
    }),
    cache.refresh("monthly-aggregate", config.cache.monthlyTtl, async () => {
      const raw = await execCcusage(["monthly", "--json", "--instances"]);
      return normalizeMonthly(parseFirstJson<CcusageMonthlyResponse>(raw));
    }),
    cache.refresh("sessions", config.cache.sessionsTtl, async () => {
      const raw = await execCcusage(["session", "--json", "--instances"]);
      return normalizeSessions(parseFirstJson<CcusageSessionResponse>(raw));
    }),
    cache.refresh("blocks", config.cache.blocksTtl, async () => {
      const raw = await execCcusage(["blocks", "--json"]);
      return normalizeBlocks(parseFirstJson<CcusageBlocksResponse>(raw));
    }),
  ];

  const results = await Promise.allSettled(jobs);
  const elapsed = Date.now() - start;

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[cache] Warm-up complete in ${(elapsed / 1000).toFixed(1)}s: ${succeeded} succeeded, ${failed} failed`);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[cache] Warm-up error:", result.reason?.message || result.reason);
    }
  }
}
