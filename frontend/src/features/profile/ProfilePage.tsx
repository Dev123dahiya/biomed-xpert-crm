import { LogOut, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { Avatar } from "../../components/ui/Avatar";
import { RoleBadge } from "../../components/ui/Badges";
import { Field, Input } from "../../components/ui/Field";
import { PageHeader } from "../../components/ui/PageHeader";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";

interface PwValues { currentPassword: string; newPassword: string; confirm: string }

const strength = (pw: string): { score: number; label: string } => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong", "Very strong"][s];
  return { score: s, label };
};

const ProfilePage = (): JSX.Element => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<PwValues>();
  const pw = watch("newPassword") ?? "";
  const st = strength(pw);

  const submit = handleSubmit(async (values) => {
    try {
      await api.patch("/auth/password", { currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast("Password changed");
      reset();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your account and sign-in details." />
      <div className="grid items-start gap-5 md:grid-cols-[320px_1fr]">
        <section className="panel p-6 text-center">
          <Avatar name={user?.name} size={72} className="mx-auto" />
          <div className="mt-4 text-lg font-semibold">{user?.name}</div>
          <div className="muted text-sm">{user?.email}</div>
          {user?.role && <div className="mt-3"><RoleBadge role={user.role} /></div>}
          <button className="btn mt-6 w-full" onClick={() => logout()}><LogOut className="h-4 w-4" /> Sign out</button>
        </section>

        <form onSubmit={submit} className="panel p-6" noValidate>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" style={{ color: "var(--primary)" }} />
            <h2 className="section-title">Change password</h2>
          </div>
          <p className="muted mt-1 text-sm">Use at least 8 characters. A longer phrase is easier to remember and harder to guess.</p>
          <div className="mt-5 max-w-sm space-y-4">
            <Field label="Current password" error={errors.currentPassword?.message} htmlFor="pw-cur">
              <Input id="pw-cur" type="password" autoComplete="current-password" {...register("currentPassword", { required: "Enter your current password" })} />
            </Field>
            <Field label="New password" error={errors.newPassword?.message} htmlFor="pw-new">
              <Input id="pw-new" type="password" autoComplete="new-password" {...register("newPassword", { required: "Enter a new password", minLength: { value: 8, message: "Use at least 8 characters" } })} />
              {pw && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < st.score ? (st.score >= 4 ? "var(--success)" : st.score >= 3 ? "var(--primary)" : "var(--warning)") : "var(--surface-3)" }} />
                    ))}
                  </div>
                  <span className="muted w-20 text-right text-xs">{st.label}</span>
                </div>
              )}
            </Field>
            <Field label="Confirm new password" error={errors.confirm?.message} htmlFor="pw-conf">
              <Input id="pw-conf" type="password" autoComplete="new-password" {...register("confirm", { validate: (v) => v === watch("newPassword") || "The passwords don't match" })} />
            </Field>
            <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner />} Change password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
