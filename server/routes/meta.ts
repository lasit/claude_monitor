import { Router } from "express";
import { cache } from "../cache/cache-manager.js";
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

const router = Router();

// Cache status
router.get("/", (_req, res) => {
  res.json(cache.getStatus());
});

// Force refresh
router.post("/refresh", async (req, res) => {
  const endpoint = (req.query.endpoint as string) || "all";
  console.log(`[meta] Force refresh requested for: ${endpoint}`);

  try {
    const refreshers: Record<string, () => Promise<unknown>> = {
      daily: () =>
        cache.refresh("daily", config.cache.dailyTtl, async () => {
          const raw = await execCcusage(["daily", "--json", "--instances"]);
          return normalizeDaily(parseFirstJson<CcusageDailyResponse>(raw));
        }),
      "monthly-aggregate": () =>
        cache.refresh("monthly-aggregate", config.cache.monthlyTtl, async () => {
          const raw = await execCcusage(["monthly", "--json", "--instances"]);
          return normalizeMonthly(parseFirstJson<CcusageMonthlyResponse>(raw));
        }),
      sessions: () =>
        cache.refresh("sessions", config.cache.sessionsTtl, async () => {
          const raw = await execCcusage(["session", "--json", "--instances"]);
          return normalizeSessions(parseFirstJson<CcusageSessionResponse>(raw));
        }),
      blocks: () =>
        cache.refresh("blocks", config.cache.blocksTtl, async () => {
          const raw = await execCcusage(["blocks", "--json", "--token-limit", "max"]);
          return normalizeBlocks(parseFirstJson<CcusageBlocksResponse>(raw));
        }),
    };

    if (endpoint === "all") {
      await Promise.allSettled(Object.values(refreshers).map((fn) => fn()));
    } else if (refreshers[endpoint]) {
      await refreshers[endpoint]();
    } else {
      res.status(400).json({ error: `Unknown endpoint: ${endpoint}` });
      return;
    }

    res.json({ refreshed: endpoint, status: cache.getStatus() });
  } catch (err: any) {
    console.error("[meta] Refresh error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
