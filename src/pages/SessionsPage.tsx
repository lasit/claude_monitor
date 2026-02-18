import { useMemo, useState } from "react";
import { useSessions } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import DataTable from "../components/shared/DataTable";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens } from "../utils/format";
import { getModelShortName } from "../utils/colors";

export default function SessionsPage() {
  const sessions = useSessions();
  const [filter, setFilter] = useState("");
  const [groupByProject, setGroupByProject] = useState(false);

  const stats = useMemo(() => {
    if (!sessions.data) return null;
    const total = sessions.data.length;
    const totalCost = sessions.data.reduce((s, d) => s + d.cost, 0);
    const avgCost = total > 0 ? totalCost / total : 0;
    const projects = new Set(sessions.data.map((s) => s.project));
    return { total, totalCost, avgCost, projectCount: projects.size };
  }, [sessions.data]);

  // Grouped by project view
  const projectGroups = useMemo(() => {
    if (!sessions.data) return [];
    const map = new Map<string, { project: string; projectShort: string; cost: number; sessions: number; lastActivity: string; models: Set<string> }>();
    for (const s of sessions.data) {
      const existing = map.get(s.project);
      if (existing) {
        existing.cost += s.cost;
        existing.sessions += 1;
        if (s.lastActivity > existing.lastActivity) existing.lastActivity = s.lastActivity;
        s.models.forEach((m) => existing.models.add(m));
      } else {
        map.set(s.project, {
          project: s.project,
          projectShort: s.projectShort,
          cost: s.cost,
          sessions: 1,
          lastActivity: s.lastActivity,
          models: new Set(s.models),
        });
      }
    }
    return Array.from(map.values())
      .map((g) => ({ ...g, models: Array.from(g.models) }))
      .sort((a, b) => b.cost - a.cost);
  }, [sessions.data]);

  const filtered = useMemo(() => {
    if (!sessions.data) return [];
    if (!filter) return sessions.data;
    const lf = filter.toLowerCase();
    return sessions.data.filter(
      (s) =>
        s.projectShort.toLowerCase().includes(lf) ||
        s.project.toLowerCase().includes(lf) ||
        s.models.some((m) => m.toLowerCase().includes(lf))
    );
  }, [sessions.data, filter]);

  if (sessions.isLoading) return <LoadingSkeleton cards={4} rows={10} />;
  if (sessions.error) return <ErrorDisplay error={sessions.error} onRetry={() => sessions.refetch()} />;
  if (!stats) return null;

  // Expensive threshold: > $20
  const expensiveThreshold = 20;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Sessions</h2>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-lg p-0.5">
          <button
            onClick={() => setGroupByProject(false)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              !groupByProject ? "bg-primary/20 text-primary-light" : "text-text-muted hover:text-text-primary"
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setGroupByProject(true)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              groupByProject ? "bg-primary/20 text-primary-light" : "text-text-muted hover:text-text-primary"
            }`}
          >
            By Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Sessions" value={String(stats.total)} />
        <StatCard label="Projects" value={String(stats.projectCount)} />
        <StatCard label="Total Cost" value={formatCost(stats.totalCost)} />
        <StatCard label="Avg Session Cost" value={formatCost(stats.avgCost)} />
      </div>

      {/* Search filter */}
      <div>
        <input
          type="text"
          placeholder="Filter by project or model..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
        />
      </div>

      {groupByProject ? (
        <DataTable
          data={projectGroups}
          defaultSort="cost"
          pageSize={20}
          columns={[
            {
              key: "project",
              header: "Project",
              render: (r) => (
                <span className="text-text-primary font-medium" title={r.project}>
                  {r.projectShort}
                </span>
              ),
              sortValue: (r) => r.projectShort,
            },
            {
              key: "sessions",
              header: "Sessions",
              align: "right",
              render: (r) => r.sessions,
              sortValue: (r) => r.sessions,
            },
            {
              key: "cost",
              header: "Cost",
              align: "right",
              render: (r) => (
                <span className={`font-medium ${r.cost >= expensiveThreshold ? "text-danger" : "text-warning"}`}>
                  {formatCost(r.cost)}
                </span>
              ),
              sortValue: (r) => r.cost,
            },
            {
              key: "models",
              header: "Models",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.models.filter((m) => !m.startsWith("<")).map((m) => (
                    <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">
                      {getModelShortName(m)}
                    </span>
                  ))}
                </div>
              ),
              sortValue: (r) => r.models.length,
            },
            {
              key: "lastActivity",
              header: "Last Active",
              render: (r) => <span className="text-xs text-text-muted">{r.lastActivity}</span>,
              sortValue: (r) => r.lastActivity,
            },
          ]}
        />
      ) : (
        <DataTable
          data={filtered}
          defaultSort="cost"
          pageSize={25}
          columns={[
            {
              key: "project",
              header: "Project",
              render: (r) => (
                <span className="text-text-primary" title={r.project}>
                  {r.projectShort}
                </span>
              ),
              sortValue: (r) => r.projectShort,
            },
            {
              key: "cost",
              header: "Cost",
              align: "right",
              render: (r) => (
                <span className={`font-medium ${r.cost >= expensiveThreshold ? "text-danger" : "text-warning"}`}>
                  {formatCost(r.cost)}
                </span>
              ),
              sortValue: (r) => r.cost,
            },
            {
              key: "inputTokens",
              header: "Input",
              align: "right",
              render: (r) => formatTokens(r.inputTokens),
              sortValue: (r) => r.inputTokens,
            },
            {
              key: "outputTokens",
              header: "Output",
              align: "right",
              render: (r) => formatTokens(r.outputTokens),
              sortValue: (r) => r.outputTokens,
            },
            {
              key: "cacheRead",
              header: "Cache Read",
              align: "right",
              render: (r) => formatTokens(r.cacheReadTokens),
              sortValue: (r) => r.cacheReadTokens,
            },
            {
              key: "models",
              header: "Models",
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.models.filter((m) => !m.startsWith("<")).map((m) => (
                    <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-surface-alt text-text-muted">
                      {getModelShortName(m)}
                    </span>
                  ))}
                </div>
              ),
              sortValue: (r) => r.models.length,
            },
            {
              key: "lastActivity",
              header: "Last Active",
              render: (r) => <span className="text-xs text-text-muted">{r.lastActivity}</span>,
              sortValue: (r) => r.lastActivity,
            },
          ]}
        />
      )}
    </div>
  );
}
