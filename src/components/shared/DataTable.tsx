import { useState, useMemo } from "react";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => number | string;
  align?: "left" | "right";
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSort?: string;
  defaultSortDir?: "asc" | "desc";
  pageSize?: number;
}

export default function DataTable<T>({
  data,
  columns,
  defaultSort,
  defaultSortDir = "desc",
  pageSize = 25,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSort || columns[0]?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;

    return [...data].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      const cmp = typeof va === "number" ? va - (vb as number) : String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium text-text-muted cursor-pointer hover:text-text-primary transition-colors select-none ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  onClick={() => col.sortValue && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortKey === col.key && (
                      <span className="text-primary text-xs">{sortDir === "asc" ? "\u25B2" : "\u25BC"}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((row, i) => (
              <tr key={i} className="hover:bg-surface-alt/50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded bg-surface-alt hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded bg-surface-alt hover:bg-surface-hover disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
