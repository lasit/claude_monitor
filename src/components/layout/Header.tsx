import { useMeta, useRefresh } from "../../api/hooks";

export default function Header() {
  const { data: meta } = useMeta();
  const refresh = useRefresh();

  const latestRefresh = meta?.caches
    .filter((c) => c.cachedAt)
    .sort((a, b) => new Date(b.cachedAt!).getTime() - new Date(a.cachedAt!).getTime())[0];

  const anyRefreshing = meta?.caches.some((c) => c.isRefreshing);

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        {anyRefreshing && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Refreshing...
          </div>
        )}
        {latestRefresh && !anyRefreshing && (
          <span className="text-xs text-text-muted">
            Last update:{" "}
            {new Date(latestRefresh.cachedAt!).toLocaleTimeString("en-AU", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>

      <button
        onClick={() => refresh.mutate(undefined)}
        disabled={refresh.isPending || anyRefreshing}
        className="px-3 py-1.5 text-xs font-medium rounded-md bg-surface-alt text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border"
      >
        Refresh All
      </button>
    </header>
  );
}
