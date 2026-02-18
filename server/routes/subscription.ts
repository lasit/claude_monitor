import { Router } from "express";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { SubscriptionInfo } from "../../src/types/index.js";

const router = Router();

// Known token limits per tier (ccusage's estimates for 5-hour blocks)
const TIER_TOKEN_LIMITS: Record<string, number> = {
  default_claude_max_5x: 86_595_595,
};

router.get("/", async (_req, res) => {
  try {
    const credPath = join(homedir(), ".claude", ".credentials.json");
    const raw = await readFile(credPath, "utf-8");
    const creds = JSON.parse(raw);

    const oauth = creds.claudeAiOauth || {};
    const tier = oauth.rateLimitTier || "unknown";

    const info: SubscriptionInfo = {
      subscriptionType: oauth.subscriptionType || "unknown",
      rateLimitTier: tier,
      tokenLimit: TIER_TOKEN_LIMITS[tier] ?? null,
    };

    res.json(info);
  } catch (err: any) {
    console.error("[subscription] Error reading credentials:", err.message);
    res.json({
      subscriptionType: "unknown",
      rateLimitTier: "unknown",
      tokenLimit: null,
    });
  }
});

export default router;
