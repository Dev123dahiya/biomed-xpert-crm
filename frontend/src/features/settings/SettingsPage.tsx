import { useEffect, useState } from "react";
import { apiError } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { CardSkeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { useSettings, useUpdateSettings } from "../../hooks/useSettings";
import type { AppSettings } from "../../types";

export const SettingsPage = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const { toast } = useToast();
  const [form, setForm] = useState<AppSettings>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async (): Promise<void> => {
    try {
      await update.mutateAsync(form);
      toast("Settings saved");
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  };

  return (
    <div>
      <h1 className="font-display mb-4 text-xl font-semibold">Settings</h1>
      {isLoading ? (
        <CardSkeleton className="h-64 max-w-lg" />
      ) : (
        <div className="card max-w-lg p-5">
          <div className="mb-4 text-sm font-medium">General</div>
          <div className="space-y-3">
            <div>
              <label className="label">Organization name</label>
              <Input className="mt-1" value={form.orgName ?? ""} disabled={!isAdmin} onChange={(e) => setForm({ ...form, orgName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Currency</label>
                <Input className="mt-1" value={form.currency ?? ""} disabled={!isAdmin} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
              <div>
                <label className="label">Rows per page</label>
                <Input className="mt-1" type="number" value={form.listPageSize ?? ""} disabled={!isAdmin} onChange={(e) => setForm({ ...form, listPageSize: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Max products per lead</label>
              <Input className="mt-1" type="number" value={form.maxProductsPerLead ?? ""} disabled={!isAdmin} onChange={(e) => setForm({ ...form, maxProductsPerLead: e.target.value })} />
            </div>
            {isAdmin ? (
              <button className="btn btn-primary" onClick={save} disabled={update.isPending}>{update.isPending && <Spinner />} Save changes</button>
            ) : (
              <p className="muted text-xs">Only an admin can change these settings.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
