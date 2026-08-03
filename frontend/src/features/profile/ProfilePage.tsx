import { useForm } from "react-hook-form";
import { api, apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { FieldError, Input } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";

interface PwValues { currentPassword: string; newPassword: string; confirm: string }

export const ProfilePage = (): JSX.Element => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<PwValues>();

  const initials = (user?.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

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
      <h1 className="font-display mb-4 text-xl font-semibold">Profile</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white" style={{ background: "var(--primary)" }}>{initials}</div>
          <div className="font-medium">{user?.name}</div>
          <div className="muted text-sm">{user?.email}</div>
          <span className="pill mt-3 inline-block" style={{ background: "var(--accent)", color: "var(--primary)" }}>{user?.role}</span>
          <button className="btn mt-4 w-full justify-center" onClick={() => logout()}>Sign out</button>
        </div>

        <form onSubmit={submit} className="card p-5 md:col-span-2">
          <div className="mb-4 text-sm font-medium">Change password</div>
          <div className="max-w-sm space-y-3">
            <div>
              <Input type="password" placeholder="Current password" {...register("currentPassword", { required: "Required" })} />
              <FieldError message={errors.currentPassword?.message} />
            </div>
            <div>
              <Input type="password" placeholder="New password" {...register("newPassword", { required: "Required", minLength: { value: 8, message: "At least 8 characters" } })} />
              <FieldError message={errors.newPassword?.message} />
            </div>
            <div>
              <Input type="password" placeholder="Confirm new password" {...register("confirm", { validate: (v) => v === watch("newPassword") || "Passwords do not match" })} />
              <FieldError message={errors.confirm?.message} />
            </div>
            <button className="btn btn-primary" disabled={isSubmitting}>{isSubmitting && <Spinner />} Change password</button>
          </div>
        </form>
      </div>
    </div>
  );
};
