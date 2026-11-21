import { ArrowLeft, Download, KanbanSquare, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { inr, inrCompact, phoneDigits, relativeDate, shortDate } from "../../lib/format";
import { useDocumentTitle } from "../../lib/hooks";
import { isTerminal } from "../../lib/stages";
import { CustomerForm } from "./CustomerForm";

const Stat = ({ label, value, tone }: { label: string; value: string; tone?: string }): JSX.Element => (
  <div className="px-5 py-4">
    <div className="muted text-xs">{label}</div>
    <div className="condensed num mt-1 text-[26px] font-semibold leading-none" style={{ color: tone }}>{value}</div>
  </div>
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
          <Stat label="Total business" value={inrCompact(c.totalValue)} />
          <Stat label="Outstanding balance" value={inrCompact(c.balance)} tone={c.balance > 0 ? "var(--warning)" : undefined} />
          <Stat label="Open pipeline" value={inrCompact(open.reduce((s, l) => s + l.approxValue, 0))} />
          <Stat label="Win rate" value={winRate === null ? "None yet" : `${winRate}%`} />
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
              {leads.map((l) => (
                <li key={l.leadId} className="border-b last:border-b-0 divider">
                  <Link to={`/leads/${l.leadId}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-[var(--surface-2)]">
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
                </li>
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
              ["Customer since", c.createdAt ? shortDate(c.createdAt) : null],
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
