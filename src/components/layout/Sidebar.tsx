import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "grid" },
  { to: "/projects", label: "Projects", icon: "folder" },
  { to: "/usage", label: "Usage", icon: "bar-chart" },
  { to: "/models", label: "Models", icon: "cpu" },
  { to: "/sessions", label: "Sessions", icon: "list" },
  { to: "/blocks", label: "Blocks", icon: "clock" },
  { to: "/live", label: "Live", icon: "activity" },
  { to: "/limits", label: "Limits", icon: "shield" },
] as const;

const iconMap: Record<string, string> = {
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  "bar-chart": "M12 20V10m6 10V4M6 20v-4",
  cpu: "M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 7h10v10H7z",
  list: "M4 6h16M4 12h16M4 18h16",
  clock: "M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">
          Claude Monitor
        </h1>
        <p className="text-xs text-text-muted mt-0.5">Usage Dashboard</p>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/15 text-primary-light font-medium"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              }`
            }
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={iconMap[link.icon]} />
            </svg>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border text-xs text-text-muted">
        Local only
      </div>
    </aside>
  );
}
