import { Activity } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";

export const LoginPage = (): JSX.Element => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("sales@biomedxpert.com");
  const [password, setPassword] = useState("Sales@123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message || "Email or password is incorrect");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center p-6"
      style={{ background: "radial-gradient(1200px 600px at 50% -10%, var(--accent), var(--bg))" }}
    >
      <form onSubmit={submit} className="card w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--primary)" }}>
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold leading-none">BIOMED XPERT</div>
            <div className="muted text-xs">Lead Tracker</div>
          </div>
        </div>
        <h1 className="font-display mb-1 text-xl font-semibold">Sign in</h1>
        <p className="muted mb-5 text-sm">Use your team account to continue.</p>

        <label className="label">Email</label>
        <Input className="mb-3 mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <label className="label">Password</label>
        <Input className="mb-5 mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        {error && <p className="mb-3 text-sm" style={{ color: "#ef4444" }}>{error}</p>}

        <button className="btn btn-primary w-full justify-center" disabled={submitting}>
          {submitting && <Spinner />} Sign in
        </button>
      </form>
    </div>
  );
};
