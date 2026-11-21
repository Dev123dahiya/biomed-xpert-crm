import { CalendarCheck, CalendarClock, CheckCircle2, Circle, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Segmented, Tabs } from "../../components/ui/Segmented";
import { easeOut } from "../../lib/motion";
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

const Row = ({ f, onLeave, onReturn, index }: { f: FollowUpRow; onLeave: (id: string) => void; onReturn: (id: string) => void; index: number }): JSX.Element => {
  const { updateFollowUp } = useLeadMutations(f.lead.id);
  const { toast } = useToast();
  const d = dayDiff(f.dueAt);
  const overdue = !f.done && d < 0;
  const c = f.lead.customer;
  const phone = phoneDigits(c.phone);

  const toggle = async () => {
    // Leave the list straight away; come back if the save fails.
    onLeave(f.id);
    try {
      await updateFollowUp.mutateAsync({ followUpId: f.id, leadId: f.lead.id, done: !f.done });
      toast(f.done ? "Moved back to open" : "Follow-up done");
    } catch (err) {
      onReturn(f.id);
      toast(apiError(err).message, "error");
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 12) * 0.025, duration: 0.3, ease: easeOut } }}
      exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.3, ease: easeOut } }}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden border-b px-4 py-3.5 last:border-b-0 divider sm:px-5 hover:bg-[var(--surface-2)]"
    >
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
    </motion.li>
  );
};

const FollowUpsPage = (): JSX.Element => {
  const [params, setParams] = useSearchParams();
  const scope = (SCOPES.find((s) => s.id === params.get("scope"))?.id ?? "today") as FollowUpScope;
  const mine = params.get("mine") === "1";
  const page = Number(params.get("page") ?? 1);
  const { data, isLoading, isError, refetch } = useFollowUps(scope, mine, page);
  const counts = data?.meta.counts;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const visible = (data?.items ?? []).filter((f) => !hidden.has(f.id));

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
          <Segmented
            label="Whose follow-ups"
            value={mine ? "mine" : "all"}
            onChange={(v) => set({ mine: v === "mine" ? "1" : undefined })}
            options={[{ value: "all", label: "Everyone" }, { value: "mine", label: "Mine" }]}
          />
        }
      />
      <div className="panel overflow-hidden">
        <Tabs
          className="px-4 sm:px-5"
          value={scope}
          onChange={(v) => { setHidden(new Set()); set({ scope: v === "today" ? undefined : v }); }}
          tabs={SCOPES.map((s) => {
            const n = countFor(s.id);
            return {
              value: s.id,
              label: s.label,
              badge: n !== undefined && n > 0 ? (
                <span className="num rounded-md px-1.5 text-[11px] font-semibold" style={{ background: s.id === "overdue" ? "var(--danger-soft)" : "var(--surface-3)", color: s.id === "overdue" ? "var(--danger)" : "var(--text-2)" }}>{n}</span>
              ) : undefined,
            };
          })}
        />
        {isError ? (
          <div className="p-4"><ErrorNote message="Follow-ups didn't load." onRetry={() => refetch()} /></div>
        ) : isLoading ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : !visible.length ? (
          <EmptyState
            icon={scope === "overdue" ? <CalendarCheck className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
            title={scope === "overdue" ? "Nothing overdue" : scope === "today" ? "Nothing due today" : scope === "done" ? "No completed follow-ups yet" : "Nothing scheduled"}
            hint={scope === "overdue" ? "Every follow-up is on time." : "Schedule follow-ups from a lead once it's past the New stage."}
          />
        ) : (
          <ul>
            <AnimatePresence initial={false}>
              {visible.map((f, i) => (
                <Row
                  key={f.id}
                  f={f}
                  index={i}
                  onLeave={(id) => setHidden((h) => new Set(h).add(id))}
                  onReturn={(id) => setHidden((h) => { const n = new Set(h); n.delete(id); return n; })}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {data && data.items.length > 0 && <Pagination meta={data.meta} onPage={(p) => set({ page: String(p) })} noun="follow-ups" />}
      </div>
    </div>
  );
};

export default FollowUpsPage;
