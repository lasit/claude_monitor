import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useDaily } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import ChartContainer from "../components/shared/ChartContainer";
import DataTable from "../components/shared/DataTable";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDate } from "../utils/format";
import { getProjectColor, CHART_COLORS } from "../utils/colors";
import { projectNameToPath } from "../utils/project-names";

export default function ProjectsPage() {
  const daily = useDaily();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const projectStats = useMemo(() => {
    if (!daily.data) return [];

    const map = new Map<
      string,
      {
        project: string;
        projectShort: string;
        cost: number;
        inputTokens: number;
        outputTokens: number;
        days: Set<string>;
      }
    >();

    for (const d of daily.data) {
      const existing = map.get(d.project);
      if (existing) {
        existing.cost += d.cost;
        existing.inputTokens += d.inputTokens;
        existing.outputTokens += d.outputTokens;
        existing.days.add(d.date);
      } else {
        map.set(d.project, {
          project: d.project,
          projectShort: d.projectShort,
          cost: d.cost,
          inputTokens: d.inputTokens,
          outputTokens: d.outputTokens,
          days: new Set([d.date]),
        });
      }
    }

    return Array.from(map.values())
      .map((p) => ({ ...p, activeDays: p.days.size }))
      .sort((a, b) => b.cost - a.cost);
  }, [daily.data]);

  // Daily cost for selected project
  const projectDailyCost = useMemo(() => {
    if (!daily.data || !selectedProject) return [];

    const filtered = daily.data.filter((d) => d.project === selectedProject);
    const byDate = new Map<string, number>();
    for (const d of filtered) {
      byDate.set(d.date, (byDate.get(d.date) || 0) + d.cost);
    }

    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost }));
  }, [daily.data, selectedProject]);

  if (daily.isLoading) return <LoadingSkeleton cards={3} rows={8} />;
  if (daily.error) return <ErrorDisplay error={daily.error} onRetry={() => daily.refetch()} />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Projects</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Projects" value={String(projectStats.length)} />
        <StatCard
          label="Most Expensive"
          value={projectStats[0]?.projectShort || "N/A"}
          subtitle={projectStats[0] ? formatCost(projectStats[0].cost) : undefined}
        />
        <StatCard
          label="Total Spend"
          value={formatCost(projectStats.reduce((s, p) => s + p.cost, 0))}
        />
      </div>

      {/* Project bar chart */}
      <ChartContainer title="Cost by Project">
        <ResponsiveContainer width="100%" height={Math.max(300, projectStats.length * 40)}>
          <BarChart data={projectStats} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => `$${v}`}
              tick={{ fill: "#71717a", fontSize: 12 }}
              stroke="#27272a"
            />
            <YAxis
              type="category"
              dataKey="projectShort"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              stroke="#27272a"
              width={140}
              onClick={(e: any) => {
                const project = projectStats.find((p) => p.projectShort === e.value);
                if (project) setSelectedProject(project.project);
              }}
              style={{ cursor: "pointer" }}
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
            <Bar
              dataKey="cost"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(data: any) => setSelectedProject(data.project)}
            >
              {projectStats.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.project === selectedProject ? "#f59e0b" : getProjectColor(i)}
                  fillOpacity={selectedProject && entry.project !== selectedProject ? 0.4 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Project daily breakdown when selected */}
      {selectedProject && projectDailyCost.length > 0 && (
        <ChartContainer
          title={`Daily Cost: ${projectStats.find((p) => p.project === selectedProject)?.projectShort}`}
          action={
            <button
              onClick={() => setSelectedProject(null)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Clear
            </button>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={projectDailyCost}>
              <defs>
                <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: "#71717a", fontSize: 12 }} stroke="#27272a" />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fill: "#71717a", fontSize: 12 }} stroke="#27272a" width={60} />
              <Tooltip
                contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "13px" }}
                formatter={(value: number) => [formatCost(value), "Cost"]}
              />
              <Area type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} fill="url(#projGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {/* Project table */}
      <DataTable
        data={projectStats}
        defaultSort="cost"
        columns={[
          {
            key: "project",
            header: "Project",
            render: (r) => (
              <span
                className="cursor-pointer hover:text-primary-light transition-colors"
                title={projectNameToPath(r.project)}
                onClick={() => setSelectedProject(r.project)}
              >
                {r.projectShort}
              </span>
            ),
            sortValue: (r) => r.projectShort,
          },
          {
            key: "cost",
            header: "Cost",
            align: "right",
            render: (r) => <span className="font-medium text-warning">{formatCost(r.cost)}</span>,
            sortValue: (r) => r.cost,
          },
          {
            key: "inputTokens",
            header: "Input Tokens",
            align: "right",
            render: (r) => formatTokens(r.inputTokens),
            sortValue: (r) => r.inputTokens,
          },
          {
            key: "outputTokens",
            header: "Output Tokens",
            align: "right",
            render: (r) => formatTokens(r.outputTokens),
            sortValue: (r) => r.outputTokens,
          },
          {
            key: "activeDays",
            header: "Active Days",
            align: "right",
            render: (r) => r.activeDays,
            sortValue: (r) => r.activeDays,
          },
        ]}
      />
    </div>
  );
}
