import { ArrowLeft, CheckCircle2, Circle, FileText, Plus, Trophy, XCircle } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiError } from "../../lib/api";
import { inr, shortDate } from "../../lib/format";
import { isTerminal, nextForwardStages, STAGE_META } from "../../lib/stages";
import { PriorityBadge, StageBadge } from "../../components/ui/Badges";
import { CardSkeleton, ErrorNote } from "../../components/ui/States";
import { Input, Select } from "../../components/ui/Field";
import { SlideOver } from "../../components/ui/SlideOver";
import { useToast } from "../../components/ui/Toast";
import { useLead, useLeadMutations } from "../../hooks/useLeads";
import { LostForm, WonForm } from "./WonLostForms";
import type { LeadStatus } from "../../types";

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }): JSX.Element => (
  <div className="card p-5">
    <div className="mb-3 flex items-center justify-between">
      <div className="text-sm font-medium">{title}</div>
      {action}
    </div>
    {children}
  </div>
);

export const LeadDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading, isError } = useLead(id);
  const mut = useLeadMutations(id);
  const { toast } = useToast();

  const [target, setTarget] = useState<LeadStatus | "">("");
  const [wonOpen, setWonOpen] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [fuDate, setFuDate] = useState("");
  const [fuTime, setFuTime] = useState("09:00");

  if (isLoading) return <div className="space-y-4"><CardSkeleton className="h-24" /><CardSkeleton className="h-40" /></div>;
  if (isError || !lead) return <ErrorNote message="Could not load this lead." />;

  const terminal = isTerminal(lead.status);
  const forward = nextForwardStages(lead.status);

  const advance = async (): Promise<void> => {
    if (!target) return;
    try {
      await mut.changeStatus.mutateAsync({ toStatus: target });
      toast(`Moved to ${STAGE_META[target].label}`);
      setTarget("");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  const addFollowUp = async (): Promise<void> => {
    if (!fuDate) return;
    try {
      await mut.addFollowUp.mutateAsync({ dueAt: new Date(`${fuDate}T${fuTime}`).toISOString() });
      toast("Follow-up added");
      setFuDate("");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/leads" className="muted flex items-center gap-1 text-sm"><ArrowLeft className="h-4 w-4" /> Back to pipeline</Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-display text-xl font-semibold">{lead.customer?.customerName}</div>
            <div className="muted text-sm">{lead.customer?.company}</div>
            <div className="mt-2 flex items-center gap-2">
              <StageBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <span className="mono muted text-sm">{inr(lead.approxValue)}</span>
            </div>
          </div>
          {!terminal && (
            <div className="flex flex-wrap items-center gap-2">
              {forward.length > 0 && (
                <>
                  <Select value={target} onChange={(e) => setTarget(e.target.value as LeadStatus)} style={{ width: 160 }}>
                    <option value="">Move to...</option>
                    {forward.map((s) => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                  </Select>
                  <button className="btn" onClick={advance} disabled={!target || mut.changeStatus.isPending}>Move</button>
                </>
              )}
              <button className="btn btn-primary" onClick={() => setWonOpen(true)}><Trophy className="h-4 w-4" /> Won</button>
              <button className="btn btn-danger" onClick={() => setLostOpen(true)}><XCircle className="h-4 w-4" /> Lost</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Overview">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="muted">Source</dt><dd>{lead.source?.name}{lead.sourceOther ? ` (${lead.sourceOther})` : ""}</dd>
            <dt className="muted">Owner</dt><dd>{lead.owner?.name ?? "\u2014"}</dd>
            <dt className="muted">Created</dt><dd>{shortDate(lead.createdAt)}</dd>
            <dt className="muted">Phone</dt><dd>{lead.customer?.phone ?? "\u2014"}</dd>
            <dt className="muted">GSTIN</dt><dd>{lead.customer?.gstin ?? "\u2014"}</dd>
          </dl>
          {lead.notes && <p className="muted mt-3 text-sm">{lead.notes}</p>}
        </Section>

        <Section title={`Products (${lead.products.length})`}>
          {lead.products.length === 0 ? (
            <div className="muted text-sm">No products added.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {lead.products.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span>{p.name} <span className="muted">{p.make} {p.model}</span> {"\u00d7"}{p.quantity}</span>
                  <span className="mono">{inr(p.lineTotal)}</span>
                </div>
              ))}
              <div className="mono flex justify-between border-t pt-2 font-medium" style={{ borderColor: "var(--border)" }}>
                <span>Total</span><span>{inr(lead.products.reduce((s, p) => s + p.lineTotal, 0))}</span>
              </div>
            </div>
          )}
        </Section>

        <Section
          title="Follow-ups"
          action={lead.status !== "NEW" && !terminal ? null : undefined}
        >
          {lead.followUps.length === 0 && <div className="muted mb-3 text-sm">None scheduled.</div>}
          <div className="mb-3 space-y-2 text-sm">
            {lead.followUps.map((f) => (
              <div key={f.id} className="flex items-center justify-between">
                <button
                  className="flex items-center gap-2"
                  onClick={() => mut.toggleFollowUp.mutate({ followUpId: f.id, done: !f.done })}
                >
                  {f.done ? <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} /> : <Circle className="muted h-4 w-4" />}
                  <span className={f.done ? "muted line-through" : ""}>{shortDate(f.dueAt)}{f.note ? ` \u00b7 ${f.note}` : ""}</span>
                </button>
              </div>
            ))}
          </div>
          {lead.status !== "NEW" && !terminal && (
            <div className="flex items-center gap-2">
              <Input type="date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} />
              <Input type="time" value={fuTime} onChange={(e) => setFuTime(e.target.value)} style={{ width: 120 }} />
              <button className="btn" onClick={addFollowUp} disabled={!fuDate}><Plus className="h-4 w-4" /></button>
            </div>
          )}
        </Section>

        <Section title="Timeline">
          <div className="space-y-3 text-sm">
            {lead.timeline.map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <StageBadge status={t.toStatus} />
                <span className="muted">{t.fromStatus ? `${t.fromStatus} \u2192 ` : ""}{t.toStatus}</span>
                <span className="muted mono ml-auto text-xs">{shortDate(t.createdAt)}</span>
              </div>
            ))}
          </div>
        </Section>

        {lead.quotes.length > 0 && (
          <Section title="Quotes">
            <div className="space-y-2 text-sm">
              {lead.quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> {q.quoteNumber} {"\u00b7"} {shortDate(q.quoteDate)}</span>
                  {q.fileUrl && <a className="btn btn-ghost" href={q.fileUrl} target="_blank" rel="noreferrer">Open</a>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {lead.wonDeal && (
          <Section title="Won deal">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="muted">Final value</dt><dd className="mono">{inr(lead.wonDeal.finalValue)}</dd>
              <dt className="muted">Invoice</dt><dd>{lead.wonDeal.invoiceNumber ?? "\u2014"}</dd>
              <dt className="muted">Closed</dt><dd>{shortDate(lead.wonDeal.closingDate)}</dd>
            </dl>
          </Section>
        )}
        {lead.lostDeal && (
          <Section title="Lost deal">
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="muted">Reason</dt><dd>{lead.lostDeal.reason}</dd>
              <dt className="muted">Competitor</dt><dd>{lead.lostDeal.competitor ?? "\u2014"}</dd>
            </dl>
          </Section>
        )}
      </div>

      <SlideOver open={wonOpen} title="Mark deal won" onClose={() => setWonOpen(false)}>
        <WonForm leadId={lead.id} onDone={() => setWonOpen(false)} />
      </SlideOver>
      <SlideOver open={lostOpen} title="Mark deal lost" onClose={() => setLostOpen(false)}>
        <LostForm leadId={lead.id} onDone={() => setLostOpen(false)} />
      </SlideOver>
    </div>
  );
};
