import type {
  CcusageDailyResponse,
  CcusageMonthlyResponse,
  CcusageSessionResponse,
  CcusageBlocksResponse,
  DailyEntry,
  MonthlyEntry,
  SessionEntry,
  BlocksData,
} from "../../src/types/index.js";
import { extractProjectShortName } from "../transforms/project-names.js";

/**
 * Flatten ccusage daily response into per-project-per-model-per-day rows.
 */
export function normalizeDaily(raw: CcusageDailyResponse): DailyEntry[] {
  const entries: DailyEntry[] = [];

  for (const [project, days] of Object.entries(raw.projects)) {
    const projectShort = extractProjectShortName(project);

    for (const day of days) {
      // Expand model breakdowns into individual rows
      for (const mb of day.modelBreakdowns) {
        entries.push({
          date: day.date,
          project,
          projectShort,
          model: mb.modelName,
          inputTokens: mb.inputTokens ?? 0,
          outputTokens: mb.outputTokens ?? 0,
          cacheCreationTokens: mb.cacheCreationTokens ?? 0,
          cacheReadTokens: mb.cacheReadTokens ?? 0,
          cost: mb.cost ?? 0,
        });
      }
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Normalize ccusage monthly response into per-model rows.
 */
export function normalizeMonthly(raw: CcusageMonthlyResponse): MonthlyEntry[] {
  const entries: MonthlyEntry[] = [];

  for (const month of raw.monthly) {
    for (const mb of month.modelBreakdowns) {
      entries.push({
        yearMonth: month.month,
        model: mb.modelName,
        inputTokens: mb.inputTokens ?? 0,
        outputTokens: mb.outputTokens ?? 0,
        cacheCreationTokens: mb.cacheCreationTokens ?? 0,
        cacheReadTokens: mb.cacheReadTokens ?? 0,
        cost: mb.cost ?? 0,
      });
    }
  }

  return entries.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

/**
 * Normalize ccusage session response (sessions are per-project).
 */
export function normalizeSessions(raw: CcusageSessionResponse): SessionEntry[] {
  return raw.sessions.map((s, i) => ({
    sessionId: s.projectPath && s.projectPath !== "Unknown Project" ? s.projectPath : `${s.sessionId}-${i}`,
    projectPath: s.projectPath,
    project: s.sessionId,
    projectShort: extractProjectShortName(s.sessionId),
    cost: s.totalCost ?? 0,
    inputTokens: s.inputTokens ?? 0,
    outputTokens: s.outputTokens ?? 0,
    cacheCreationTokens: s.cacheCreationTokens ?? 0,
    cacheReadTokens: s.cacheReadTokens ?? 0,
    lastActivity: s.lastActivity,
    models: s.modelsUsed ?? [],
    modelBreakdowns: (s.modelBreakdowns ?? []).map((mb) => ({
      model: mb.modelName,
      cost: mb.cost ?? 0,
      inputTokens: mb.inputTokens ?? 0,
      outputTokens: mb.outputTokens ?? 0,
    })),
  }));
}

/**
 * Normalize ccusage blocks response.
 * Filters out gap entries and assigns block numbers to real blocks.
 */
export function normalizeBlocks(raw: CcusageBlocksResponse): BlocksData {
  const realBlocks = raw.blocks.filter((b) => !b.isGap);

  let blockNum = 1;
  const blocks = realBlocks.map((b) => ({
    id: b.id,
    blockNumber: blockNum++,
    startTime: b.startTime,
    endTime: b.endTime,
    actualEndTime: b.actualEndTime,
    cost: b.costUSD ?? 0,
    inputTokens: b.tokenCounts?.inputTokens ?? 0,
    outputTokens: b.tokenCounts?.outputTokens ?? 0,
    cacheCreationTokens: b.tokenCounts?.cacheCreationInputTokens ?? 0,
    cacheReadTokens: b.tokenCounts?.cacheReadInputTokens ?? 0,
    isActive: b.isActive ?? false,
    models: b.models ?? [],
    entries: b.entries ?? 0,
    burnRate: b.burnRate,
    projection: b.projection,
    tokenLimitStatus: b.tokenLimitStatus,
  }));

  const totalCost = blocks.reduce((s, b) => s + b.cost, 0);

  return {
    blocks,
    totalCost,
    totalBlocks: blocks.length,
  };
}
