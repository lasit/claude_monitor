import { Router } from "express";
import { cache } from "../cache/cache-manager.js";
import { config } from "../config.js";
import { execCcusage } from "../ccusage/executor.js";
import { parseFirstJson } from "../ccusage/parser.js";
import { normalizeSessions } from "../ccusage/normalizer.js";
import type { CcusageSessionResponse, SessionEntry } from "../../src/types/index.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await cache.get<SessionEntry[]>("sessions", config.cache.sessionsTtl, async () => {
      const raw = await execCcusage(["session", "--json", "--instances"]);
      return normalizeSessions(parseFirstJson<CcusageSessionResponse>(raw));
    });

    res.json(data);
  } catch (err: any) {
    console.error("[sessions] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
