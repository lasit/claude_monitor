import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { useBlocks } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import ChartContainer from "../components/shared/ChartContainer";
import DataTable from "../components/shared/DataTable";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDateTime } from "../utils/format";

export default function BlocksPage() {
  const blocks = useBlocks();

  const stats = useMemo(() => {
    if (!blocks.data) return null;

    const activeBlock = blocks.data.blocks.find((b) => b.isActive);
    const avgCost =
      blocks.data.blocks.length > 0
        ? blocks.data.blocks.reduce((s, b) => s + b.cost, 0) / blocks.data.blocks.length
        : 0;

    // Use ccusage-provided burn rate or compute from elapsed time
    let burnRate = 0;
    let projectedCost = 0;
    if (activeBlock) {
      if (activeBlock.burnRate) {
        burnRate = activeBlock.burnRate.costPerHour;
        projectedCost = activeBlock.projection?.totalCost ?? burnRate * 5;
      } else {
        const elapsed = (Date.now() - new Date(activeBlock.startTime).getTime()) / 3600000;
        burnRate = elapsed > 0 ? activeBlock.cost / elapsed : 0;
        projectedCost = burnRate * 5;
      }
    }

    return {
      totalCost: blocks.data.totalCost,
      totalBlocks: blocks.data.totalBlocks,
      activeBlock,
      avgCost,
      burnRate,
      projectedCost,
    };
  }, [blocks.data]);

  // Timeline data (last N blocks)
  const timelineData = useMemo(() => {
    if (!blocks.data) return [];
    return blocks.data.blocks
      .slice(-30) // last 30 blocks
      .map((b) => ({
        ...b,
        label: `#${b.blockNumber}`,
        startLabel: formatDateTime(b.startTime),
      }));
  }, [blocks.data]);

  if (blocks.isLoading) return <LoadingSkeleton cards={4} rows={6} />;
  if (blocks.error) return <ErrorDisplay error={blocks.error} onRetry={() => blocks.refetch()} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Billing Blocks</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Blocks" value={String(stats.totalBlocks)} />
        <StatCard label="Total Cost" value={formatCost(stats.totalCost)} />
        <StatCard label="Avg Block Cost" value={formatCost(stats.avgCost)} />
        <StatCard
          label="Active Block"
          value={stats.activeBlock ? formatCost(stats.activeBlock.cost) : "None"}
          subtitle={
            stats.activeBlock
              ? `Block #${stats.activeBlock.blockNumber}`
              : undefined
          }
        />
      </div>

      {/* Active block burn rate */}
      {stats.activeBlock && (
        <div className="bg-surface border border-primary/30 rounded-xl p-5">
          <h3 className="text-sm font-medium text-primary-light mb-3">Active Block #{stats.activeBlock.blockNumber}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-muted text-xs">Current Cost</p>
              <p className="text-text-primary font-medium">{formatCost(stats.activeBlock.cost)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Burn Rate</p>
              <p className="text-text-primary font-medium">{formatCost(stats.burnRate)}/hr</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Projected (5h)</p>
              <p className="text-warning font-medium">{formatCost(stats.projectedCost)}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Started</p>
              <p className="text-text-primary font-medium">{formatDateTime(stats.activeBlock.startTime)}</p>
            </div>
          </div>

          {/* Time progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1">
              <span>Elapsed</span>
              <span>
                {(() => {
                  const elapsed = (Date.now() - new Date(stats.activeBlock.startTime).getTime()) / 3600000;
                  return `${elapsed.toFixed(1)}h / 5h`;
                })()}
              </span>
            </div>
            <div className="w-full bg-surface-alt rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((Date.now() - new Date(stats.activeBlock.startTime).getTime()) / (5 * 3600000)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Token limit status */}
          {stats.activeBlock.tokenLimitStatus && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Token Usage</span>
                <span>
                  {formatTokens(stats.activeBlock.tokenLimitStatus.projectedUsage)} / {formatTokens(stats.activeBlock.tokenLimitStatus.limit)}
                  {" "}({stats.activeBlock.tokenLimitStatus.percentUsed.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-surface-alt rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    stats.activeBlock.tokenLimitStatus.status === "exceeds"
                      ? "bg-danger"
                      : stats.activeBlock.tokenLimitStatus.status === "warning"
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                  style={{
                    width: `${Math.min(100, stats.activeBlock.tokenLimitStatus.percentUsed)}%`,
                  }}
                />
              </div>
              {stats.activeBlock.tokenLimitStatus.status !== "ok" && (
                <p className={`text-xs mt-1 ${
                  stats.activeBlock.tokenLimitStatus.status === "exceeds" ? "text-danger" : "text-warning"
                }`}>
                  {stats.activeBlock.tokenLimitStatus.status === "exceeds"
                    ? "Projected usage exceeds token limit"
                    : "Approaching token limit"}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Block timeline */}
      <ChartContainer title="Block Cost Timeline" subtitle="Cost per 5-hour billing window">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11 }}
              stroke="#27272a"
            />
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
              labelFormatter={(label) => `Block ${label}`}
            />
            <ReferenceLine y={stats.avgCost} stroke="#f59e0b" strokeDasharray="3 3" label="" />
            <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
              {timelineData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isActive ? "#f59e0b" : "#3b82f6"}
                  fillOpacity={entry.isActive ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Blocks table */}
      <DataTable
        data={blocks.data?.blocks || []}
        defaultSort="blockNumber"
        pageSize={20}
        columns={[
          {
            key: "blockNumber",
            header: "#",
            render: (r) => (
              <span className={r.isActive ? "text-primary-light font-medium" : ""}>
                {r.blockNumber}
                {r.isActive && " (active)"}
              </span>
            ),
            sortValue: (r) => r.blockNumber,
          },
          {
            key: "cost",
            header: "Cost",
            align: "right",
            render: (r) => <span className="font-medium text-warning">{formatCost(r.cost)}</span>,
            sortValue: (r) => r.cost,
          },
          {
            key: "tokens",
            header: "Tokens",
            align: "right",
            render: (r) => formatTokens(r.inputTokens + r.outputTokens),
            sortValue: (r) => r.inputTokens + r.outputTokens,
          },
          {
            key: "startTime",
            header: "Start",
            render: (r) => <span className="text-xs text-text-muted">{formatDateTime(r.startTime)}</span>,
            sortValue: (r) => r.startTime,
          },
          {
            key: "endTime",
            header: "End",
            render: (r) => <span className="text-xs text-text-muted">{formatDateTime(r.endTime)}</span>,
            sortValue: (r) => r.endTime,
          },
          {
            key: "tokenLimit",
            header: "Token Limit",
            align: "right",
            render: (r) =>
              r.tokenLimitStatus ? (
                <span
                  className={`text-xs font-medium ${
                    r.tokenLimitStatus.status === "exceeds"
                      ? "text-danger"
                      : r.tokenLimitStatus.status === "warning"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {r.tokenLimitStatus.percentUsed.toFixed(1)}%
                </span>
              ) : (
                <span className="text-xs text-text-muted">--</span>
              ),
            sortValue: (r) => r.tokenLimitStatus?.percentUsed ?? -1,
          },
        ]}
      />
    </div>
  );
}
