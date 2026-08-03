import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "../../types";

export const Pagination = ({ meta, onPage }: { meta: PaginationMeta; onPage: (page: number) => void }): JSX.Element => {
  const from = (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.total, meta.page * meta.pageSize);
  return (
    <div className="flex items-center justify-between p-3 text-sm" style={{ borderTop: "1px solid var(--border)" }}>
      <span className="muted">
        {meta.total === 0 ? "No results" : `Showing ${from}\u2013${to} of ${meta.total}`}
      </span>
      <div className="flex gap-1">
        <button className="btn btn-ghost" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="btn" style={{ background: "var(--accent)", color: "var(--primary)", borderColor: "transparent" }}>
          {meta.page} / {meta.totalPages}
        </span>
        <button className="btn btn-ghost" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
