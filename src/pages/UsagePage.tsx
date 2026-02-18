import { useMemo, useState } from "react";
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
  Legend,
} from "recharts";
import { useDaily, useMonthly } from "../api/hooks";
import ChartContainer from "../components/shared/ChartContainer";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDate } from "../utils/format";
import { CHART_COLORS, getProjectColor } from "../utils/colors";

type ViewMode = "daily" | "monthly";

export default function UsagePage() {
  const daily = useDaily();
  const monthly = useMonthly();
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // Get all unique projects
  const allProjects = useMemo(() => {
    if (!daily.data) return [];
    const projects = new Map<string, string>();
    for (const d of daily.data) {
      projects.set(d.projectShort, d.project);
    }
    return Array.from(projects.entries()).map(([short, full]) => ({ short, full }));
  }, [daily.data]);

  // Build stacked daily data (each project is a key)
  const dailyStacked = useMemo(() => {
    if (!daily.data) return [];

    const filtered = selectedProjects.size > 0
      ? daily.data.filter((d) => selectedProjects.has(d.projectShort))
      : daily.data;

    const dateMap = new Map<string, Record<string, number>>();
    for (const d of filtered) {
      const existing = dateMap.get(d.date) || {};
      existing[d.projectShort] = (existing[d.projectShort] || 0) + d.cost;
      dateMap.set(d.date, existing);
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costs]) => ({ date, ...costs }));
  }, [daily.data, selectedProjects]);

  // Monthly stacked data
  const monthlyStacked = useMemo(() => {
    if (!monthly.data) return [];

    const filtered = selectedProjects.size > 0
      ? monthly.data.filter((d) => d.projectShort && selectedProjects.has(d.projectShort))
      : monthly.data;

    const monthMap = new Map<string, Record<string, number>>();
    for (const d of filtered) {
      const key = d.yearMonth;
      const existing = monthMap.get(key) || {};
      const project = d.projectShort || "aggregate";
      existing[project] = (existing[project] || 0) + d.cost;
      monthMap.set(key, existing);
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, costs]) => ({ yearMonth, ...costs }));
  }, [monthly.data, selectedProjects]);

  // Token breakdown by type (daily aggregated)
  const tokenBreakdown = useMemo(() => {
    if (!daily.data) return [];

    const filtered = selectedProjects.size > 0
      ? daily.data.filter((d) => selectedProjects.has(d.projectShort))
      : daily.data;

    const dateMap = new Map<
      string,
      { input: number; output: number; cacheCreation: number; cacheRead: number }
    >();

    for (const d of filtered) {
      const existing = dateMap.get(d.date) || { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
      existing.input += d.inputTokens;
      existing.output += d.outputTokens;
      existing.cacheCreation += d.cacheCreationTokens;
      existing.cacheRead += d.cacheReadTokens;
      dateMap.set(d.date, existing);
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tokens]) => ({ date, ...tokens }));
  }, [daily.data, selectedProjects]);

  // Active projects for stacked charts
  const activeProjectNames = useMemo(() => {
    const data = viewMode === "daily" ? dailyStacked : monthlyStacked;
    if (data.length === 0) return [];
    const keys = new Set<string>();
    for (const row of data) {
      for (const key of Object.keys(row)) {
        if (key !== "date" && key !== "yearMonth") keys.add(key);
      }
    }
    return Array.from(keys);
  }, [viewMode, dailyStacked, monthlyStacked]);

  function toggleProject(projectShort: string) {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectShort)) {
        next.delete(projectShort);
      } else {
        next.add(projectShort);
      }
      return next;
    });
  }

  if (daily.isLoading) return <LoadingSkeleton cards={0} rows={8} />;
  if (daily.error) return <ErrorDisplay error={daily.error} onRetry={() => daily.refetch()} />;

  const chartData = viewMode === "daily" ? dailyStacked : monthlyStacked;
  const xKey = viewMode === "daily" ? "date" : "yearMonth";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Usage</h2>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
          {(["daily", "monthly"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? "bg-primary/20 text-primary-light"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Project filter chips */}
      <div className="flex flex-wrap gap-2">
        {allProjects.map(({ short }, i) => (
          <button
            key={short}
            onClick={() => toggleProject(short)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              selectedProjects.has(short) || selectedProjects.size === 0
                ? "border-primary/50 text-text-primary"
                : "border-border text-text-muted opacity-50"
            }`}
            style={{
              backgroundColor:
                selectedProjects.has(short) || selectedProjects.size === 0
                  ? `${getProjectColor(i)}20`
                  : undefined,
            }}
          >
            {short}
          </button>
        ))}
        {selectedProjects.size > 0 && (
          <button
            onClick={() => setSelectedProjects(new Set())}
            className="px-3 py-1 text-xs rounded-full border border-border text-text-muted hover:text-text-primary"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Stacked cost chart */}
      <ChartContainer
        title={`Cost by Project (${viewMode})`}
        subtitle={selectedProjects.size > 0 ? `Filtered to ${selectedProjects.size} projects` : "All projects"}
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey={xKey}
              tickFormatter={viewMode === "daily" ? formatDate : (v) => v}
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
                fontSize: "12px",
                maxHeight: "300px",
                overflow: "auto",
              }}
              formatter={(value: number) => formatCost(value)}
              labelFormatter={(label) => (viewMode === "daily" ? `Date: ${label}` : `Month: ${label}`)}
            />
            <Legend />
            {activeProjectNames.map((name, i) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="1"
                stroke={getProjectColor(i)}
                fill={getProjectColor(i)}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Token breakdown */}
      <ChartContainer title="Token Breakdown" subtitle="Daily token consumption by type">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={tokenBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: "#71717a", fontSize: 12 }}
              stroke="#27272a"
            />
            <YAxis
              tickFormatter={(v) => formatTokens(v)}
              tick={{ fill: "#71717a", fontSize: 12 }}
              stroke="#27272a"
              width={70}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              formatter={(value: number) => formatTokens(value)}
            />
            <Legend />
            <Bar dataKey="input" name="Input" fill="#3b82f6" stackId="1" />
            <Bar dataKey="output" name="Output" fill="#10b981" stackId="1" />
            <Bar dataKey="cacheCreation" name="Cache Write" fill="#f59e0b" stackId="1" />
            <Bar dataKey="cacheRead" name="Cache Read" fill="#8b5cf6" stackId="1" />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
