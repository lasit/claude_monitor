import { Router } from "express";
import { cache } from "../cache/cache-manager.js";
import { config } from "../config.js";
import { execCcusage } from "../ccusage/executor.js";
import { parseFirstJson } from "../ccusage/parser.js";
import { normalizeDaily } from "../ccusage/normalizer.js";
import type { CcusageDailyResponse, DailyEntry } from "../../src/types/index.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await cache.get<DailyEntry[]>("daily", config.cache.dailyTtl, async () => {
      const raw = await execCcusage(["daily", "--json", "--instances"]);
      return normalizeDaily(parseFirstJson<CcusageDailyResponse>(raw));
    });

    // Optional query param filtering
    let filtered = data;
    const since = _req.query.since as string | undefined;
    const until = _req.query.until as string | undefined;

    if (since) {
      filtered = filtered.filter((d) => d.date >= since);
    }
    if (until) {
      filtered = filtered.filter((d) => d.date <= until);
    }

    res.json(filtered);
  } catch (err: any) {
    console.error("[daily] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
