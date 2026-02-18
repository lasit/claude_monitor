interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: { value: string; positive: boolean };
}

export default function StatCard({ label, value, subtitle, trend }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-sm text-text-muted mb-1">{label}</p>
      <p className="text-2xl font-semibold text-text-primary tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      {trend && (
        <p
          className={`text-xs mt-1.5 font-medium ${
            trend.positive ? "text-success" : "text-danger"
          }`}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}
