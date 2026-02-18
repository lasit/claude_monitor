import { Router } from "express";
import { cache } from "../cache/cache-manager.js";
import { config } from "../config.js";
import { execCcusage } from "../ccusage/executor.js";
import { parseFirstJson } from "../ccusage/parser.js";
import { normalizeBlocks } from "../ccusage/normalizer.js";
import type { CcusageBlocksResponse, BlocksData } from "../../src/types/index.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const data = await cache.get<BlocksData>("blocks", config.cache.blocksTtl, async () => {
      const raw = await execCcusage(["blocks", "--json", "--token-limit", "max"]);
      return normalizeBlocks(parseFirstJson<CcusageBlocksResponse>(raw));
    });

    res.json(data);
  } catch (err: any) {
    console.error("[blocks] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
