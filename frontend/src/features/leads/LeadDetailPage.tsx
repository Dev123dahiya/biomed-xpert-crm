import {
  ArrowLeft, Building2, CalendarPlus, Check, CheckCircle2, ChevronDown, Circle, Download, ExternalLink, FileText, Mail, MapPin,
  MessageCircle, MoreHorizontal, Pencil, Phone, Trash2, Trophy, Upload, XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { DetailRows, HoverCard, HoverTitle, Tooltip } from "../../components/ui/HoverCard";
import { DateHint } from "../../components/ui/Figure";
import { easeOut } from "../../lib/motion";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Avatar } from "../../components/ui/Avatar";
import { PriorityBadge, StageBadge, StageDot } from "../../components/ui/Badges";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field, Input, MoneyInput, Select, Textarea } from "../../components/ui/Field";
import { Menu } from "../../components/ui/Menu";
import { Modal } from "../../components/ui/Modal";
import { ErrorNote, Skeleton } from "../../components/ui/States";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLead, useLeadMutations } from "../../hooks/useLeads";
import { useLeadSources, useTeam } from "../../hooks/useMeta";
import { apiError, assetUrl } from "../../lib/api";
import { cn } from "../../lib/cn";
import { downloadFile } from "../../lib/download";
import { dateTime, dayDiff, fullDateTime, inr, num, phoneDigits, relativeDate, shortDate, timeAgo, timeOnly, toDateInput } from "../../lib/format";
import { useDocumentTitle } from "../../lib/hooks";
import { isTerminal, nextForwardStages, OPEN_ORDER, STAGE_META, stageLabel } from "../../lib/stages";
import type { LeadDetail, LeadStatus, Priority } from "../../types";
import { linesTotal, ProductLinesEditor, type Line } from "./ProductLines";
import { LostForm, WonForm } from "./WonLostForms";

const Section = ({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }): JSX.Element => (
  <motion.section
    className={cn("panel", className)}
    initial={{ opacity: 0, y: 8 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "0px 0px -30px 0px" }}
    transition={{ duration: 0.4, ease: easeOut }}
  >
    <header className="flex items-center justify-between gap-3 border-b px-5 py-3.5 divider">
      <h2 className="section-title">{title}</h2>
      {action}
    </header>
    <div className="p-5">{children}</div>
  </motion.section>
);

/* ---------------------------------------------------------------- */

const StageTrack = ({ lead, onMove, busy }: { lead: LeadDetail; onMove: (s: LeadStatus) => void; busy: boolean }): JSX.Element => {
  const reachedAt = new Map<LeadStatus, string>();
  lead.timeline.forEach((t) => reachedAt.set(t.toStatus, t.createdAt));
  const currentIdx = OPEN_ORDER.indexOf(lead.status);
  const closed = isTerminal(lead.status);
  const steps: LeadStatus[] = [...OPEN_ORDER, closed ? lead.status : "WON"];

  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Stage progress">
      {steps.map((s, i) => {
        const done = closed ? true : i < currentIdx;
        const current = closed ? i === steps.length - 1 : i === currentIdx;
        const future = !done && !current;
        const clickable = future && !closed && i < OPEN_ORDER.length && !busy;
        const color = STAGE_META[s].color;
        return (
          <li key={s}>
            <HoverCard
              width={222}
              side="bottom"
              content={
                <>
                  <HoverTitle sub={STAGE_META[s].hint}>{stageLabel(s)}</HoverTitle>
                  <div className="border-t pt-2 divider">
                    <DetailRows
                      rows={[
                        ["Status", done && !current ? "Passed" : current ? "Current stage" : "Not reached"],
                        reachedAt.has(s) ? ["Reached", fullDateTime(reachedAt.get(s))] : null,
                      ]}
                    />
                  </div>
                  {clickable && <div className="muted mt-2 text-[11px]">Click to move the lead here</div>}
                </>
              }
            >
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onMove(s)}
              className={cn("group w-full text-left", clickable && "cursor-pointer")}
            >
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color, transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: done || current ? 1 : 0 }}
                  transition={{ duration: 0.55, ease: easeOut, delay: i * 0.09 }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {done && !current ? (
                  <Check className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                ) : (
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: current ? color : "var(--border-strong)" }} />
                )}
                <span className={cn("truncate text-xs", current ? "font-semibold" : future ? "muted" : "text-2", clickable && "group-hover:underline")}>
                  {i === steps.length - 1 && !closed ? "Closed" : stageLabel(s)}
                </span>
              </div>
              <div className="muted mt-0.5 hidden truncate text-[11px] sm:block">{reachedAt.has(s) ? shortDate(reachedAt.get(s)) : " "}</div>
            </button>
            </HoverCard>
          </li>
        );
      })}
    </ol>
  );
};

/* ---------------------------------------------------------------- */

const EditLeadForm = ({ lead, onDone }: { lead: LeadDetail; onDone: () => void }): JSX.Element => {
  const { update } = useLeadMutations(lead.id);
  const { data: sources } = useLeadSources();
  const { toast } = useToast();
  const [form, setForm] = useState({
    approxValue: String(lead.approxValue),
    priority: lead.priority as Priority,
    sourceId: lead.source?.id ?? "",
    sourceOther: lead.sourceOther ?? "",
    notes: lead.notes ?? "",
  });
  const othersId = sources?.find((s) => s.name.toLowerCase() === "others")?.id;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        approxValue: Number(form.approxValue || 0),
        priority: form.priority,
        sourceId: form.sourceId || undefined,
        sourceOther: form.sourceId === othersId ? form.sourceOther : undefined,
        notes: form.notes,
      });
      toast("Lead updated");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Approximate value" htmlFor="e-val"><MoneyInput id="e-val" value={form.approxValue} onChange={(e) => setForm({ ...form, approxValue: e.target.value })} /></Field>
        <Field label="Priority" htmlFor="e-pri">
          <Select id="e-pri" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
            <option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
          </Select>
        </Field>
      </div>
      <Field label="Source" htmlFor="e-src">
        <Select id="e-src" value={form.sourceId} onChange={(e) => setForm({ ...form, sourceId: e.target.value })}>
          {sources?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      {form.sourceId === othersId && (
        <Field label="Describe the source" htmlFor="e-srco"><Input id="e-srco" value={form.sourceOther} onChange={(e) => setForm({ ...form, sourceOther: e.target.value })} /></Field>
      )}
      <Field label="Notes" htmlFor="e-notes"><Textarea id="e-notes" rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
        <button className="btn btn-primary" disabled={update.isPending}>{update.isPending && <Spinner />} Save changes</button>
      </div>
    </form>
  );
};

/* ---------------------------------------------------------------- */

const EquipmentSection = ({ lead }: { lead: LeadDetail }): JSX.Element => {
  const { setProducts, update } = useLeadMutations(lead.id);
  const { toast } = useToast();
  const toLines = (l: LeadDetail): Line[] =>
    l.products.map((p) => ({ productId: p.productId, name: p.name ?? "Product", detail: `${p.make ?? ""} ${p.model ?? ""}`.trim(), quantity: p.quantity, price: p.price }));
  const [lines, setLines] = useState<Line[]>(() => toLines(lead));
  const original = useMemo(() => JSON.stringify(toLines(lead)), [lead]);
  useEffect(() => setLines(toLines(lead)), [lead]);
  const dirty = JSON.stringify(lines) !== original;
  const locked = isTerminal(lead.status);
  const total = linesTotal(lines);

  const save = async () => {
    try {
      await setProducts.mutateAsync(lines.map((l) => ({ productId: l.productId, quantity: l.quantity, price: l.price })));
      toast("Equipment saved");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <Section
      title={`Equipment${lead.products.length ? ` (${lead.products.length})` : ""}`}
      action={
        !locked && total > 0 && Math.round(total) !== Math.round(lead.approxValue) && !dirty ? (
          <button className="btn btn-ghost btn-sm" onClick={() => update.mutate({ approxValue: total }, { onSuccess: () => toast("Deal value set to equipment total") })}>
            Set value to {inr(total)}
          </button>
        ) : undefined
      }
    >
      {locked && lines.length === 0 ? (
        <p className="muted text-sm">No equipment was recorded on this lead.</p>
      ) : (
        <ProductLinesEditor lines={lines} onChange={setLines} readOnly={locked} />
      )}
      {dirty && (
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn btn-sm" onClick={() => setLines(toLines(lead))}>Discard</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={setProducts.isPending}>{setProducts.isPending && <Spinner />} Save equipment</button>
        </div>
      )}
    </Section>
  );
};

const QuotesSection = ({ lead }: { lead: LeadDetail }): JSX.Element => {
  const { addQuote, removeQuote } = useLeadMutations(lead.id);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ quoteNumber: "", quoteDate: toDateInput(new Date()), remarks: "" });
  const [file, setFile] = useState<File | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file && file.type !== "application/pdf") return toast("Quotes must be PDF files", "error");
    try {
      await addQuote.mutateAsync({ ...form, quoteDate: new Date(`${form.quoteDate}T12:00`).toISOString(), file });
      toast("Quote added");
      setOpen(false);
      setForm({ quoteNumber: "", quoteDate: toDateInput(new Date()), remarks: "" });
      setFile(null);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <Section title="Quotations" action={<button className="btn btn-sm" onClick={() => setOpen(true)}><Upload className="h-3.5 w-3.5" /> Add quote</button>}>
      {lead.quotes.length === 0 ? (
        <p className="muted text-sm">No quotations yet. Attach the PDF you sent so anyone on the team can find it.</p>
      ) : (
        <ul className="-my-2 divide-y" style={{ borderColor: "var(--border)" }}>
          {lead.quotes.map((q) => (
            <li key={q.id} className="flex items-center gap-3 py-2.5 divider">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--surface-3)" }}>
                <FileText className="h-4 w-4" style={{ color: "var(--st-quote)" }} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{q.quoteNumber}</div>
                <div className="muted truncate text-xs">{shortDate(q.quoteDate)}{q.remarks ? `, ${q.remarks}` : ""}</div>
              </div>
              {q.fileUrl && (
                <a className="btn btn-ghost btn-sm" href={assetUrl(q.fileUrl)} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" /> Open PDF
                </a>
              )}
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(q.id)} aria-label={`Delete quote ${q.quoteNumber}`}><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="Add quotation" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quote number" htmlFor="q-num"><Input id="q-num" required value={form.quoteNumber} onChange={(e) => setForm({ ...form, quoteNumber: e.target.value })} placeholder="Q-2025-118" /></Field>
            <Field label="Quote date" htmlFor="q-date"><Input id="q-date" type="date" required value={form.quoteDate} onChange={(e) => setForm({ ...form, quoteDate: e.target.value })} /></Field>
          </div>
          <Field label="PDF file" optional htmlFor="q-file" hint="Up to 10 MB.">
            <label htmlFor="q-file" className="inset flex cursor-pointer items-center gap-3 px-3 py-3 text-sm hover:border-[var(--muted)]">
              <Upload className="muted h-4 w-4" />
              <span className={file ? "" : "muted"}>{file ? file.name : "Choose a PDF"}</span>
            </label>
            <input id="q-file" type="file" accept="application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="Remarks" optional htmlFor="q-rem"><Input id="q-rem" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Includes 2-year CMC" /></Field>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={addQuote.isPending || !form.quoteNumber}>{addQuote.isPending && <Spinner />} Add quote</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this quotation?"
        message="The record and its PDF link are removed from the lead."
        confirmLabel="Delete quote"
        danger
        busy={removeQuote.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await removeQuote.mutateAsync(toDelete!);
            toast("Quote deleted");
          } catch (err) {
            toast(apiError(err).message, "error");
          }
          setToDelete(null);
        }}
      />
    </Section>
  );
};

const FollowUpsSection = ({ lead }: { lead: LeadDetail }): JSX.Element => {
  const { addFollowUp, updateFollowUp, removeFollowUp } = useLeadMutations(lead.id);
  const { toast } = useToast();
  const tomorrow = toDateInput(new Date(Date.now() + 86_400_000));
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("10:00");
  const [note, setNote] = useState("");
  const allowed = lead.status !== "NEW" && !isTerminal(lead.status);
  const open = lead.followUps.filter((f) => !f.done);
  const done = lead.followUps.filter((f) => f.done);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    try {
      await addFollowUp.mutateAsync({ dueAt: new Date(`${date}T${time || "10:00"}`).toISOString(), note: note || undefined });
      toast("Follow-up scheduled");
      setNote("");
      setDate(tomorrow);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  const Row = ({ f }: { f: LeadDetail["followUps"][number] }) => {
    const overdue = !f.done && dayDiff(f.dueAt) < 0;
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }}
        transition={{ duration: 0.25, ease: easeOut }}
        className="group flex items-start gap-2.5 overflow-hidden py-2"
      >
        <button
          className="mt-0.5"
          onClick={() => updateFollowUp.mutate({ followUpId: f.id, done: !f.done }, { onSuccess: () => toast(f.done ? "Marked as not done" : "Follow-up done") })}
          aria-label={f.done ? "Mark as not done" : "Mark as done"}
        >
          {f.done ? <CheckCircle2 className="h-[18px] w-[18px]" style={{ color: "var(--success)" }} /> : <Circle className="h-[18px] w-[18px]" style={{ color: overdue ? "var(--danger)" : "var(--border-strong)" }} />}
        </button>
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm", f.done && "muted line-through")}>{f.note || "Follow-up"}</div>
          <div className="text-xs" style={{ color: overdue ? "var(--danger)" : "var(--muted)" }}>
            <DateHint value={f.dueAt}>{`${relativeDate(f.dueAt)}, ${timeOnly(f.dueAt)}${overdue ? " (overdue)" : ""}`}</DateHint>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm btn-icon opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => removeFollowUp.mutate(f.id)} aria-label="Delete follow-up">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </motion.li>
    );
  };

  return (
    <Section title="Follow-ups">
      {lead.followUps.length === 0 && <p className="muted mb-3 text-sm">Nothing scheduled.</p>}
      <ul className={open.length ? "-mt-2 mb-2" : undefined}>
        <AnimatePresence initial={false}>{open.map((f) => <Row key={f.id} f={f} />)}</AnimatePresence>
      </ul>
      {allowed ? (
        <form onSubmit={add} className="inset space-y-2 p-3">
          <Input className="h-9" placeholder="Call to confirm demo date" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Follow-up note" />
          <div className="flex gap-2">
            <Input className="h-9 flex-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" required />
            <Input className="h-9 w-[132px]" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
          </div>
          <button className="btn btn-sm w-full" disabled={addFollowUp.isPending || !date}>
            {addFollowUp.isPending ? <Spinner /> : <CalendarPlus className="h-3.5 w-3.5" />} Schedule follow-up
          </button>
        </form>
      ) : lead.status === "NEW" ? (
        <p className="muted text-xs">Move this lead to Contacted to schedule follow-ups.</p>
      ) : null}
      {done.length > 0 && (
        <details className="mt-3">
          <summary className="muted cursor-pointer text-xs font-medium">{done.length} completed</summary>
          <ul className="mt-1"><AnimatePresence initial={false}>{done.map((f) => <Row key={f.id} f={f} />)}</AnimatePresence></ul>
        </details>
      )}
    </Section>
  );
};

const Timeline = ({ lead }: { lead: LeadDetail }): JSX.Element => {
  const items = [...lead.timeline].reverse();
  return (
    <Section title="History">
      <ol className="relative">
        {items.map((t, i) => (
          <motion.li
            key={t.id}
            className="relative flex gap-3 pb-5 last:pb-0"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.3, ease: easeOut }}
          >
            {i < items.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px" style={{ background: "var(--border)" }} aria-hidden />}
            <span className="relative mt-1.5"><StageDot status={t.toStatus} size={11} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-sm">
                {t.fromStatus ? (
                  <>Moved from <span className="font-medium">{stageLabel(t.fromStatus)}</span> to <span className="font-medium">{stageLabel(t.toStatus)}</span></>
                ) : (
                  <>Lead created as <span className="font-medium">{stageLabel(t.toStatus)}</span></>
                )}
              </div>
              {t.note && !["Lead created", "Marked won", "Marked lost"].includes(t.note) && <div className="text-2 mt-0.5 text-sm">"{t.note}"</div>}
              <div className="muted mt-0.5 text-xs">{t.actor ? `${t.actor}, ` : ""}<DateHint value={t.createdAt} /></div>
            </div>
          </motion.li>
        ))}
      </ol>
    </Section>
  );
};

/* ---------------------------------------------------------------- */

const LeadDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, isError, refetch } = useLead(id);
  const mut = useLeadMutations(id);
  const { isAdmin } = useAuth();
  const { data: team } = useTeam();
  const { toast } = useToast();
  const navigate = useNavigate();
  useDocumentTitle(lead ? lead.customer?.company ?? lead.customer?.customerName : "Lead");

  const [wonOpen, setWonOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moveTo, setMoveTo] = useState<LeadStatus | null>(null);
  const [moveNote, setMoveNote] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[200px] rounded-[14px]" />
        <div className="grid gap-5 lg:grid-cols-3"><Skeleton className="h-[300px] rounded-[14px] lg:col-span-2" /><Skeleton className="h-[300px] rounded-[14px]" /></div>
      </div>
    );
  }
  if (isError || !lead) return <ErrorNote message="This lead couldn't be loaded. It may have been deleted." onRetry={() => refetch()} />;

  const c = lead.customer;
  const terminal = isTerminal(lead.status);
  const forward = nextForwardStages(lead.status);
  const next = forward[0];
  const title = c?.company ?? c?.customerName ?? "Lead";
  const phone = phoneDigits(c?.phone);
  const value = lead.wonDeal?.finalValue ?? lead.approxValue;

  const confirmMove = async () => {
    if (!moveTo) return;
    try {
      await mut.changeStatus.mutateAsync({ toStatus: moveTo, note: moveNote || undefined });
      toast(`Moved to ${stageLabel(moveTo).toLowerCase()}`);
    } catch (err) {
      toast(apiError(err).message, "error");
    }
    setMoveTo(null);
    setMoveNote("");
  };

  const reassign = async (ownerId: string) => {
    try {
      await mut.update.mutateAsync({ ownerId: ownerId || null });
      toast(ownerId ? "Owner changed" : "Lead unassigned");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/leads" className="muted inline-flex items-center gap-1.5 text-sm hover:underline">
        <ArrowLeft className="h-4 w-4" /> Pipeline
      </Link>

      {/* Header */}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StageBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <span className="muted text-xs">Opened {shortDate(lead.createdAt)}</span>
            </div>
            <h1 className="page-title truncate">{title}</h1>
            <div className="text-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {c?.company && c.customerName && <span>{c.customerName}</span>}
              {c?.city && <span className="inline-flex items-center gap-1"><MapPin className="muted h-3.5 w-3.5" />{c.city}</span>}
              {c && <Link to={`/customers/${c.id}`} className="inline-flex items-center gap-1 font-medium hover:underline" style={{ color: "var(--primary-text)" }}><Building2 className="h-3.5 w-3.5" /> Customer profile</Link>}
            </div>
          </div>
          <HoverCard
            width={236}
            side="left"
            content={
              <>
                <HoverTitle sub={lead.wonDeal ? "Final value on the purchase order" : "Estimate, before negotiation"}>
                  {lead.wonDeal ? "Order value" : "Deal value"}
                </HoverTitle>
                <div className="border-t pt-2 divider">
                  <DetailRows
                    rows={[
                      ["Exact", inr(value)],
                      lead.products.length > 0 && ["Equipment total", inr(lead.products.reduce((s2, p) => s2 + p.lineTotal, 0))],
                      lead.products.length > 0 && ["Line items", num(lead.products.length)],
                      lead.wonDeal && lead.wonDeal.finalValue !== lead.approxValue ? ["Originally estimated", inr(lead.approxValue)] : null,
                    ]}
                  />
                </div>
              </>
            }
          >
          <div className="text-right">
            <div className="muted text-xs">{lead.wonDeal ? "Order value" : "Deal value"}</div>
            <AnimatedNumber value={value} format={(n) => inr(Math.round(n))} duration={1} className="condensed num block text-[32px] leading-tight" />
          </div>
          </HoverCard>
        </div>

        <div className="mt-6"><StageTrack lead={lead} onMove={(s) => setMoveTo(s)} busy={mut.changeStatus.isPending} /></div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-5 divider">
          {!terminal && next && (
            <button className="btn btn-primary" onClick={() => setMoveTo(next)}>
              Move to {stageLabel(next).toLowerCase()}
            </button>
          )}
          {!terminal && forward.length > 1 && (
            <Menu
              align="left"
              trigger={({ toggle }) => <button className="btn" onClick={toggle}>Skip to <ChevronDown className="h-3.5 w-3.5" /></button>}
            >
              {(close) => forward.slice(1).map((s) => (
                <button key={s} className="menu-item" onClick={() => { close(); setMoveTo(s); }}><StageDot status={s} /> {stageLabel(s)}</button>
              ))}
            </Menu>
          )}
          {!terminal && (
            <>
              <button className="btn btn-success" onClick={() => setWonOpen(true)}><Trophy className="h-4 w-4" /> Won</button>
              <button className="btn btn-soft-danger" onClick={() => setLostOpen(true)}><XCircle className="h-4 w-4" /> Lost</button>
            </>
          )}
          <div className="flex-1" />
          {c?.phone && (
            <>
              <a className="btn btn-ghost" href={`tel:+${phone}`}><Phone className="h-4 w-4" /> <span className="hidden sm:inline">Call</span></a>
              <a className="btn btn-ghost" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> <span className="hidden sm:inline">WhatsApp</span></a>
            </>
          )}
          {c?.email && <a className="btn btn-ghost" href={`mailto:${c.email}`}><Mail className="h-4 w-4" /> <span className="hidden sm:inline">Email</span></a>}
          <Menu
            trigger={({ toggle }) => <button className="btn btn-ghost btn-icon" onClick={toggle} aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>}
          >
            {(close) => (
              <>
                <button className="menu-item" onClick={() => { close(); setEditOpen(true); }}><Pencil className="h-4 w-4" /> Edit details</button>
                <button className="menu-item" onClick={async () => { close(); try { await downloadFile(`/export/leads/${lead.id}?format=xlsx`); toast("Excel file downloaded"); } catch (err) { toast(apiError(err).message, "error"); } }}>
                  <Download className="h-4 w-4" /> Export to Excel
                </button>
                {isAdmin && (
                  <>
                    <div className="my-1 border-t divider" />
                    <button className="menu-item" style={{ color: "var(--danger)" }} onClick={() => { close(); setDeleteOpen(true); }}><Trash2 className="h-4 w-4" /> Delete lead</button>
                  </>
                )}
              </>
            )}
          </Menu>
        </div>
      </section>

      {lead.wonDeal && (
        <section className="panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4" style={{ borderColor: "color-mix(in srgb, var(--success) 35%, var(--border))", background: "var(--success-soft)" }}>
          <Trophy className="h-5 w-5" style={{ color: "var(--success)" }} />
          <div><div className="muted text-xs">Order value</div><div className="num font-semibold">{inr(lead.wonDeal.finalValue)}</div></div>
          <div><div className="muted text-xs">Invoice</div><div className="font-medium">{lead.wonDeal.invoiceNumber || "Not added"}</div></div>
          <div><div className="muted text-xs">Order date</div><div className="font-medium">{shortDate(lead.wonDeal.closingDate) || "Not added"}</div></div>
          <div className="min-w-0 flex-1"><div className="muted text-xs">Equipment supplied</div><div className="truncate font-medium">{lead.wonDeal.products.map((p) => `${p.name} × ${p.quantity}`).join(", ") || "Not added"}</div></div>
          <button className="btn btn-sm" onClick={() => setWonOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
        </section>
      )}
      {lead.lostDeal && (
        <section className="panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4" style={{ borderColor: "color-mix(in srgb, var(--danger) 35%, var(--border))", background: "var(--danger-soft)" }}>
          <XCircle className="h-5 w-5" style={{ color: "var(--danger)" }} />
          <div><div className="muted text-xs">Reason</div><div className="font-semibold">{lead.lostDeal.reason}</div></div>
          <div><div className="muted text-xs">Competitor</div><div className="font-medium">{lead.lostDeal.competitor || "Not known"}</div></div>
          {lead.lostDeal.remarks && <div className="min-w-0 flex-1"><div className="muted text-xs">Remarks</div><div className="truncate">{lead.lostDeal.remarks}</div></div>}
          <button className="btn btn-sm ml-auto" onClick={() => setLostOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
        </section>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <EquipmentSection lead={lead} />
          <QuotesSection lead={lead} />
          <Section title="Notes" action={<button className="btn btn-ghost btn-sm" onClick={() => setEditOpen(true)}><Pencil className="h-3.5 w-3.5" /> Edit</button>}>
            {lead.notes ? <p className="text-2 whitespace-pre-wrap text-sm leading-relaxed">{lead.notes}</p> : <p className="muted text-sm">No notes yet. Capture the requirement, budget and who decides.</p>}
          </Section>
          <Timeline lead={lead} />
        </div>

        <div className="space-y-5">
          <FollowUpsSection lead={lead} />
          <Section title="Details">
            <dl className="space-y-3.5 text-sm">
              <div>
                <dt className="muted mb-1 text-xs">Owner</dt>
                <dd className="flex items-center gap-2">
                  <Avatar name={lead.owner?.name ?? "?"} size={26} />
                  <select className="input h-9 flex-1" value={lead.owner?.id ?? ""} onChange={(e) => reassign(e.target.value)} aria-label="Owner" disabled={mut.update.isPending}>
                    <option value="">Unassigned</option>
                    {team?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    {lead.owner && !team?.some((m) => m.id === lead.owner?.id) && <option value={lead.owner.id}>{lead.owner.name}</option>}
                  </select>
                </dd>
              </div>
              <div className="flex justify-between gap-3"><dt className="muted">Source</dt><dd className="text-right">{lead.source?.name}{lead.sourceOther ? `, ${lead.sourceOther}` : ""}</dd></div>
              <div className="flex justify-between gap-3"><dt className="muted">Created</dt><dd><DateHint value={lead.createdAt}>{shortDate(lead.createdAt)}</DateHint></dd></div>
              <div className="flex justify-between gap-3"><dt className="muted">Last updated</dt><dd><DateHint value={lead.updatedAt} /></dd></div>
            </dl>
          </Section>
          {c && (
            <Section title="Contact" action={<Link to={`/customers/${c.id}`} className="btn btn-ghost btn-sm">Profile</Link>}>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="muted">Name</dt><dd className="text-right font-medium">{c.customerName}</dd></div>
                {c.phone && <div className="flex justify-between gap-3"><dt className="muted">Phone</dt><dd><a className="num hover:underline" href={`tel:+${phone}`}>{c.phone}</a></dd></div>}
                {c.email && <div className="flex justify-between gap-3"><dt className="muted">Email</dt><dd className="min-w-0 truncate"><a className="hover:underline" href={`mailto:${c.email}`}>{c.email}</a></dd></div>}
                {c.gstin && <div className="flex justify-between gap-3"><dt className="muted">GSTIN</dt><dd className="num">{c.gstin}</dd></div>}
                {c.city && <div className="flex justify-between gap-3"><dt className="muted">City</dt><dd>{c.city}</dd></div>}
              </dl>
            </Section>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Modal open={Boolean(moveTo)} title={moveTo ? `Move to ${stageLabel(moveTo).toLowerCase()}?` : ""} description={moveTo ? STAGE_META[moveTo].hint : undefined} onClose={() => setMoveTo(null)}
        footer={<><button className="btn" onClick={() => setMoveTo(null)}>Cancel</button><button className="btn btn-primary" onClick={confirmMove} disabled={mut.changeStatus.isPending}>{mut.changeStatus.isPending && <Spinner />} Move lead</button></>}
      >
        <Field label="Note for the history" optional htmlFor="move-note">
          <Textarea id="move-note" rows={2} value={moveNote} onChange={(e) => setMoveNote(e.target.value)} placeholder={moveTo === "QUOTE_SHARED" ? "Sent Q-118 by email to the purchase officer" : "Spoke to Dr. Mehta, demo next week"} />
        </Field>
        {moveTo === "QUOTE_SHARED" && <p className="hint">Attach the quotation PDF from the Quotations section afterwards.</p>}
      </Modal>
      <Modal open={wonOpen} title={lead.wonDeal ? "Edit won deal" : `Mark ${title} as won`} description={lead.wonDeal ? undefined : "Record the order. Equipment lines are copied from the lead."} onClose={() => setWonOpen(false)} width={620}>
        <WonForm leadId={lead.id} existing={lead.wonDeal} leadProducts={lead.products} suggestedValue={lead.approxValue} onDone={() => setWonOpen(false)} />
      </Modal>
      <Modal open={lostOpen} title={lead.lostDeal ? "Edit lost deal" : `Mark ${title} as lost`} onClose={() => setLostOpen(false)}>
        <LostForm leadId={lead.id} existing={lead.lostDeal} onDone={() => setLostOpen(false)} />
      </Modal>
      <Modal open={editOpen} title="Edit lead" onClose={() => setEditOpen(false)} width={540}>
        <EditLeadForm lead={lead} onDone={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this lead?"
        message={<>This permanently removes the lead for <b>{title}</b>, with its equipment, quotes, follow-ups and history. Won revenue on this lead is removed from reports.</>}
        confirmLabel="Delete lead"
        danger
        busy={mut.remove.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await mut.remove.mutateAsync(lead.id);
            toast("Lead deleted");
            navigate("/leads", { replace: true });
          } catch (err) {
            toast(apiError(err).message, "error");
            setDeleteOpen(false);
          }
        }}
      />
    </div>
  );
};

export default LeadDetailPage;
