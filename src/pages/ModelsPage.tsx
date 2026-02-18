import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useDaily } from "../api/hooks";
import StatCard from "../components/shared/StatCard";
import ChartContainer from "../components/shared/ChartContainer";
import DataTable from "../components/shared/DataTable";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTokens, formatDate, formatPct } from "../utils/format";
import { CHART_COLORS, getModelShortName } from "../utils/colors";

export default function ModelsPage() {
  const daily = useDaily();

  // Aggregate by model
  const modelStats = useMemo(() => {
    if (!daily.data) return [];

    const map = new Map<
      string,
      {
        model: string;
        modelShort: string;
        cost: number;
        inputTokens: number;
        outputTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
      }
    >();

    for (const d of daily.data) {
      const shortName = getModelShortName(d.model);
      const existing = map.get(shortName);
      if (existing) {
        existing.cost += d.cost;
        existing.inputTokens += d.inputTokens;
        existing.outputTokens += d.outputTokens;
        existing.cacheCreationTokens += d.cacheCreationTokens;
        existing.cacheReadTokens += d.cacheReadTokens;
      } else {
        map.set(shortName, {
          model: d.model,
          modelShort: shortName,
          cost: d.cost,
          inputTokens: d.inputTokens,
          outputTokens: d.outputTokens,
          cacheCreationTokens: d.cacheCreationTokens,
          cacheReadTokens: d.cacheReadTokens,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
  }, [daily.data]);

  const totalCost = modelStats.reduce((s, m) => s + m.cost, 0);

  // Cost over time by model
  const modelTimeSeries = useMemo(() => {
    if (!daily.data) return [];

    const dateMap = new Map<string, Record<string, number>>();
    for (const d of daily.data) {
      const shortName = getModelShortName(d.model);
      const existing = dateMap.get(d.date) || {};
      existing[shortName] = (existing[shortName] || 0) + d.cost;
      dateMap.set(d.date, existing);
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, costs]) => ({ date, ...costs }));
  }, [daily.data]);

  const modelNames = modelStats.map((m) => m.modelShort);

  if (daily.isLoading) return <LoadingSkeleton cards={3} rows={6} />;
  if (daily.error) return <ErrorDisplay error={daily.error} onRetry={() => daily.refetch()} />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-text-primary">Models</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Models Used" value={String(modelStats.length)} />
        <StatCard
          label="Most Used"
          value={modelStats[0]?.modelShort || "N/A"}
          subtitle={modelStats[0] ? `${formatPct(modelStats[0].cost, totalCost)} of spend` : undefined}
        />
        <StatCard label="Total Spend" value={formatCost(totalCost)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost donut */}
        <ChartContainer title="Cost by Model">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelStats}
                dataKey="cost"
                nameKey="modelShort"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                label={({ modelShort, percent }) => `${modelShort} ${(percent * 100).toFixed(0)}%`}
                labelLine={{ stroke: "#52525b" }}
              >
                {modelStats.map((_, i) => (
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

        {/* Token donut */}
        <ChartContainer title="Tokens by Model">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelStats}
                dataKey="outputTokens"
                nameKey="modelShort"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                label={({ modelShort }) => modelShort}
                labelLine={{ stroke: "#52525b" }}
              >
                {modelStats.map((_, i) => (
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
                formatter={(value: number) => [formatTokens(value), "Output Tokens"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Model cost over time */}
      <ChartContainer title="Cost Over Time by Model">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={modelTimeSeries}>
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
              formatter={(value: number) => formatCost(value)}
            />
            <Legend />
            {modelNames.map((name, i) => (
              <Area
                key={name}
                type="monotone"
                dataKey={name}
                stackId="1"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Model stats table */}
      <DataTable
        data={modelStats}
        defaultSort="cost"
        columns={[
          {
            key: "model",
            header: "Model",
            render: (r) => (
              <span title={r.model} className="font-medium text-text-primary">
                {r.modelShort}
              </span>
            ),
            sortValue: (r) => r.modelShort,
          },
          {
            key: "cost",
            header: "Cost",
            align: "right",
            render: (r) => <span className="text-warning">{formatCost(r.cost)}</span>,
            sortValue: (r) => r.cost,
          },
          {
            key: "pct",
            header: "Share",
            align: "right",
            render: (r) => formatPct(r.cost, totalCost),
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
        ]}
      />
    </div>
  );
}
