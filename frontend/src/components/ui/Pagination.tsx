import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "../../types";
import { num } from "../../lib/format";

export const Pagination = ({ meta, onPage, noun = "results" }: { meta: PaginationMeta; onPage: (page: number) => void; noun?: string }): JSX.Element => {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.pageSize + 1;
  const to = Math.min(meta.total, meta.page * meta.pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-sm divider">
      <span className="muted num">{meta.total === 0 ? `No ${noun}` : `${num(from)}–${num(to)} of ${num(meta.total)} ${noun}`}</span>
      {meta.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-sm btn-icon" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="num px-2 text-xs font-medium">
            {meta.page} / {meta.totalPages}
          </span>
          <button className="btn btn-ghost btn-sm btn-icon" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
