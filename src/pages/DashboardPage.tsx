import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDaily, useBlocks, useSessions } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import ChartContainer from "../components/shared/ChartContainer";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDate } from "../utils/format";
import { CHART_COLORS, getProjectColor, getModelColor, getModelShortName } from "../utils/colors";

export default function DashboardPage() {
  const daily = useDaily();
  const blocks = useBlocks();
  const sessions = useSessions();

  const stats = useMemo(() => {
    if (!daily.data) return null;

    const totalCost = daily.data.reduce((s, d) => s + d.cost, 0);
    const totalInput = daily.data.reduce((s, d) => s + d.inputTokens, 0);
    const totalOutput = daily.data.reduce((s, d) => s + d.outputTokens, 0);
    const projects = new Set(daily.data.map((d) => d.projectShort));

    // Today's cost
    const today = new Date().toISOString().slice(0, 10);
    const todayCost = daily.data.filter((d) => d.date === today).reduce((s, d) => s + d.cost, 0);

    return { totalCost, totalInput, totalOutput, projectCount: projects.size, todayCost };
  }, [daily.data]);

  // Daily cost over time (aggregated across projects)
  const dailyCostData = useMemo(() => {
    if (!daily.data) return [];

    const byDate = new Map<string, number>();
    for (const d of daily.data) {
      byDate.set(d.date, (byDate.get(d.date) || 0) + d.cost);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost }));
  }, [daily.data]);

  // Top projects by cost
  const projectCosts = useMemo(() => {
    if (!daily.data) return [];

    const byProject = new Map<string, number>();
    for (const d of daily.data) {
      byProject.set(d.projectShort, (byProject.get(d.projectShort) || 0) + d.cost);
    }

    return Array.from(byProject.entries())
      .map(([project, cost]) => ({ project, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 8);
  }, [daily.data]);

  // Model breakdown
  const modelBreakdown = useMemo(() => {
    if (!daily.data) return [];

    const byModel = new Map<string, number>();
    for (const d of daily.data) {
      const name = getModelShortName(d.model);
      byModel.set(name, (byModel.get(name) || 0) + d.cost);
    }

    return Array.from(byModel.entries())
      .map(([model, cost]) => ({ model, cost }))
      .sort((a, b) => b.cost - a.cost);
  }, [daily.data]);

  if (daily.isLoading) return <LoadingSkeleton cards={4} rows={6} />;
  if (daily.error) return <ErrorDisplay error={daily.error} onRetry={() => daily.refetch()} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Dashboard</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Spend" value={formatCost(stats.totalCost)} />
        <StatCard label="Today" value={formatCost(stats.todayCost)} />
        <StatCard label="Projects" value={String(stats.projectCount)} />
        <StatCard
          label="Active Block"
          value={
            blocks.data?.blocks.find((b) => b.isActive)
              ? formatCost(blocks.data.blocks.find((b) => b.isActive)!.cost)
              : "None"
          }
          subtitle={
            blocks.data?.blocks.find((b) => b.isActive)
              ? `Block #${blocks.data.blocks.find((b) => b.isActive)!.blockNumber}`
              : undefined
          }
        />
      </div>

      {/* Cost Over Time chart */}
      <ChartContainer title="Cost Over Time" subtitle="Daily aggregate spend">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyCostData}>
            <defs>
              <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#71717a", fontSize: 12 }}
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
              labelFormatter={(label) => `Date: ${label}`}
              formatter={(value: number) => [formatCost(value), "Cost"]}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#costGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Projects */}
        <ChartContainer title="Top Projects" subtitle="By total cost">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectCosts} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `$${v}`}
                tick={{ fill: "#71717a", fontSize: 12 }}
                stroke="#27272a"
              />
              <YAxis
                type="category"
                dataKey="project"
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                stroke="#27272a"
                width={120}
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
              <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                {projectCosts.map((_, i) => (
                  <Cell key={i} fill={getProjectColor(i)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Model Breakdown */}
        <ChartContainer title="Model Breakdown" subtitle="Cost by model">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelBreakdown}
                dataKey="cost"
                nameKey="model"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                label={({ model, percent }) => `${model} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#52525b" }}
              >
                {modelBreakdown.map((entry, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
                formatter={(value: number) => [formatCost(value), "Cost"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Most Expensive Projects */}
      {sessions.data && (
        <ChartContainer title="Most Expensive Projects" subtitle="Top 5 by total cost">
          <div className="space-y-2">
            {[...sessions.data]
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 5)
              .map((s) => (
                <div
                  key={s.sessionId}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-alt/50 hover:bg-surface-alt transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {s.projectShort}
                    </p>
                    <p className="text-xs text-text-muted">
                      Last active: {s.lastActivity} &middot; {s.models.length} model{s.models.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-warning ml-4 shrink-0">
                    {formatCost(s.cost)}
                  </span>
                </div>
              ))}
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
