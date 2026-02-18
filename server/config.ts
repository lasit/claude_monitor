import { env } from "node:process";

export const config = {
  port: parseInt(env.PORT || "3001", 10),
  timezone: env.CCUSAGE_TIMEZONE || "Australia/Darwin",
  cache: {
    dailyTtl: 5 * 60 * 1000,     // 5 minutes
    monthlyTtl: 10 * 60 * 1000,  // 10 minutes
    sessionsTtl: 5 * 60 * 1000,  // 5 minutes
    blocksTtl: 45 * 1000,        // 45 seconds
    usageTtl: 60 * 1000,         // 60 seconds
  },
  ccusage: {
    timeout: 60_000,             // 60 second timeout for ccusage calls
    maxConcurrent: 2,            // max concurrent ccusage processes
  },
} as const;
