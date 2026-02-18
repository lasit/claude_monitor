import { Router } from "express";
import { cache } from "../cache/cache-manager.js";
import { config } from "../config.js";
import { execCcusage } from "../ccusage/executor.js";
import { parseFirstJson } from "../ccusage/parser.js";
import { normalizeDaily, normalizeMonthly } from "../ccusage/normalizer.js";
import { deriveMonthlyByProject } from "../transforms/monthly-by-project.js";
import type {
  CcusageDailyResponse,
  CcusageMonthlyResponse,
  DailyEntry,
  MonthlyEntry,
} from "../../src/types/index.js";

const router = Router();

// Per-project monthly (derived from daily)
router.get("/", async (_req, res) => {
  try {
    const dailyData = await cache.get<DailyEntry[]>("daily", config.cache.dailyTtl, async () => {
      const raw = await execCcusage(["daily", "--json", "--instances"]);
      return normalizeDaily(parseFirstJson<CcusageDailyResponse>(raw));
    });

    const monthly = deriveMonthlyByProject(dailyData);
    res.json(monthly);
  } catch (err: any) {
    console.error("[monthly] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Official aggregate monthly totals
router.get("/aggregate", async (_req, res) => {
  try {
    const data = await cache.get<MonthlyEntry[]>("monthly-aggregate", config.cache.monthlyTtl, async () => {
      const raw = await execCcusage(["monthly", "--json", "--instances"]);
      return normalizeMonthly(parseFirstJson<CcusageMonthlyResponse>(raw));
    });

    res.json(data);
  } catch (err: any) {
    console.error("[monthly/aggregate] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
