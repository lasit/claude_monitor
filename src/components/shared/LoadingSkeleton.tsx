export default function LoadingSkeleton({ rows = 4, cards = 0 }: { rows?: number; cards?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      {cards > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 h-24" />
          ))}
        </div>
      )}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="h-4 w-32 bg-surface-alt rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-3 bg-surface-alt rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
