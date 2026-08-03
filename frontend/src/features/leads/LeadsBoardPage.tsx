import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { inr } from "../../lib/format";
import { BOARD_ORDER, PRIORITY_COLOR, STAGE_META } from "../../lib/stages";
import { ErrorNote } from "../../components/ui/States";
import { SlideOver } from "../../components/ui/SlideOver";
import { useLeadBoard } from "../../hooks/useLeads";
import { LeadForm } from "./LeadForm";
import type { BoardColumn } from "../../types";

const Column = ({ col }: { col: BoardColumn }): JSX.Element => {
  const meta = STAGE_META[col.status];
  return (
    <div className="w-64 shrink-0">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        <span className="mono muted text-xs">{col.count}</span>
      </div>
      <div className="space-y-2">
        {col.leads.length === 0 ? (
          <div className="muted card py-6 text-center text-xs">Nothing here yet.</div>
        ) : (
          col.leads.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="card block p-3">
              <div className="mb-1 truncate text-sm font-medium">{l.customer ?? "Customer"}</div>
              <div className="mono muted mb-2 text-xs">{inr(l.approxValue)}</div>
              <div className="flex items-center justify-between">
                <span className="pill" style={{ background: `${PRIORITY_COLOR[l.priority]}22`, color: PRIORITY_COLOR[l.priority] }}>
                  {l.priority.charAt(0) + l.priority.slice(1).toLowerCase()}
                </span>
                <span className="muted flex items-center gap-1 text-[11px]"><Package className="h-3 w-3" /> {l.productCount}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export const LeadsBoardPage = (): JSX.Element => {
  const [creating, setCreating] = useState(false);
  const { data, isLoading, isError } = useLeadBoard();

  const byStatus = new Map((data?.columns ?? []).map((c) => [c.status, c]));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Lead pipeline</h1>
          <p className="muted text-sm">Open a card to update its stage.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add lead</button>
      </div>

      {isError ? (
        <ErrorNote message="Could not load the pipeline." />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {BOARD_ORDER.map((status) => (
              <Column key={status} col={byStatus.get(status) ?? { status, count: 0, leads: [] }} />
            ))}
          </div>
          {isLoading && <div className="muted mt-4 text-sm">Loading pipeline...</div>}
        </div>
      )}

      <SlideOver open={creating} title="Add lead" onClose={() => setCreating(false)} width={520}>
        <LeadForm onDone={() => setCreating(false)} />
      </SlideOver>
    </div>
  );
};
