import { ArrowLeft, Download, KanbanSquare, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { AnimatedNumber } from "../../components/ui/AnimatedNumber";
import { DetailRows, HoverCard, HoverTitle, Tooltip } from "../../components/ui/HoverCard";
import { DateHint } from "../../components/ui/Figure";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCreate } from "../../components/layout/CreateContext";
import { Avatar } from "../../components/ui/Avatar";
import { PriorityBadge, StageBadge } from "../../components/ui/Badges";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { SlideOver } from "../../components/ui/Modal";
import { customerOption } from "../../components/ui/pickers";
import { EmptyState, ErrorNote, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { useCustomer, useCustomerLeads, useCustomerMutations } from "../../hooks/useCustomers";
import { apiError } from "../../lib/api";
import { downloadFile } from "../../lib/download";
import { fullDateTime, inr, inrCompact, num, phoneDigits, relativeDate, shortDate } from "../../lib/format";
import { useDocumentTitle } from "../../lib/hooks";
import { isTerminal } from "../../lib/stages";
import { CustomerForm } from "./CustomerForm";

const Stat = ({ label, value, format, tone, empty, hint, rows }: { label: string; value: number; format: (n: number) => string; tone?: string; empty?: string; hint?: string; rows?: ([React.ReactNode, React.ReactNode] | null | false | undefined)[] }): JSX.Element => (
  <HoverCard
    width={230}
    side="bottom"
    content={
      <>
        <HoverTitle sub={hint}>{label}</HoverTitle>
        <div className="border-t pt-2 divider"><DetailRows rows={rows ?? [["Exact", empty ?? format(value)]]} /></div>
      </>
    }
  >
  <div className="w-full px-5 py-4">
    <div className="muted text-xs">{label}</div>
    {empty ? (
      <div className="condensed mt-1 text-[24px] leading-none">{empty}</div>
    ) : (
      <AnimatedNumber value={value} format={format} className="condensed num mt-1 block text-[24px] leading-none" style={{ color: tone }} />
    )}
  </div>
  </HoverCard>
);

const CustomerDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const { data: c, isLoading, isError, refetch } = useCustomer(id);
  const { data: leads = [] } = useCustomerLeads(id);
  const { remove } = useCustomerMutations();
  const create = useCreate();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useDocumentTitle(c?.customerName ?? "Customer");

  if (isLoading) return <div className="space-y-5"><Skeleton className="h-5 w-32" /><Skeleton className="h-[180px] rounded-[14px]" /><Skeleton className="h-[320px] rounded-[14px]" /></div>;
  if (isError || !c) return <ErrorNote message="This customer couldn't be loaded. It may have been deleted." onRetry={() => refetch()} />;

  const open = leads.filter((l) => !isTerminal(l.status));
  const won = leads.filter((l) => l.status === "WON");
  const lost = leads.filter((l) => l.status === "LOST");
  const winRate = won.length + lost.length ? Math.round((won.length / (won.length + lost.length)) * 100) : null;
  const phone = phoneDigits(c.phone);
  const address = [c.addressLine1, c.addressLine2, c.city, c.state, c.pinCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <Link to="/customers" className="muted inline-flex items-center gap-1.5 text-sm hover:underline"><ArrowLeft className="h-4 w-4" /> Customers</Link>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-start gap-5 p-5 sm:p-6">
          <Avatar name={c.company ?? c.customerName} size={56} />
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{c.customerName}</h1>
            <div className="text-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {c.company && <span className="font-medium">{c.company}</span>}
              {c.contactPerson && c.contactPerson !== c.customerName && <span>Contact: {c.contactPerson}</span>}
              {c.city && <span className="inline-flex items-center gap-1"><MapPin className="muted h-3.5 w-3.5" />{c.city}</span>}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => create.openLead(customerOption(c))}><Plus className="h-4 w-4" /> New lead</button>
              {c.phone && <a className="btn" href={`tel:+${phone}`}><Phone className="h-4 w-4" /> Call</a>}
              {c.phone && <a className="btn" href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
              {c.email && <a className="btn" href={`mailto:${c.email}`}><Mail className="h-4 w-4" /> Email</a>}
              <button className="btn btn-ghost" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit</button>
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  try { await downloadFile(`/export/customers/${c.id}?format=xlsx`); toast("Excel file downloaded"); } catch (err) { toast(apiError(err).message, "error"); }
                }}
              >
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 border-t divider sm:grid-cols-4 [&>*:not(:first-child)]:border-l [&>*]:border-[var(--border)]">
          <Stat
            label="Total business"
            value={c.totalValue}
            format={inrCompact}
            hint="Sum of every won deal with this customer"
            rows={[["Exact", inr(c.totalValue)], ["Deals won", num(won.length)], won.length > 0 && ["Average deal", inr(Math.round(c.totalValue / won.length))]]}
          />
          <Stat
            label="Outstanding balance"
            value={c.balance}
            format={inrCompact}
            tone={c.balance > 0 ? "var(--warning)" : undefined}
            hint="Amount still owed, entered by hand"
            rows={[["Exact", inr(c.balance)]]}
          />
          <Stat
            label="Open pipeline"
            value={open.reduce((s, l) => s + l.approxValue, 0)}
            format={inrCompact}
            hint="Approximate value of leads not yet closed"
            rows={[["Exact", inr(open.reduce((s, l) => s + l.approxValue, 0))], ["Open leads", num(open.length)]]}
          />
          <Stat
            label="Win rate"
            value={winRate ?? 0}
            format={(n) => `${Math.round(n)}%`}
            empty={winRate === null ? "None yet" : undefined}
            hint="Won deals as a share of all closed deals"
            rows={[["Won", num(won.length)], ["Lost", num(lost.length)], ["Still open", num(open.length)]]}
          />
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <section className="panel overflow-hidden lg:col-span-2">
          <header className="flex items-center justify-between border-b px-5 py-3.5 divider">
            <h2 className="section-title">Leads and deals <span className="muted font-normal">({leads.length})</span></h2>
          </header>
          {leads.length === 0 ? (
            <EmptyState compact icon={<KanbanSquare className="h-5 w-5" />} title="No leads yet" hint="Create a lead when this customer enquires about equipment." action={<button className="btn btn-sm" onClick={() => create.openLead(customerOption(c))}><Plus className="h-3.5 w-3.5" /> New lead</button>} />
          ) : (
            <ul>
              {leads.map((l, i) => (
                <motion.li key={l.leadId} className="border-b last:border-b-0 divider" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.3 }}>
                  <HoverCard
                    width={254}
                    side="left"
                    delay={200}
                    content={
                      <>
                        <HoverTitle sub={l.source ? `From ${l.source}` : undefined}>{l.productCount} product{l.productCount === 1 ? "" : "s"}</HoverTitle>
                        <div className="border-t pt-2 divider">
                          <DetailRows
                            rows={[
                              [l.finalValue != null ? "Order value" : "Deal value", inr(l.finalValue ?? l.approxValue)],
                              l.owner ? ["Owner", l.owner] : null,
                              ["Opened", fullDateTime(l.createdAt)],
                              l.closingDate ? ["Ordered", shortDate(l.closingDate)] : null,
                              l.lostReason ? ["Lost because", <span className="font-normal">{l.lostReason}</span>] : null,
                              l.nextFollowUp && !isTerminal(l.status) ? ["Next follow-up", fullDateTime(l.nextFollowUp)] : null,
                              ["Last update", fullDateTime(l.updatedAt)],
                            ]}
                          />
                        </div>
                      </>
                    }
                  >
                  <Link to={`/leads/${l.leadId}`} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-[var(--surface-2)]">
                    <StageBadge status={l.status} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {l.productCount} product{l.productCount === 1 ? "" : "s"}{l.source ? ` from ${l.source}` : ""}
                      </div>
                      <div className="muted text-xs">
                        Opened {shortDate(l.createdAt)}
                        {l.owner ? `, ${l.owner}` : ""}
                        {l.status === "WON" && l.closingDate ? `, ordered ${shortDate(l.closingDate)}` : ""}
                        {l.status === "LOST" && l.lostReason ? `, ${l.lostReason}` : ""}
                        {l.nextFollowUp && !isTerminal(l.status) ? `, follow-up ${relativeDate(l.nextFollowUp).toLowerCase()}` : ""}
                      </div>
                    </div>
                    <PriorityBadge priority={l.priority} />
                    <span className="num w-28 text-right text-sm font-semibold">{inr(l.finalValue ?? l.approxValue)}</span>
                  </Link>
                  </HoverCard>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <header className="border-b px-5 py-3.5 divider"><h2 className="section-title">Profile</h2></header>
          <dl className="space-y-3.5 p-5 text-sm">
            {[
              ["Phone", c.phone ? <a className="num hover:underline" href={`tel:+${phone}`}>{c.phone}</a> : null],
              ["Email", c.email ? <a className="hover:underline" href={`mailto:${c.email}`}>{c.email}</a> : null],
              ["GSTIN", c.gstin ? <span className="num">{c.gstin}</span> : null],
              ["Address", address || null],
              ["Customer since", c.createdAt ? <DateHint value={c.createdAt}>{shortDate(c.createdAt)}</DateHint> : null],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="muted text-xs">{k}</dt>
                <dd className="mt-0.5 break-words">{v ?? <span className="muted">Not added</span>}</dd>
              </div>
            ))}
          </dl>
          {leads.length === 0 && (
            <div className="border-t px-5 py-3 divider">
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setDeleting(true)}><Trash2 className="h-3.5 w-3.5" /> Delete customer</button>
            </div>
          )}
        </section>
      </div>

      <SlideOver open={editing} title="Edit customer" onClose={() => setEditing(false)} width={540}>
        {editing && <CustomerForm existing={c} onDone={() => setEditing(false)} />}
      </SlideOver>
      <ConfirmDialog
        open={deleting}
        title={`Delete ${c.customerName}?`}
        message="This customer has no leads, so nothing else is affected. This can't be undone."
        confirmLabel="Delete customer"
        danger
        busy={remove.isPending}
        onCancel={() => setDeleting(false)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(c.id);
            toast("Customer deleted");
            navigate("/customers", { replace: true });
          } catch (err) {
            toast(apiError(err).message, "error");
            setDeleting(false);
          }
        }}
      />
    </div>
  );
};

export default CustomerDetailPage;
