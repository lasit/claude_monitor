# Claude Monitor

A local-only web dashboard for monitoring [Claude Code](https://docs.anthropic.com/en/docs/claude-code) usage and costs across all projects. Built on top of the [`ccusage`](https://github.com/anthropics/ccusage) CLI, which reads JSONL session files from `~/.claude/projects/`.

## Why?

Claude Code doesn't have a built-in dashboard. The `ccusage` CLI provides raw data but takes ~22 seconds per invocation and outputs JSON to the terminal. This dashboard:

- **Visualises** cost and token data with interactive charts
- **Caches aggressively** so you're not waiting 22 seconds on every page load
- **Tracks billing blocks** — the 5-hour billing windows that determine your Max plan costs
- **Compares projects** side-by-side with filtering and drill-down
- **Auto-refreshes** to keep data current while you work

## Screenshots

*Dashboard with cost-over-time, project breakdown, and model distribution charts. Dark theme throughout.*

## Quick Start

### Prerequisites

- **Node.js** v20+ (tested with v24.4.1)
- **ccusage** v18+ installed globally or available via `npx`
- **Claude Code** session data in `~/.claude/projects/`

### Install & Run

```bash
git clone https://github.com/lasit/claude_monitor.git
cd claude_monitor
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

The first load takes ~22 seconds while the server warms the cache by calling `ccusage` for all 4 data sources. After that, responses are instant (<5ms) until the cache TTLs expire.

### Environment Variables

Create a `.env` file (one is included with defaults):

```env
CCUSAGE_TIMEZONE=Australia/Darwin   # Timezone for date formatting
PORT=3001                           # Express API server port
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Build | Vite 6 | Fast HMR, dev server with API proxy |
| UI | React 19 | Component framework |
| Styling | Tailwind CSS 4 | Dark-themed utility classes |
| Charts | Recharts 2.x | Native React charting |
| Data Fetching | TanStack React Query v5 | Polling, caching, loading states |
| Routing | React Router v7 | Client-side page navigation |
| API Server | Express 5 | Shells out to `ccusage`, caches results |
| Dev Orchestration | concurrently | Runs Express + Vite together |
| Language | TypeScript | End-to-end type safety |

## Architecture

```
Browser (React)  ──▶  Vite Dev Proxy  ──▶  Express API  ──▶  CacheManager  ──▶  ccusage CLI
   │                    :5173/api/*          :3001              (in-memory)        (~22s)
   │
   └── React Query (client-side cache, polling every 45s)
```

### Two-Tier Caching

The dashboard uses aggressive caching to hide `ccusage`'s 22-second execution time:

1. **Server-side (CacheManager)** — In-memory cache with TTL and stale-while-revalidate. If data is stale, returns the old data immediately while refreshing in the background. Deduplicates concurrent `ccusage` calls (if two polls arrive during a 22s execution, only one process spawns).

2. **Client-side (React Query)** — Polls every 45 seconds, handles loading/error states, and keeps the UI responsive during server-side refreshes.

| Data Source | Cache TTL | Refresh Strategy |
|------------|-----------|-----------------|
| Daily usage | 5 min | Stale-while-revalidate |
| Monthly aggregate | 10 min | Stale-while-revalidate |
| Sessions | 5 min | Stale-while-revalidate |
| Billing blocks | 45 sec | Stale-while-revalidate |

### Cache Warm-Up

On server start, all 4 `ccusage` commands run in parallel (limited to 2 concurrent processes via a semaphore) to pre-populate the cache. This means the dashboard is ready to serve data within ~30 seconds of starting.

## Pages

### Dashboard (`/`)
Overview with stat cards (total spend, today's spend, active block), cost-over-time area chart, top projects bar chart, model breakdown donut chart, and most expensive projects list.

### Projects (`/projects`)
All projects ranked by cost with a horizontal bar chart. Click a project to see its daily cost breakdown. Sortable table with cost, tokens, and active days.

### Usage (`/usage`)
Daily/monthly toggle with stacked area charts showing cost by project. Project filter chips to narrow the view. Token breakdown chart showing input, output, cache write, and cache read volumes.

### Models (`/models`)
Model cost and token donut charts, cost-over-time stacked by model, and a detailed table with cost share percentages. Maps model IDs to short names (e.g., `claude-opus-4-6` → `Opus 4`).

### Sessions (`/sessions`)
Individual session browser with an "Individual / By Project" toggle. Filterable by project or model name. Shows cost, tokens, cache usage, and model tags per session.

### Blocks (`/blocks`)
Billing block timeline showing cost per 5-hour window. Active block detail panel with burn rate, projected cost, and time-elapsed progress bar. Sortable block table with cost and token data.

### Live (`/live`)
Real-time monitoring with auto-refresh indicator, active block cost and burn rate, recent blocks mini-chart, and cache status for all endpoints (showing fresh/stale/refreshing states and TTLs).

## Project Structure

```
claude_monitor/
├── package.json                          # Dependencies and scripts
├── tsconfig.json                         # TypeScript config
├── vite.config.ts                        # Vite + Tailwind + API proxy
├── index.html                            # Entry HTML
├── .env                                  # Environment variables
│
├── server/                               # Express API server
│   ├── index.ts                          # Server entry point
│   ├── config.ts                         # Environment config
│   ├── ccusage/
│   │   ├── executor.ts                   # Child process wrapper with semaphore
│   │   ├── parser.ts                     # First-JSON parser (handles output quirks)
│   │   └── normalizer.ts                 # Normalises inconsistent field names
│   ├── cache/
│   │   ├── cache-manager.ts              # TTL cache with stale-while-revalidate
│   │   └── warm-up.ts                    # Pre-fetches all commands on start
│   ├── routes/
│   │   ├── daily.ts                      # GET /api/daily
│   │   ├── monthly.ts                    # GET /api/monthly, /api/monthly/aggregate
│   │   ├── sessions.ts                   # GET /api/sessions
│   │   ├── blocks.ts                     # GET /api/blocks
│   │   └── meta.ts                       # GET /api/meta, POST /api/meta/refresh
│   └── transforms/
│       ├── project-names.ts              # Path-to-short-name extraction
│       ├── monthly-by-project.ts         # Derives per-project monthly from daily
│       └── aggregations.ts              # groupBy, sumCost, sumTokens helpers
│
├── src/                                  # React frontend
│   ├── main.tsx                          # React entry + providers
│   ├── App.tsx                           # Route definitions
│   ├── styles/index.css                  # Tailwind imports + theme + overrides
│   ├── api/
│   │   ├── client.ts                     # Fetch wrapper
│   │   └── hooks.ts                      # React Query hooks per endpoint
│   ├── types/
│   │   └── index.ts                      # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── format.ts                     # Currency, token, date formatters
│   │   ├── colors.ts                     # Chart palette + model colour map
│   │   └── project-names.ts             # Client-side path reconstruction
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx                 # Root layout with sidebar + header
│   │   │   ├── Sidebar.tsx               # Navigation with SVG icons
│   │   │   └── Header.tsx                # Cache status + refresh button
│   │   └── shared/
│   │       ├── StatCard.tsx              # Metric display card
│   │       ├── DataTable.tsx             # Sortable, paginated table
│   │       ├── ChartContainer.tsx        # Chart wrapper with title
│   │       ├── LoadingSkeleton.tsx        # Animated loading placeholder
│   │       └── ErrorDisplay.tsx          # Error state with retry
│   └── pages/
│       ├── DashboardPage.tsx             # Overview dashboard
│       ├── ProjectsPage.tsx              # Project breakdown
│       ├── UsagePage.tsx                  # Usage over time
│       ├── ModelsPage.tsx                # Model analysis
│       ├── SessionsPage.tsx              # Session browser
│       ├── BlocksPage.tsx                # Billing blocks
│       └── LivePage.tsx                  # Real-time monitor
```

## API Reference

All endpoints return JSON. The Express server runs on port 3001 (configurable via `PORT` env var). In development, Vite proxies `/api/*` requests to Express.

### `GET /api/daily?since=&until=`
Returns daily usage data flattened to per-project-per-model-per-day rows.

**Query parameters:**
- `since` (optional) — Filter to dates >= this value (YYYY-MM-DD)
- `until` (optional) — Filter to dates <= this value (YYYY-MM-DD)

**Response:** `DailyEntry[]`
```json
[{
  "date": "2026-01-07",
  "project": "C--Users-xavie-Documents-Code-reloaded",
  "projectShort": "reloaded",
  "model": "claude-opus-4-5-20251101",
  "inputTokens": 669,
  "outputTokens": 188,
  "cacheCreationTokens": 530736,
  "cacheReadTokens": 6502262,
  "cost": 6.58
}]
```

### `GET /api/monthly`
Returns monthly data derived from daily data, grouped by project and model.

**Response:** `MonthlyEntry[]`

### `GET /api/monthly/aggregate`
Returns official aggregate monthly totals from `ccusage monthly`.

**Response:** `MonthlyEntry[]`

### `GET /api/sessions`
Returns individual session data across all projects.

**Response:** `SessionEntry[]`
```json
[{
  "sessionId": "C--Users-xavie-Documents-Code-reloaded\\abc123",
  "projectPath": "C--Users-xavie-Documents-Code-reloaded\\abc123",
  "project": "C--Users-xavie-Documents-Code-reloaded",
  "projectShort": "reloaded",
  "cost": 45.23,
  "inputTokens": 12345,
  "outputTokens": 6789,
  "lastActivity": "2026-02-18",
  "models": ["claude-opus-4-6"],
  "modelBreakdowns": [{ "model": "claude-opus-4-6", "cost": 45.23, "inputTokens": 12345, "outputTokens": 6789 }]
}]
```

### `GET /api/blocks`
Returns billing block data with gap blocks filtered out.

**Response:** `BlocksData`
```json
{
  "blocks": [{
    "id": "2026-02-17T23:00:00.000Z",
    "blockNumber": 107,
    "startTime": "2026-02-17T23:00:00.000Z",
    "endTime": "2026-02-18T04:00:00.000Z",
    "cost": 22.25,
    "isActive": true,
    "burnRate": { "costPerHour": 4.51 },
    "projection": { "totalCost": 20.95, "remainingMinutes": 13 }
  }],
  "totalCost": 1960.83,
  "totalBlocks": 107
}
```

### `GET /api/meta`
Returns cache status for all endpoints.

### `POST /api/meta/refresh?endpoint=`
Force-refreshes one or all caches. Pass `endpoint=daily`, `endpoint=blocks`, etc., or omit for all.

### `GET /api/health`
Health check. Returns `{ "status": "ok" }`.

## Key Design Decisions

### Why derive monthly-by-project from daily data?
`ccusage monthly` doesn't support per-project grouping. The `--instances` flag gives aggregate totals only. To get monthly costs per project, we aggregate the daily data server-side.

### Why a first-JSON parser?
`ccusage blocks --json` occasionally prints the JSON output twice (a known bug). The parser tracks brace/bracket depth and stops after the first complete JSON object.

### Why normalise field names?
`ccusage` uses inconsistent field names across commands:
- `cacheCreationTokens` (daily) vs `cacheCreationInputTokens` (blocks)
- `totalCost` (daily/session) vs `costUSD` (blocks)
- `modelsUsed` (daily/session) vs `models` (blocks)

The normalisation layer (`server/ccusage/normalizer.ts`) absorbs all inconsistencies at the boundary so the rest of the codebase works with a single consistent schema.

### Why project name extraction?
`ccusage` encodes file paths as project identifiers: `C--Users-xavie-Documents-Code-reloaded`. The `--` separates the drive letter; single `-` separates directory components. The extraction strips the known home directory prefix and common intermediate directories to produce short names like `reloaded`.

### Why in-memory cache instead of SQLite?
The full dataset fits comfortably in memory (the largest response is ~70KB of JSON). There's no need for persistent storage since `ccusage` always reads from the authoritative JSONL files.

## Development

```bash
npm run dev       # Start Express + Vite concurrently
npm run server    # Start Express server only
npm run build     # Production build (TypeScript check + Vite bundle)
npm run preview   # Preview production build
```

### Manual Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Daily data
curl http://localhost:3001/api/daily

# Cache status
curl http://localhost:3001/api/meta

# Force refresh all caches
curl -X POST http://localhost:3001/api/meta/refresh
```

## License

MIT
