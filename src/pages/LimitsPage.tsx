import { usePlanUsage } from "../api/hooks";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorDisplay from "../components/shared/ErrorDisplay";
import { formatCost, formatTimeUntil, formatResetDateTime } from "../utils/format";
import type { UsageLimitWindow, ExtraUsageInfo } from "../types";

function barColor(utilization: number): string {
  if (utilization >= 90) return "bg-danger";
  if (utilization >= 70) return "bg-warning";
  return "bg-success";
}

function UsageRow({ label, window }: { label: string; window: UsageLimitWindow }) {
  const pct = Math.min(100, window.utilization);
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-alt/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm text-text-secondary">{window.utilization.toFixed(1)}% used</span>
      </div>
      <div className="w-full bg-surface-alt rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor(window.utilization)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-text-muted">
        Resets {formatTimeUntil(window.resets_at)} — {formatResetDateTime(window.resets_at)}
      </div>
    </div>
  );
}

function ExtraUsageRow({ extra }: { extra: ExtraUsageInfo }) {
  const pct = Math.min(100, extra.utilization);
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-surface-alt/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Extra Usage</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          extra.is_enabled
            ? "bg-success/20 text-success"
            : "bg-surface-alt text-text-muted"
        }`}>
          {extra.is_enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{formatCost(extra.used_credits)} spent of {formatCost(extra.monthly_limit)} limit</span>
        <span>{extra.utilization.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-surface-alt rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor(extra.utilization)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LimitsPage() {
  const { data, isLoading, error, refetch } = usePlanUsage();

  if (isLoading) return <LoadingSkeleton cards={0} rows={5} />;
  if (error) return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const windows: { label: string; window: UsageLimitWindow }[] = [];
  if (data.five_hour) windows.push({ label: "Current session (5-hour)", window: data.five_hour });
  if (data.seven_day) windows.push({ label: "Weekly — all models", window: data.seven_day });
  if (data.seven_day_sonnet) windows.push({ label: "Weekly — Sonnet only", window: data.seven_day_sonnet });
  if (data.seven_day_opus) windows.push({ label: "Weekly — Opus only", window: data.seven_day_opus });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Plan Usage Limits</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-text-muted">Auto-refreshing</span>
        </div>
      </div>

      {windows.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Rate Limits</h3>
          <div className="space-y-3">
            {windows.map((w) => (
              <UsageRow key={w.label} label={w.label} window={w.window} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-6 text-center">
          <p className="text-sm text-text-muted">No active usage windows</p>
        </div>
      )}

      {data.extra_usage && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Extra Usage</h3>
          <ExtraUsageRow extra={data.extra_usage} />
        </div>
      )}
    </div>
  );
}
