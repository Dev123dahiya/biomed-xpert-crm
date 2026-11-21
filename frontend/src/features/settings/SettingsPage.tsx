import { Building2, Check, KeyRound, Monitor, Moon, Palette, Pencil, Plus, Radio, Sun, Trash2, UserPlus, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { spring } from "../../lib/motion";
import { useAuth } from "../../auth/AuthContext";
import { Avatar } from "../../components/ui/Avatar";
import { RoleBadge } from "../../components/ui/Badges";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Field, Input, MoneyInput, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorNote, Skeleton } from "../../components/ui/States";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLeadSourceMutations, useLeadSources, useRoles } from "../../hooks/useMeta";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import { useUserMutations, useUsers } from "../../hooks/useUsers";
import { apiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import { shortDate } from "../../lib/format";
import { useTheme, type ThemeChoice } from "../../lib/theme";
import type { AppSettings, UserRecord } from "../../types";

const Card = ({ title, sub, children, footer }: { title: string; sub?: string; children: React.ReactNode; footer?: React.ReactNode }): JSX.Element => (
  <section className="panel">
    <header className="border-b px-5 py-4 divider">
      <h2 className="section-title">{title}</h2>
      {sub && <p className="muted mt-0.5 text-sm">{sub}</p>}
    </header>
    <div className="p-5">{children}</div>
    {footer && <div className="flex justify-end gap-2 border-t px-5 py-3 divider">{footer}</div>}
  </section>
);

/* ---------------------------------------------------------------- */

const OrganisationTab = ({ isAdmin }: { isAdmin: boolean }): JSX.Element => {
  const { data, isLoading, isError, refetch } = useSettings();
  const update = useUpdateSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<AppSettings>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  if (isLoading) return <Skeleton className="h-80 rounded-[14px]" />;
  if (isError) return <ErrorNote message="Settings didn't load." onRetry={() => refetch()} />;

  const dirty = JSON.stringify(form) !== JSON.stringify(data);
  const save = async () => {
    const body: Record<string, string | number> = {};
    (Object.keys(form) as (keyof AppSettings)[]).forEach((k) => {
      const v = form[k];
      if (v !== undefined && v !== data?.[k] && !(v === "" && ["orgName", "currency", "listPageSize", "maxProductsPerLead"].includes(k))) body[k] = v;
    });
    if (!Object.keys(body).length) return;
    try {
      await update.mutateAsync(body);
      toast("Settings saved");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };
  const f = (k: keyof AppSettings) => ({ value: form[k] ?? "", disabled: !isAdmin, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="space-y-5">
      {!isAdmin && <p className="inset px-4 py-3 text-sm">Only admins can change organisation settings. You can still change the theme under Appearance.</p>}
      <Card title="Company details" sub="Shown in the sidebar and used on exported documents.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organisation name" htmlFor="s-org"><Input id="s-org" {...f("orgName")} /></Field>
          <Field label="GSTIN" optional htmlFor="s-gst"><Input id="s-gst" className="num uppercase" maxLength={15} {...f("orgGstin")} /></Field>
          <Field label="Phone" optional htmlFor="s-ph"><Input id="s-ph" type="tel" {...f("orgPhone")} /></Field>
          <Field label="Email" optional htmlFor="s-em"><Input id="s-em" type="email" {...f("orgEmail")} /></Field>
          <Field label="Address" optional htmlFor="s-ad" className="sm:col-span-2"><Textarea id="s-ad" rows={2} {...f("orgAddress")} /></Field>
        </div>
      </Card>
      <Card
        title="Sales targets and limits"
        footer={isAdmin ? <button className="btn btn-primary" onClick={save} disabled={!dirty || update.isPending}>{update.isPending && <Spinner />} Save changes</button> : undefined}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly revenue target" htmlFor="s-tgt" hint="Drives the target meter on the dashboard. Leave at 0 to hide it.">
            <MoneyInput id="s-tgt" {...f("monthlyTarget")} />
          </Field>
          <Field label="Currency" htmlFor="s-cur"><Input id="s-cur" {...f("currency")} /></Field>
          <Field label="Rows per page" htmlFor="s-rows"><Input id="s-rows" type="number" min={5} max={100} {...f("listPageSize")} /></Field>
          <Field label="Products per lead" htmlFor="s-max" hint="The API allows up to 15."><Input id="s-max" type="number" min={1} max={15} {...f("maxProductsPerLead")} /></Field>
        </div>
      </Card>
    </div>
  );
};

/* ---------------------------------------------------------------- */

const UserDialog = ({ user, onClose }: { user: UserRecord | "new" | null; onClose: () => void }): JSX.Element => {
  const { data: roles } = useRoles(Boolean(user));
  const { create, update } = useUserMutations();
  const { toast } = useToast();
  const isNew = user === "new";
  const existing = user && user !== "new" ? user : null;
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });

  useEffect(() => {
    if (existing) setForm({ name: existing.name, email: existing.email, password: "", roleId: existing.role.id });
    else if (isNew) setForm({ name: "", email: "", password: "", roleId: roles?.find((r) => r.name === "SALES")?.id ?? roles?.[0]?.id ?? "" });
  }, [user, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) await create.mutateAsync(form);
      else if (existing) await update.mutateAsync({ id: existing.id, name: form.name, email: form.email, roleId: form.roleId, ...(form.password ? { password: form.password } : {}) });
      toast(isNew ? "Teammate added" : "Teammate updated");
      onClose();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };
  const busy = create.isPending || update.isPending;

  return (
    <Modal open={Boolean(user)} title={isNew ? "Add a teammate" : `Edit ${existing?.name}`} description={isNew ? "They sign in with this email and password. Share it with them privately." : undefined} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" htmlFor="u-name"><Input id="u-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Work email" htmlFor="u-email"><Input id="u-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Role" htmlFor="u-role" hint="Admins manage team, settings and can delete leads.">
          <Select id="u-role" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
            {roles?.map((r) => <option key={r.id} value={r.id}>{r.name.charAt(0) + r.name.slice(1).toLowerCase()}</option>)}
          </Select>
        </Field>
        <Field label={isNew ? "Temporary password" : "Reset password"} optional={!isNew} htmlFor="u-pw" hint={isNew ? "At least 8 characters. Ask them to change it from Profile." : "Leave empty to keep their current password."}>
          <Input id="u-pw" type="text" autoComplete="new-password" minLength={8} required={isNew} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} {isNew ? "Add teammate" : "Save changes"}</button>
        </div>
      </form>
    </Modal>
  );
};

const TeamTab = (): JSX.Element => {
  const { user: me } = useAuth();
  const { data, isLoading, isError, refetch } = useUsers(true);
  const { update } = useUserMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<UserRecord | "new" | null>(null);
  const [toggling, setToggling] = useState<UserRecord | null>(null);

  if (isError) return <ErrorNote message="The team list didn't load." onRetry={() => refetch()} />;
  const users = data?.items ?? [];

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 divider">
        <div>
          <h2 className="section-title">Team</h2>
          <p className="muted mt-0.5 text-sm">{users.filter((u) => u.active).length} active members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}><UserPlus className="h-4 w-4" /> Add teammate</button>
      </header>
      {isLoading ? (
        <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id} className={cn("flex flex-wrap items-center gap-3 border-b px-5 py-3.5 last:border-b-0 divider", !u.active && "opacity-60")}>
              <Avatar name={u.name} size={36} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{u.name}{u.id === me?.id && <span className="muted font-normal"> (you)</span>}</div>
                <div className="muted truncate text-xs">{u.email}, joined {shortDate(u.createdAt)}</div>
              </div>
              <RoleBadge role={u.role.name} />
              {!u.active && <span className="pill" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>Deactivated</span>}
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(u)}><Pencil className="h-3.5 w-3.5" /> Edit</button>
              {u.id !== me?.id && (
                <button className="btn btn-ghost btn-sm" onClick={() => setToggling(u)}>{u.active ? "Deactivate" : "Reactivate"}</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <UserDialog user={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.active ? `Deactivate ${toggling?.name}?` : `Reactivate ${toggling?.name}?`}
        message={toggling?.active ? "They won't be able to sign in. Their leads and history stay as they are, and you can reassign their leads." : "They'll be able to sign in again with their existing password."}
        confirmLabel={toggling?.active ? "Deactivate" : "Reactivate"}
        danger={toggling?.active}
        busy={update.isPending}
        onCancel={() => setToggling(null)}
        onConfirm={async () => {
          try {
            await update.mutateAsync({ id: toggling!.id, active: !toggling!.active });
            toast(toggling!.active ? "Teammate deactivated" : "Teammate reactivated");
          } catch (err) {
            toast(apiError(err).message, "error");
          }
          setToggling(null);
        }}
      />
    </section>
  );
};

/* ---------------------------------------------------------------- */

const SourcesTab = ({ isAdmin }: { isAdmin: boolean }): JSX.Element => {
  const { data: sources = [], isLoading } = useLeadSources();
  const { create, update, remove } = useLeadSourceMutations();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);

  const run = async (p: Promise<unknown>, ok: string) => {
    try {
      await p;
      toast(ok);
      return true;
    } catch (err) {
      toast(apiError(err).message, "error");
      return false;
    }
  };

  return (
    <Card title="Lead sources" sub="Where enquiries come from. Used on every lead and in the dashboard's source breakdown.">
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="-mt-2 mb-4">
          {sources.map((s) => (
            <li key={s.id} className="flex items-center gap-2 border-b py-2 last:border-b-0 divider">
              {edit?.id === s.id ? (
                <form className="flex flex-1 items-center gap-2" onSubmit={async (e) => { e.preventDefault(); if (await run(update.mutateAsync(edit), "Source renamed")) setEdit(null); }}>
                  <Input className="h-9 flex-1" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} aria-label="Source name" />
                  <button className="btn btn-sm btn-icon" aria-label="Save"><Check className="h-4 w-4" /></button>
                  <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setEdit(null)} aria-label="Cancel"><X className="h-4 w-4" /></button>
                </form>
              ) : (
                <>
                  <Radio className="muted h-4 w-4" />
                  <span className="flex-1 text-sm">{s.name}</span>
                  {isAdmin && (
                    <>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setEdit({ id: s.id, name: s.name })} aria-label={`Rename ${s.name}`}><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => run(remove.mutateAsync(s.id), "Source removed")} aria-label={`Delete ${s.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {isAdmin && (
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (name.trim() && (await run(create.mutateAsync(name.trim()), "Source added"))) setName(""); }}>
          <Input className="flex-1" placeholder="New source, for example IMA conference" value={name} onChange={(e) => setName(e.target.value)} aria-label="New source name" />
          <button className="btn" disabled={!name.trim() || create.isPending}>{create.isPending ? <Spinner /> : <Plus className="h-4 w-4" />} Add</button>
        </form>
      )}
      <p className="muted mt-3 text-xs">Sources already used by a lead can't be deleted. Keep one named "Others" so people can describe unusual sources.</p>
    </Card>
  );
};

const AppearanceTab = (): JSX.Element => {
  const { choice, setChoice } = useTheme();
  const options: { id: ThemeChoice; label: string; desc: string; icon: JSX.Element }[] = [
    { id: "light", label: "Light", desc: "Best in bright offices and on the road.", icon: <Sun className="h-5 w-5" /> },
    { id: "dark", label: "Dark", desc: "Easier on the eyes in the evening.", icon: <Moon className="h-5 w-5" /> },
    { id: "system", label: "Match device", desc: "Follows your phone or computer setting.", icon: <Monitor className="h-5 w-5" /> },
  ];
  return (
    <Card title="Appearance" sub="Saved on this device only.">
      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={choice === o.id}
            onClick={() => setChoice(o.id)}
            className="inset p-4 text-left transition-colors"
            style={choice === o.id ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--ring)" } : undefined}
          >
            <div className="flex items-center justify-between">{o.icon}{choice === o.id && <Check className="h-4 w-4" style={{ color: "var(--primary)" }} />}</div>
            <div className="mt-3 text-sm font-semibold">{o.label}</div>
            <div className="muted mt-0.5 text-xs">{o.desc}</div>
          </button>
        ))}
      </div>
    </Card>
  );
};

/* ---------------------------------------------------------------- */

const SettingsPage = (): JSX.Element => {
  const { isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = [
    { id: "org", label: "Organisation", icon: Building2 },
    ...(isAdmin ? [{ id: "team", label: "Team", icon: Users }] : []),
    { id: "sources", label: "Lead sources", icon: Radio },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];
  const tab = tabs.find((t) => t.id === params.get("tab"))?.id ?? "org";

  return (
    <div>
      <PageHeader title="Settings" subtitle={isAdmin ? "Organisation, team access and lead sources." : "Your view of the organisation settings, and your theme."} />
      <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="scroll-thin flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setParams(t.id === "org" ? {} : { tab: t.id }, { replace: true })}
              className={cn("menu-item relative shrink-0 whitespace-nowrap !bg-transparent hover:!bg-[var(--surface-2)]", tab === t.id && "font-medium")}
              aria-current={tab === t.id ? "page" : undefined}
            >
              {tab === t.id && <motion.span layoutId="settings-pill" className="absolute inset-0 rounded-[7px]" style={{ background: "var(--surface-3)" }} transition={spring} />}
              <t.icon className="relative h-4 w-4" /> <span className="relative">{t.label}</span>
            </button>
          ))}
          {isAdmin && (
            <p className="muted mt-4 hidden px-2 text-xs lg:block">
              <KeyRound className="mb-1 h-3.5 w-3.5" />
              Forgotten passwords are reset from Team, Edit.
            </p>
          )}
        </nav>
        <div className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
              {tab === "org" && <OrganisationTab isAdmin={isAdmin} />}
              {tab === "team" && isAdmin && <TeamTab />}
              {tab === "sources" && <SourcesTab isAdmin={isAdmin} />}
              {tab === "appearance" && <AppearanceTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
