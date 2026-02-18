import { Router } from "express";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { cache } from "../cache/cache-manager.js";
import { config } from "../config.js";
import type { PlanUsageResponse } from "../../src/types/index.js";

const router = Router();

const CREDENTIALS_PATH = join(homedir(), ".claude", ".credentials.json");

async function readAccessToken(): Promise<string> {
  const raw = await readFile(CREDENTIALS_PATH, "utf-8");
  const creds = JSON.parse(raw);
  const token = creds.claudeAiOauth?.accessToken;
  if (!token) throw new Error("No OAuth access token found in credentials");
  return token;
}

export async function fetchUsageFromApi(): Promise<PlanUsageResponse> {
  const token = await readAccessToken();

  const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-beta": "oauth-2025-04-20",
    },
  });

  if (res.status === 401) {
    cache.invalidate("usage");
    throw new Error("OAuth token expired, open Claude Code to refresh");
  }

  if (!res.ok) {
    throw new Error(`Anthropic usage API returned ${res.status}`);
  }

  const data = await res.json();

  return {
    five_hour: data.five_hour ?? null,
    seven_day: data.seven_day ?? null,
    seven_day_opus: data.seven_day_opus ?? null,
    seven_day_sonnet: data.seven_day_sonnet ?? null,
    extra_usage: data.extra_usage ?? null,
  };
}

router.get("/", async (_req, res) => {
  try {
    const data = await cache.get<PlanUsageResponse>(
      "usage",
      config.cache.usageTtl,
      fetchUsageFromApi,
    );
    res.json(data);
  } catch (err: any) {
    console.error("[usage] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
