import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useBlocks, useDaily, useMeta } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import ChartContainer from "../components/shared/ChartContainer";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDateTime, formatDuration } from "../utils/format";

export default function LivePage() {
  const blocks = useBlocks();
  const daily = useDaily();
  const meta = useMeta();

  const activeBlock = blocks.data?.blocks.find((b) => b.isActive);

  // Recent blocks for mini-timeline
  const recentBlocks = useMemo(() => {
    if (!blocks.data) return [];
    return blocks.data.blocks.slice(-10).map((b) => ({
      label: `#${b.blockNumber}`,
      cost: b.cost,
      isActive: b.isActive,
    }));
  }, [blocks.data]);

  // Today's running cost
  const todayStats = useMemo(() => {
    if (!daily.data) return { cost: 0, sessions: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const todayData = daily.data.filter((d) => d.date === today);
    return {
      cost: todayData.reduce((s, d) => s + d.cost, 0),
      sessions: todayData.length,
    };
  }, [daily.data]);

  // Cache status summary
  const cacheStatus = useMemo(() => {
    if (!meta.data) return null;
    const fresh = meta.data.caches.filter((c) => !c.isStale).length;
    const refreshing = meta.data.caches.filter((c) => c.isRefreshing).length;
    const uptime = meta.data.uptime;
    return { fresh, total: meta.data.caches.length, refreshing, uptime };
  }, [meta.data]);

  if (blocks.isLoading && daily.isLoading) return <LoadingSkeleton cards={4} rows={4} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Live Monitor</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-muted">Auto-refreshing</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Block"
          value={activeBlock ? `#${activeBlock.blockNumber}` : "None"}
          subtitle={activeBlock ? formatCost(activeBlock.cost) : undefined}
        />
        <StatCard label="Today's Spend" value={formatCost(todayStats.cost)} />
        <StatCard
          label="Burn Rate"
          value={
            activeBlock
              ? activeBlock.burnRate
                ? `${formatCost(activeBlock.burnRate.costPerHour)}/hr`
                : (() => {
                    const elapsed = (Date.now() - new Date(activeBlock.startTime).getTime()) / 3600000;
                    return elapsed > 0 ? `${formatCost(activeBlock.cost / elapsed)}/hr` : "$0/hr";
                  })()
              : "N/A"
          }
        />
        <StatCard
          label="Cache Status"
          value={cacheStatus ? `${cacheStatus.fresh}/${cacheStatus.total} fresh` : "Loading..."}
          subtitle={cacheStatus ? `Server uptime: ${formatDuration(cacheStatus.uptime / 60000)}` : undefined}
        />
      </div>

      {/* Active block detail */}
      {activeBlock && (
        <div className="bg-surface border border-primary/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-primary-light">
              Active Block #{activeBlock.blockNumber}
            </h3>
            <span className="text-xs text-text-muted">
              Started {formatDateTime(activeBlock.startTime)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Time elapsed</span>
              <span>
                {(() => {
                  const elapsed = (Date.now() - new Date(activeBlock.startTime).getTime()) / 3600000;
                  const remaining = Math.max(0, 5 - elapsed);
                  return `${elapsed.toFixed(1)}h elapsed, ${remaining.toFixed(1)}h remaining`;
                })()}
              </span>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-dim to-primary h-3 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, ((Date.now() - new Date(activeBlock.startTime).getTime()) / (5 * 3600000)) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Cost</p>
              <p className="text-xl font-semibold text-warning">{formatCost(activeBlock.cost)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Input Tokens</p>
              <p className="text-lg font-medium text-text-primary">{formatTokens(activeBlock.inputTokens)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Output Tokens</p>
              <p className="text-lg font-medium text-text-primary">{formatTokens(activeBlock.outputTokens)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent blocks mini chart */}
      <ChartContainer title="Recent Blocks" subtitle="Last 10 billing windows">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={recentBlocks}>
            <defs>
              <linearGradient id="liveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 12 }} stroke="#27272a" />
            <YAxis
              tickFormatter={(v) => `$${v}`}
              tick={{ fill: "#71717a", fontSize: 12 }}
              stroke="#27272a"
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number) => [formatCost(value), "Cost"]}
            />
            <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} fill="url(#liveGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Cache status details */}
      {meta.data && (
        <ChartContainer title="Cache Status" subtitle="Server-side data cache">
          <div className="space-y-2">
            {meta.data.caches.map((c) => (
              <div
                key={c.endpoint}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-alt/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      c.isRefreshing
                        ? "bg-primary animate-pulse"
                        : c.isStale
                        ? "bg-warning"
                        : "bg-success"
                    }`}
                  />
                  <span className="text-sm text-text-primary font-mono">{c.endpoint}</span>
                </div>
                <div className="text-xs text-text-muted">
                  {c.cachedAt
                    ? `${new Date(c.cachedAt).toLocaleTimeString("en-AU")} (TTL: ${(c.ttlMs / 1000).toFixed(0)}s)`
                    : "Not cached"}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
