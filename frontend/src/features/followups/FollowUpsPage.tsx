import { CalendarCheck, CalendarClock, CheckCircle2, Circle, MessageCircle, Phone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { StageBadge } from "../../components/ui/Badges";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState, ErrorNote, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { useFollowUps, type FollowUpScope } from "../../hooks/useFollowUps";
import { useLeadMutations } from "../../hooks/useLeads";
import { apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { dayDiff, inrCompact, phoneDigits, relativeDate, shortDate, timeOnly } from "../../lib/format";
import type { FollowUpRow } from "../../types";

const SCOPES: { id: FollowUpScope; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "week", label: "Next 7 days" },
  { id: "upcoming", label: "All upcoming" },
  { id: "done", label: "Done" },
];

const Row = ({ f }: { f: FollowUpRow }): JSX.Element => {
  const { updateFollowUp } = useLeadMutations(f.lead.id);
  const { toast } = useToast();
  const d = dayDiff(f.dueAt);
  const overdue = !f.done && d < 0;
  const c = f.lead.customer;
  const phone = phoneDigits(c.phone);

  const toggle = async () => {
    try {
      await updateFollowUp.mutateAsync({ followUpId: f.id, leadId: f.lead.id, done: !f.done });
      toast(f.done ? "Moved back to open" : "Follow-up done");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3.5 last:border-b-0 divider sm:px-5">
      <button onClick={toggle} disabled={updateFollowUp.isPending} aria-label={f.done ? "Mark as not done" : "Mark as done"} className="shrink-0">
        {f.done ? <CheckCircle2 className="h-5 w-5" style={{ color: "var(--success)" }} /> : <Circle className="h-5 w-5" style={{ color: overdue ? "var(--danger)" : "var(--border-strong)" }} />}
      </button>
      <div
        className="flex w-[74px] shrink-0 flex-col text-xs leading-tight"
        style={{ color: overdue ? "var(--danger)" : d === 0 && !f.done ? "var(--primary-text)" : "var(--text-2)" }}
      >
        <span className="font-semibold">{overdue ? `${Math.abs(d)}d overdue` : relativeDate(f.dueAt)}</span>
        <span className="muted">{d < -6 || d > 6 ? shortDate(f.dueAt) : timeOnly(f.dueAt)}</span>
      </div>
      <Link to={`/leads/${f.lead.id}`} className="min-w-0 flex-1 basis-56">
        <div className={cn("truncate text-sm font-semibold hover:underline", f.done && "muted line-through")}>{c.company ?? c.customerName}</div>
        <div className="text-2 truncate text-sm">{f.note || <span className="muted">No note</span>}</div>
      </Link>
      <div className="flex items-center gap-3">
        <StageBadge status={f.lead.status} />
        <span className="num hidden w-16 text-right text-sm font-medium md:inline">{inrCompact(f.lead.approxValue)}</span>
        {f.lead.owner && <Avatar name={f.lead.owner.name} size={24} />}
        {c.phone && (
          <>
            <a className="btn btn-ghost btn-sm btn-icon" href={`tel:+${phone}`} aria-label={`Call ${c.customerName}`}><Phone className="h-4 w-4" /></a>
            <a className="btn btn-ghost btn-sm btn-icon" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${c.customerName}`}><MessageCircle className="h-4 w-4" /></a>
          </>
        )}
      </div>
    </li>
  );
};

const FollowUpsPage = (): JSX.Element => {
  const [params, setParams] = useSearchParams();
  const scope = (SCOPES.find((s) => s.id === params.get("scope"))?.id ?? "today") as FollowUpScope;
  const mine = params.get("mine") === "1";
  const page = Number(params.get("page") ?? 1);
  const { data, isLoading, isError, refetch } = useFollowUps(scope, mine, page);
  const counts = data?.meta.counts;

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  const countFor = (id: FollowUpScope) => (id === "overdue" ? counts?.overdue : id === "today" ? counts?.today : id === "upcoming" ? counts?.upcoming : undefined);

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        subtitle="Calls, demos and visits scheduled across every lead."
        actions={
          <div className="seg" role="group" aria-label="Whose follow-ups">
            <button aria-pressed={!mine} onClick={() => set({ mine: undefined })}>Everyone</button>
            <button aria-pressed={mine} onClick={() => set({ mine: "1" })}>Mine</button>
          </div>
        }
      />
      <div className="panel overflow-hidden">
        <div className="scroll-thin flex gap-5 overflow-x-auto border-b px-4 divider sm:px-5" role="tablist">
          {SCOPES.map((s) => {
            const n = countFor(s.id);
            return (
              <button key={s.id} role="tab" aria-selected={scope === s.id} className="tab flex items-center gap-1.5" onClick={() => set({ scope: s.id === "today" ? undefined : s.id })}>
                {s.label}
                {n !== undefined && n > 0 && (
                  <span className="num rounded-full px-1.5 text-[11px] font-semibold" style={{ background: s.id === "overdue" ? "var(--danger-soft)" : "var(--surface-3)", color: s.id === "overdue" ? "var(--danger)" : "var(--text-2)" }}>{n}</span>
                )}
              </button>
            );
          })}
        </div>
        {isError ? (
          <div className="p-4"><ErrorNote message="Follow-ups didn't load." onRetry={() => refetch()} /></div>
        ) : isLoading ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={scope === "overdue" ? <CalendarCheck className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
            title={scope === "overdue" ? "Nothing overdue" : scope === "today" ? "Nothing due today" : scope === "done" ? "No completed follow-ups yet" : "Nothing scheduled"}
            hint={scope === "overdue" ? "Every follow-up is on time." : "Schedule follow-ups from a lead once it's past the New stage."}
          />
        ) : (
          <ul>{data.items.map((f) => <Row key={f.id} f={f} />)}</ul>
        )}
        {data && data.items.length > 0 && <Pagination meta={data.meta} onPage={(p) => set({ page: String(p) })} noun="follow-ups" />}
      </div>
    </div>
  );
};

export default FollowUpsPage;
