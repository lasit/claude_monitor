interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="bg-surface border border-danger/30 rounded-xl p-6 text-center">
      <p className="text-danger font-medium mb-1">Failed to load data</p>
      <p className="text-sm text-text-muted mb-4">{error.message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm rounded-lg bg-surface-alt hover:bg-surface-hover text-text-primary transition-colors border border-border"
        >
          Retry
        </button>
      )}
    </div>
  );
}
