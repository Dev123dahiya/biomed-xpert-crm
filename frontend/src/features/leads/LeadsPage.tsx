import { ArrowDown, ArrowRight, ArrowUp, CalendarClock, Download, FileText, KanbanSquare, List, Package, Plus, Search, Trophy, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { Segmented, Tabs } from "../../components/ui/Segmented";
import { Tooltip } from "../../components/ui/Tooltip";
import { spring } from "../../lib/motion";
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
import { BOARD_ORDER, canMoveTo, isTerminal, nextForwardStages, STAGE_META, stageLabel } from "../../lib/stages";
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
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full sm:w-72">
        <Search className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <input className="input pl-9" placeholder="Customer, phone or city" value={search} onChange={(e) => onSearch(e.target.value)} aria-label="Search leads" />
      </div>
      <div className="scroll-thin -mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-0.5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
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

const LeadCard = ({ card, status, dragging, onDragStart, onDragEnd, onAdvance, onClose }: {
  card: BoardCard;
  status: LeadStatus;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onAdvance: (to: LeadStatus) => void;
  onClose: (to: "WON" | "LOST") => void;
}): JSX.Element => {
  const terminal = isTerminal(status);
  const age = daysSince(card.updatedAt);
  const next = nextForwardStages(status)[0];
  return (
    <motion.div
      layout
      layoutId={card.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: dragging ? 0.4 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
      transition={spring}
      className="group/card relative"
    >
      <Link
        to={`/leads/${card.id}`}
        draggable={!terminal}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", card.id);
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className={cn(
          "card block p-3 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-px hover:border-[var(--border-strong)] hover:shadow-[0_6px_16px_-8px_rgba(20,20,18,.22)]",
          !terminal && "cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium leading-snug">{card.customer ?? "Customer"}</div>
            <div className="muted truncate text-xs">{[card.contact !== card.customer ? card.contact : null, card.city].filter(Boolean).join(", ") || card.source}</div>
          </div>
          {card.owner && <Avatar name={card.owner.name} size={22} />}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-2">
          <span className="num text-[14px] font-semibold tracking-[-0.01em]">{inrCompact(card.finalValue ?? card.approxValue)}</span>
          <PriorityBadge priority={card.priority} />
        </div>
        <div className="muted mt-2.5 flex min-h-[20px] flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]">
          {card.nextFollowUp && !terminal && <FollowUpTag at={card.nextFollowUp} />}
          <span className="inline-flex items-center gap-1" title="Products"><Package className="h-3 w-3" />{card.productCount}</span>
          {Boolean(card.quoteCount) && <span className="inline-flex items-center gap-1" title="Quotes"><FileText className="h-3 w-3" />{card.quoteCount}</span>}
          {!terminal && age >= 7 && <span title="Days since last update" style={{ color: age >= 21 ? "var(--warning)" : undefined }}>{age}d idle</span>}
        </div>
      </Link>
      {!terminal && (
        <div className="pointer-events-none absolute bottom-2 right-2 flex translate-y-1 gap-1 opacity-0 transition-all duration-150 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100">
          {next ? (
            <Tooltip content={`Move to ${stageLabel(next).toLowerCase()}`}>
              <button
                className="btn btn-sm h-6 gap-1 px-1.5 text-[11px]"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdvance(next); }}
                aria-label={`Move ${card.customer} to ${stageLabel(next)}`}
              >
                <StageDot status={next} size={6} /> <ArrowRight className="!h-3 !w-3" />
              </button>
            </Tooltip>
          ) : (
            <Tooltip content="Mark as won">
              <button
                className="btn btn-sm h-6 gap-1 px-1.5 text-[11px]"
                style={{ color: "var(--success)" }}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose("WON"); }}
                aria-label={`Mark ${card.customer} as won`}
              >
                <Trophy className="!h-3 !w-3" /> Won
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </motion.div>
  );
};

const Column = ({ col, dragFrom, draggingId, onDragStart, onDragEnd, onDrop, onAdvance, onClose }: {
  col: BoardColumn;
  dragFrom: LeadStatus | null;
  draggingId: string | null;
  onDragStart: (id: string, s: LeadStatus) => void;
  onDragEnd: () => void;
  onDrop: (id: string, to: LeadStatus) => void;
  onAdvance: (id: string, from: LeadStatus, to: LeadStatus) => void;
  onClose: (card: BoardCard, to: "WON" | "LOST") => void;
}): JSX.Element => {
  const meta = STAGE_META[col.status];
  const [over, setOver] = useState(false);
  const allowed = dragFrom ? canMoveTo(dragFrom, col.status) : false;
  const showLimit = col.count > col.leads.length;

  return (
    <div
      className={cn("flex w-[280px] shrink-0 snap-start flex-col rounded-[12px] border p-1.5 transition-colors", dragFrom && !allowed && dragFrom !== col.status && "drop-no", over && allowed && "drop-ok")}
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
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
      <div className="flex items-center gap-2 px-2 pb-2 pt-1.5">
        <StageDot status={col.status} size={8} />
        <span className="text-[13px] font-medium">{meta.label}</span>
        <AnimatedNumber value={col.count} format={(n) => num(Math.round(n))} duration={0.5} className="num muted rounded-md px-1.5 text-[11.5px] font-medium" style={{ background: "var(--surface-3)" }} />
        <AnimatedNumber value={col.value ?? 0} format={inrCompact} duration={0.6} className="num muted ml-auto text-[12px] font-medium" />
      </div>
      <div className="flex min-h-[120px] flex-col gap-2">
        {col.leads.length === 0 && (
          <div className="muted flex flex-1 items-center justify-center rounded-[10px] border border-dashed px-3 py-8 text-center text-xs" style={{ borderColor: "var(--border-strong)" }}>
            {dragFrom && allowed ? `Drop to move to ${meta.label.toLowerCase()}` : meta.hint}
          </div>
        )}
        <AnimatePresence initial={false} mode="popLayout">
          {col.leads.map((l) => (
            <LeadCard
              key={l.id}
              card={l}
              status={col.status}
              dragging={draggingId === l.id}
              onDragStart={() => onDragStart(l.id, col.status)}
              onDragEnd={onDragEnd}
              onAdvance={(to) => onAdvance(l.id, col.status, to)}
              onClose={(to) => onClose(l, to)}
            />
          ))}
        </AnimatePresence>
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
    <motion.div
      animate={{ scale: over === to ? 1.04 : 1 }}
      transition={spring}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(to); }}
      onDragLeave={() => setOver(null)}
      onDrop={(e) => { e.preventDefault(); setOver(null); onDrop(to); }}
      className="flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-dashed py-4 text-[13px] font-medium transition-colors"
      style={{
        borderColor: STAGE_META[to].color,
        background: over === to ? `color-mix(in srgb, ${STAGE_META[to].color} 22%, var(--surface))` : "var(--surface)",
        color: "var(--text)",
      }}
    >
      <Icon className="h-4 w-4" style={{ color: STAGE_META[to].color }} /> {label}
    </motion.div>
  );
  return (
    <motion.div
      className="pop fixed inset-x-0 bottom-5 z-50 mx-auto flex w-[min(520px,calc(100vw-2rem))] gap-2.5 rounded-[14px] p-2"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, transition: { duration: 0.15 } }}
      transition={spring}
    >
      {zone("WON", "Drop to mark won", Trophy)}
      {zone("LOST", "Drop to mark lost", XCircle)}
    </motion.div>
  );
};

const Board = ({ filters }: { filters: LeadFilters }): JSX.Element => {
  const { data, isLoading, isError, refetch } = useLeadBoard(filters);
  const { changeStatus } = useLeadMutations();
  const { toast } = useToast();
  const qc = useQueryClient();
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
    await advance(id, from, to);
  };

  // Move the card on screen first, then tell the server. A failed save puts it back.
  const advance = async (id: string, from: LeadStatus, to: LeadStatus) => {
    qc.setQueriesData<{ columns: BoardColumn[] }>({ queryKey: ["leads", "board"] }, (old) => {
      if (!old) return old;
      const card = old.columns.find((c) => c.status === from)?.leads.find((l) => l.id === id);
      if (!card) return old;
      return {
        columns: old.columns.map((c) =>
          c.status === from
            ? { ...c, count: c.count - 1, value: (c.value ?? 0) - card.approxValue, leads: c.leads.filter((l) => l.id !== id) }
            : c.status === to
              ? { ...c, count: c.count + 1, value: (c.value ?? 0) + card.approxValue, leads: [{ ...card, updatedAt: new Date().toISOString() }, ...c.leads] }
              : c,
        ),
      };
    });
    try {
      await changeStatus.mutateAsync({ leadId: id, toStatus: to });
      toast(`Moved to ${stageLabel(to).toLowerCase()}`);
    } catch (err) {
      qc.invalidateQueries({ queryKey: ["leads", "board"] });
      toast(apiError(err).message, "error");
    }
  };

  if (isError) return <ErrorNote message="The pipeline didn't load." onRetry={() => refetch()} />;

  return (
    <>
      <LayoutGroup>
      <motion.div layoutScroll className="scroll-thin -mx-3 snap-x overflow-x-auto px-3 pb-3 sm:-mx-5 sm:px-5 lg:-mx-7 lg:px-7">
        <div className="flex min-w-max gap-3">
          {isLoading
            ? BOARD_ORDER.map((s) => <Skeleton key={s} className="h-[420px] w-[280px] rounded-[12px]" />)
            : BOARD_ORDER.map((status) => (
                <Column
                  key={status}
                  col={byStatus.get(status) ?? { status, count: 0, value: 0, leads: [] }}
                  dragFrom={drag?.from ?? null}
                  draggingId={drag?.id ?? null}
                  onDragStart={(id, s) => setDrag({ id, from: s })}
                  onDragEnd={() => setDrag(null)}
                  onDrop={drop}
                  onAdvance={advance}
                  onClose={(card, to) => setClosing({ id: card.id, to, card })}
                />
              ))}
        </div>
      </motion.div>
      </LayoutGroup>
      <AnimatePresence>
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
      </AnimatePresence>

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
      <Tabs className="px-4" value={status} onChange={(v) => set({ status: v || undefined })} tabs={STATUS_TABS.map((t) => ({ value: t.id, label: t.label }))} />
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
                {rows.map((l, i) => (
                  <tr key={l.id} className="row-link row-in" style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }} onClick={() => navigate(`/leads/${l.id}`)}>
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
            <Segmented
              label="View"
              value={view}
              onChange={(v) => (v === "board" ? set({ view: undefined, status: undefined, sort: undefined }) : set({ view: "list" }))}
              options={[
                { value: "board", label: "Board", icon: <KanbanSquare className="h-3.5 w-3.5" /> },
                { value: "list", label: "List", icon: <List className="h-3.5 w-3.5" /> },
              ]}
            />
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
          {view === "board" ? <Board filters={filters} /> : <ListView filters={filters} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeadsPage;
