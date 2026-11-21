import { ArrowDown, ArrowUp, CalendarClock, Download, FileText, KanbanSquare, List, Package, Plus, Search, Trophy, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useCreate } from "../../components/layout/CreateContext";
import { Avatar } from "../../components/ui/Avatar";
import { PriorityBadge, StageBadge, StageDot } from "../../components/ui/Badges";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorNote, Skeleton, SkeletonRows } from "../../components/ui/States";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLeadBoard, useLeadList, useLeadMutations, type LeadFilters } from "../../hooks/useLeads";
import { useLeadSources, useTeam } from "../../hooks/useMeta";
import { apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { downloadFile } from "../../lib/download";
import { dayDiff, daysSince, inr, inrCompact, num, relativeDate, shortDate } from "../../lib/format";
import { useDebounced } from "../../lib/hooks";
import { BOARD_ORDER, canMoveTo, isTerminal, STAGE_META, stageLabel } from "../../lib/stages";
import type { BoardCard, BoardColumn, LeadStatus } from "../../types";
import { LostForm, WonForm } from "./WonLostForms";

/* ---------------------------------------------------------------- */
/* Filters (kept in the URL so views can be bookmarked and shared)   */

const useFilters = () => {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };
  return { get, set, params };
};

const FilterBar = ({ search, onSearch }: { search: string; onSearch: (v: string) => void }): JSX.Element => {
  const { get, set } = useFilters();
  const { user } = useAuth();
  const { data: sources } = useLeadSources();
  const { data: team } = useTeam();
  const priority = get("priority");
  const owner = get("ownerId");
  const active = Boolean(get("search") || priority || get("sourceId") || owner);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-72">
        <Search className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input className="input pl-9" placeholder="Customer, phone or city" value={search} onChange={(e) => onSearch(e.target.value)} aria-label="Search leads" />
      </div>
      <button className="chip" aria-pressed={owner === user?.id} onClick={() => set({ ownerId: owner === user?.id ? undefined : user?.id })}>
        My leads
      </button>
      {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => (
        <button key={p} className="chip" aria-pressed={priority === p} onClick={() => set({ priority: priority === p ? undefined : p })}>
          {p.charAt(0) + p.slice(1).toLowerCase()} priority
        </button>
      ))}
      <select className="input h-[1.9rem] w-auto rounded-full py-0 text-[0.8rem]" value={get("sourceId")} onChange={(e) => set({ sourceId: e.target.value || undefined })} aria-label="Source">
        <option value="">All sources</option>
        {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select className="input h-[1.9rem] w-auto rounded-full py-0 text-[0.8rem]" value={owner && owner !== user?.id ? owner : ""} onChange={(e) => set({ ownerId: e.target.value || undefined })} aria-label="Owner">
        <option value="">Any owner</option>
        {team?.filter((m) => m.id !== user?.id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        <option value="none">Unassigned</option>
      </select>
      {active && (
        <button className="btn btn-ghost btn-sm" onClick={() => { onSearch(""); set({ search: undefined, priority: undefined, sourceId: undefined, ownerId: undefined }); }}>
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- */
/* Board                                                             */

const FollowUpTag = ({ at }: { at: string }): JSX.Element => {
  const d = dayDiff(at);
  const overdue = d < 0;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: overdue ? "var(--danger-soft)" : d === 0 ? "var(--primary-soft)" : "var(--surface-3)", color: overdue ? "var(--danger)" : d === 0 ? "var(--primary-text)" : "var(--text-2)" }}
      title={`Next follow-up ${shortDate(at)}`}
    >
      <CalendarClock className="h-3 w-3" />
      {overdue ? `${Math.abs(d)}d overdue` : relativeDate(at)}
    </span>
  );
};

const LeadCard = ({ card, status, dragging, onDragStart, onDragEnd }: { card: BoardCard; status: LeadStatus; dragging: boolean; onDragStart: () => void; onDragEnd: () => void }): JSX.Element => {
  const terminal = isTerminal(status);
  const age = daysSince(card.updatedAt);
  return (
    <Link
      to={`/leads/${card.id}`}
      draggable={!terminal}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", card.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={cn("card block p-3 transition-shadow hover:shadow-[0_4px_14px_-6px_rgba(15,42,51,.25)]", !terminal && "cursor-grab active:cursor-grabbing", dragging && "opacity-40")}
      style={{ borderLeft: `3px solid ${STAGE_META[status].color}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold leading-snug">{card.customer ?? "Customer"}</div>
          <div className="muted truncate text-xs">{[card.contact !== card.customer ? card.contact : null, card.city].filter(Boolean).join(", ") || card.source}</div>
        </div>
        {card.owner && <Avatar name={card.owner.name} size={22} />}
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="num text-[15px] font-semibold">{inrCompact(card.finalValue ?? card.approxValue)}</span>
        <PriorityBadge priority={card.priority} />
      </div>
      <div className="muted mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
        {card.nextFollowUp && !terminal && <FollowUpTag at={card.nextFollowUp} />}
        <span className="inline-flex items-center gap-1" title="Products"><Package className="h-3 w-3" />{card.productCount}</span>
        {Boolean(card.quoteCount) && <span className="inline-flex items-center gap-1" title="Quotes"><FileText className="h-3 w-3" />{card.quoteCount}</span>}
        {!terminal && age >= 7 && <span title="Days since last update" style={{ color: age >= 21 ? "var(--warning)" : undefined }}>{age}d idle</span>}
      </div>
    </Link>
  );
};

const Column = ({ col, dragFrom, draggingId, onDragStart, onDragEnd, onDrop }: {
  col: BoardColumn;
  dragFrom: LeadStatus | null;
  draggingId: string | null;
  onDragStart: (id: string, s: LeadStatus) => void;
  onDragEnd: () => void;
  onDrop: (id: string, to: LeadStatus) => void;
}): JSX.Element => {
  const meta = STAGE_META[col.status];
  const [over, setOver] = useState(false);
  const allowed = dragFrom ? canMoveTo(dragFrom, col.status) : false;
  const showLimit = col.count > col.leads.length;

  return (
    <div
      className={cn("flex w-[284px] shrink-0 snap-start flex-col rounded-[14px] p-2 transition-colors", dragFrom && !allowed && dragFrom !== col.status && "drop-no", over && allowed && "drop-ok")}
      style={{ background: "var(--surface-3)" }}
      onDragOver={(e) => {
        if (!allowed) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData("text/plain");
        if (id && allowed) onDrop(id, col.status);
      }}
      aria-label={`${meta.label} column`}
    >
      <div className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        <StageDot status={col.status} size={9} />
        <span className="text-sm font-semibold">{meta.label}</span>
        <span className="num muted text-xs font-medium">{num(col.count)}</span>
        <span className="num text-2 ml-auto text-xs font-semibold">{inrCompact(col.value ?? 0)}</span>
      </div>
      <div className="flex min-h-[120px] flex-col gap-2">
        {col.leads.length === 0 ? (
          <div className="muted flex flex-1 items-center justify-center rounded-[10px] border border-dashed px-3 py-8 text-center text-xs" style={{ borderColor: "var(--border-strong)" }}>
            {dragFrom && allowed ? `Drop to move to ${meta.label.toLowerCase()}` : meta.hint}
          </div>
        ) : (
          col.leads.map((l) => (
            <LeadCard key={l.id} card={l} status={col.status} dragging={draggingId === l.id} onDragStart={() => onDragStart(l.id, col.status)} onDragEnd={onDragEnd} />
          ))
        )}
        {showLimit && (
          <Link to={`/leads?view=list&status=${col.status}`} className="btn btn-ghost btn-sm">
            View all {num(col.count)}
          </Link>
        )}
      </div>
    </div>
  );
};

// While a card is being dragged, Won and Lost targets float at the bottom of the
// screen so a deal can be closed without scrolling the board sideways.
const CloseZones = ({ onDrop }: { onDrop: (to: "WON" | "LOST") => void }): JSX.Element => {
  const [over, setOver] = useState<"WON" | "LOST" | null>(null);
  const zone = (to: "WON" | "LOST", label: string, Icon: typeof Trophy) => (
    <div
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(to); }}
      onDragLeave={() => setOver(null)}
      onDrop={(e) => { e.preventDefault(); setOver(null); onDrop(to); }}
      className="flex flex-1 items-center justify-center gap-2 rounded-[12px] border-2 border-dashed py-5 text-sm font-semibold transition-colors"
      style={{
        borderColor: STAGE_META[to].color,
        background: over === to ? `color-mix(in srgb, ${STAGE_META[to].color} 22%, var(--surface))` : "var(--surface)",
        color: "var(--text)",
      }}
    >
      <Icon className="h-4 w-4" style={{ color: STAGE_META[to].color }} /> {label}
    </div>
  );
  return (
    <div className="anim-pop fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(560px,calc(100vw-2rem))] gap-3 rounded-[16px] p-2.5" style={{ background: "var(--ink)", boxShadow: "var(--shadow-pop)" }}>
      {zone("WON", "Drop to mark won", Trophy)}
      {zone("LOST", "Drop to mark lost", XCircle)}
    </div>
  );
};

const Board = ({ filters }: { filters: LeadFilters }): JSX.Element => {
  const { data, isLoading, isError, refetch } = useLeadBoard(filters);
  const { changeStatus } = useLeadMutations();
  const { toast } = useToast();
  const [drag, setDrag] = useState<{ id: string; from: LeadStatus } | null>(null);
  const [closing, setClosing] = useState<{ id: string; to: "WON" | "LOST"; card: BoardCard } | null>(null);

  const byStatus = useMemo(() => new Map((data?.columns ?? []).map((c) => [c.status, c])), [data]);

  const drop = async (id: string, to: LeadStatus) => {
    const from = drag?.from;
    setDrag(null);
    if (!from || from === to) return;
    if (to === "WON" || to === "LOST") {
      const card = byStatus.get(from)?.leads.find((l) => l.id === id);
      if (card) setClosing({ id, to, card });
      return;
    }
    try {
      await changeStatus.mutateAsync({ leadId: id, toStatus: to });
      toast(`Moved to ${stageLabel(to).toLowerCase()}`);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  if (isError) return <ErrorNote message="The pipeline didn't load." onRetry={() => refetch()} />;

  return (
    <>
      <div className="scroll-thin -mx-3 snap-x overflow-x-auto px-3 pb-3 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <div className="flex min-w-max gap-3">
          {isLoading
            ? BOARD_ORDER.map((s) => <Skeleton key={s} className="h-[420px] w-[284px] rounded-[14px]" />)
            : BOARD_ORDER.map((status) => (
                <Column
                  key={status}
                  col={byStatus.get(status) ?? { status, count: 0, value: 0, leads: [] }}
                  dragFrom={drag?.from ?? null}
                  draggingId={drag?.id ?? null}
                  onDragStart={(id, s) => setDrag({ id, from: s })}
                  onDragEnd={() => setDrag(null)}
                  onDrop={drop}
                />
              ))}
        </div>
      </div>
      {drag && (
        <CloseZones
          onDrop={(to) => {
            const d = drag;
            setDrag(null);
            const card = byStatus.get(d.from)?.leads.find((l) => l.id === d.id);
            if (card) setClosing({ id: d.id, to, card });
          }}
        />
      )}
      {changeStatus.isPending && (
        <div className="pop fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 px-4 py-2 text-sm"><Spinner /> Moving lead</div>
      )}
      <Modal
        open={Boolean(closing)}
        title={closing?.to === "WON" ? `Mark ${closing.card.customer} as won` : `Mark ${closing?.card.customer ?? "lead"} as lost`}
        description={closing?.to === "WON" ? "Record the order details. Equipment lines are copied from the lead." : "A short reason helps the team spot patterns."}
        onClose={() => setClosing(null)}
        width={600}
      >
        {closing?.to === "WON" && <WonForm leadId={closing.id} suggestedValue={closing.card.approxValue} onDone={() => setClosing(null)} />}
        {closing?.to === "LOST" && <LostForm leadId={closing.id} onDone={() => setClosing(null)} />}
      </Modal>
    </>
  );
};

/* ---------------------------------------------------------------- */
/* List                                                              */

const STATUS_TABS: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "open", label: "Open" },
  ...BOARD_ORDER.map((s) => ({ id: s, label: stageLabel(s) })),
];

const SortHead = ({ field, label, sort, onSort, right }: { field: string; label: string; sort: string; onSort: (s: string) => void; right?: boolean }): JSX.Element => {
  const active = sort.replace("-", "") === field;
  const desc = sort.startsWith("-");
  return (
    <th className={cn("th", right && "text-right")} aria-sort={active ? (desc ? "descending" : "ascending") : undefined}>
      <button onClick={() => onSort(active && desc ? field : `-${field}`)} className={right ? "ml-auto" : undefined}>
        {label}
        {active && (desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    </th>
  );
};

const ListView = ({ filters }: { filters: LeadFilters }): JSX.Element => {
  const { get, set } = useFilters();
  const navigate = useNavigate();
  const status = get("status");
  const sort = get("sort") || "-updatedAt";
  const page = Number(get("page") || 1);
  const query = {
    ...filters,
    status: BOARD_ORDER.includes(status as LeadStatus) ? (status as LeadStatus) : undefined,
    stage: status === "open" ? ("open" as const) : undefined,
    sort,
    page,
    pageSize: 25,
  };
  const { data, isLoading, isError, refetch } = useLeadList(query);
  const rows = data?.items ?? [];
  const create = useCreate();

  return (
    <div className="panel overflow-hidden">
      <div className="scroll-thin flex gap-5 overflow-x-auto border-b px-4 divider" role="tablist">
        {STATUS_TABS.map((t) => (
          <button key={t.id || "all"} role="tab" aria-selected={status === t.id} className="tab" onClick={() => set({ status: t.id || undefined })}>
            {t.label}
          </button>
        ))}
      </div>
      {isError ? (
        <div className="p-4"><ErrorNote message="Leads didn't load." onRetry={() => refetch()} /></div>
      ) : !isLoading && rows.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-5 w-5" />}
          title="No leads match"
          hint="Try a different stage or clear the filters. New enquiries start here."
          action={<button className="btn btn-primary" onClick={() => create.openLead()}><Plus className="h-4 w-4" /> New lead</button>}
        />
      ) : (
        <div className="scroll-thin overflow-x-auto">
          <table className="table min-w-[860px]">
            <thead>
              <tr>
                <th className="th">Customer</th>
                <th className="th">Stage</th>
                <SortHead field="approxValue" label="Value" sort={sort} onSort={(s) => set({ sort: s })} right />
                <SortHead field="priority" label="Priority" sort={sort} onSort={(s) => set({ sort: s })} />
                <th className="th">Owner</th>
                <th className="th">Next follow-up</th>
                <th className="th">Source</th>
                <SortHead field="updatedAt" label="Updated" sort={sort} onSort={(s) => set({ sort: s })} right />
              </tr>
            </thead>
            {isLoading ? (
              <SkeletonRows rows={8} cols={8} />
            ) : (
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} className="row-link" onClick={() => navigate(`/leads/${l.id}`)}>
                    <td className="td">
                      <Link to={`/leads/${l.id}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                        {l.customer.company ?? l.customer.customerName}
                      </Link>
                      <div className="muted text-xs">{[l.customer.company ? l.customer.customerName : null, l.customer.city].filter(Boolean).join(", ")}</div>
                    </td>
                    <td className="td"><StageBadge status={l.status} /></td>
                    <td className="td num text-right font-medium">{inr(l.finalValue ?? l.approxValue)}</td>
                    <td className="td"><PriorityBadge priority={l.priority} /></td>
                    <td className="td">
                      {l.owner ? (
                        <span className="flex items-center gap-2"><Avatar name={l.owner.name} size={22} /> <span className="truncate">{l.owner.name}</span></span>
                      ) : (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td className="td">{l.nextFollowUp && !isTerminal(l.status) ? <FollowUpTag at={l.nextFollowUp} /> : <span className="muted">None</span>}</td>
                    <td className="td text-2">{l.source}</td>
                    <td className="td muted num text-right text-xs">{shortDate(l.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      )}
      {data && rows.length > 0 && <Pagination meta={data.meta} onPage={(p) => set({ page: String(p) })} noun="leads" />}
    </div>
  );
};

/* ---------------------------------------------------------------- */

const LeadsPage = (): JSX.Element => {
  const { get, set } = useFilters();
  const view = get("view") === "list" ? "list" : "board";
  const create = useCreate();
  const { toast } = useToast();
  const [search, setSearch] = useState(get("search"));
  const dsearch = useDebounced(search, 300);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (dsearch !== get("search")) set({ search: dsearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dsearch]);

  const filters: LeadFilters = {
    search: get("search") || undefined,
    priority: get("priority") || undefined,
    sourceId: get("sourceId") || undefined,
    ownerId: get("ownerId") || undefined,
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const status = get("status");
      const stage = BOARD_ORDER.includes(status as LeadStatus) ? status : "";
      await downloadFile(`/export/leads?format=xlsx${stage ? `&stage=${stage}` : ""}${filters.sourceId ? `&sourceId=${filters.sourceId}` : ""}${filters.ownerId && filters.ownerId !== "none" ? `&ownerId=${filters.ownerId}` : ""}`);
      toast("Excel file downloaded");
    } catch (err) {
      toast(apiError(err).message, "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        docTitle="Pipeline"
        title="Pipeline"
        subtitle={
          <>
            <span className="hidden md:inline">Drag a card to move it forward. Drop it on Won or Lost to close the deal.</span>
            <span className="md:hidden">Open a card to move it through the stages.</span>
          </>
        }
        actions={
          <>
            <div className="seg" role="group" aria-label="View">
              <button aria-pressed={view === "board"} onClick={() => set({ view: undefined, status: undefined, sort: undefined })} className="flex items-center gap-1.5">
                <KanbanSquare className="h-3.5 w-3.5" /> Board
              </button>
              <button aria-pressed={view === "list"} onClick={() => set({ view: "list" })} className="flex items-center gap-1.5">
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
            <button className="btn" onClick={exportExcel} disabled={exporting}>
              {exporting ? <Spinner /> : <Download className="h-4 w-4" />} Export
            </button>
            <button className="btn btn-primary" onClick={() => create.openLead()}>
              <Plus className="h-4 w-4" /> New lead
            </button>
          </>
        }
      />
      <FilterBar search={search} onSearch={setSearch} />
      {view === "board" ? <Board filters={filters} /> : <ListView filters={filters} />}
    </div>
  );
};

export default LeadsPage;
