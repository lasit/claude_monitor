// === ccusage raw types (actual CLI output shapes) ===

export interface CcusageModelBreakdown {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface CcusageDailyEntry {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: CcusageModelBreakdown[];
}

export interface CcusageDailyResponse {
  projects: Record<string, CcusageDailyEntry[]>;
}

export interface CcusageSessionEntry {
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  lastActivity: string;
  modelsUsed: string[];
  modelBreakdowns: CcusageModelBreakdown[];
  projectPath: string;
}

export interface CcusageSessionResponse {
  sessions: CcusageSessionEntry[];
}

export interface CcusageBlockEntry {
  id: string;
  startTime: string;
  endTime: string;
  actualEndTime: string | null;
  isActive: boolean;
  isGap: boolean;
  entries: number;
  tokenCounts: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  };
  totalTokens: number;
  costUSD: number;
  models: string[];
  burnRate: {
    tokensPerMinute: number;
    tokensPerMinuteForIndicator: number;
    costPerHour: number;
  } | null;
  projection: {
    totalTokens: number;
    totalCost: number;
    remainingMinutes: number;
  } | null;
  tokenLimitStatus?: {
    limit: number;
    projectedUsage: number;
    percentUsed: number;
    status: "ok" | "warning" | "exceeds";
  };
}

export interface CcusageBlocksResponse {
  blocks: CcusageBlockEntry[];
}

export interface CcusageMonthlyEntry {
  month: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: CcusageModelBreakdown[];
}

export interface CcusageMonthlyResponse {
  monthly: CcusageMonthlyEntry[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    totalCost: number;
    totalTokens: number;
  };
}

// === Normalized types (what our API returns) ===

export interface DailyEntry {
  date: string;
  project: string;
  projectShort: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface MonthlyEntry {
  yearMonth: string;
  project?: string;
  projectShort?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface SessionEntry {
  sessionId: string;
  projectPath: string;
  project: string;
  projectShort: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  lastActivity: string;
  models: string[];
  modelBreakdowns: Array<{
    model: string;
    cost: number;
    inputTokens: number;
    outputTokens: number;
  }>;
}

export interface BlockEntry {
  id: string;
  blockNumber: number;
  startTime: string;
  endTime: string;
  actualEndTime: string | null;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  isActive: boolean;
  models: string[];
  entries: number;
  burnRate: {
    costPerHour: number;
  } | null;
  projection: {
    totalCost: number;
    remainingMinutes: number;
  } | null;
  tokenLimitStatus?: {
    limit: number;
    projectedUsage: number;
    percentUsed: number;
    status: "ok" | "warning" | "exceeds";
  };
}

export interface BlocksData {
  blocks: BlockEntry[];
  totalCost: number;
  totalBlocks: number;
}

export interface CacheStatus {
  endpoint: string;
  cachedAt: string | null;
  ttlMs: number;
  isStale: boolean;
  isRefreshing: boolean;
}

export interface MetaResponse {
  caches: CacheStatus[];
  serverStartedAt: string;
  uptime: number;
}

export interface SubscriptionInfo {
  subscriptionType: string;
  rateLimitTier: string;
  tokenLimit: number | null;
}
