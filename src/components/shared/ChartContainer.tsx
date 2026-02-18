import { ReactNode } from "react";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export default function ChartContainer({ title, subtitle, children, action }: ChartContainerProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
