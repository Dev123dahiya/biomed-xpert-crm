import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LogoMark, Wordmark } from "../../components/brand/Logo";
import { Spinner } from "../../components/ui/Spinner";
import { useDocumentTitle } from "../../lib/hooks";
import { useTheme } from "../../lib/theme";

const POINTS = [
  "Drag-and-drop pipeline from enquiry to purchase order",
  "Quotations, follow-ups and equipment on every lead",
  "Revenue and GST-ready customer reports in Excel or PDF",
];

export const LoginPage = (): JSX.Element => {
  useDocumentTitle("Sign in");
  const { login, user, loading } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!submitting) return setSlow(false);
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, [submitting]);

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError((err as Error).message || "Email or password is incorrect");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(440px,1fr)_1.25fr]" style={{ background: "var(--surface)" }}>
      <section className="flex flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <Wordmark />
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <form onSubmit={submit} className="w-full max-w-[360px]" noValidate>
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em]">Welcome back</h1>
            <p className="muted mt-1.5 text-sm">Sign in with the work account your admin created for you.</p>

            <div className="mt-8 space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input h-10"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    className="input h-10 pr-10"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="muted absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md hover:bg-[var(--surface-3)]"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border px-3 py-2.5 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", borderColor: "color-mix(in srgb, var(--danger) 25%, transparent)" }} role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary btn-lg mt-6 w-full" disabled={submitting || !email || !password}>
              {submitting && <Spinner />} Sign in
            </button>
            {slow && <p className="muted mt-3 text-center text-xs">Waking up the server. This can take up to a minute after a quiet spell.</p>}

            <p className="muted mt-8 text-center text-xs">Forgot your password? Ask your admin to reset it from Settings, Team.</p>
          </form>
        </div>

        <p className="muted text-xs">© {new Date().getFullYear()} BIOMED XPERT</p>
      </section>

      <section className="relative hidden p-3 lg:block">
        <div
          className="relative flex h-full flex-col overflow-hidden rounded-[18px] border"
          style={{
            borderColor: "var(--border)",
            background: dark
              ? "radial-gradient(900px 500px at 85% -10%, rgba(91,140,240,.22), transparent 60%), var(--surface-2)"
              : "radial-gradient(900px 500px at 85% -10%, rgba(37,99,235,.13), transparent 60%), #f6f6f4",
          }}
        >
          <div className="px-12 pt-14">
            <h2 className="max-w-[520px] text-[34px] font-semibold leading-[1.12] tracking-[-0.03em]">
              The CRM built for biomedical equipment sales.
            </h2>
            <ul className="text-2 mt-6 space-y-2.5 text-[14px]">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="anim-rise relative mt-12 flex-1">
            <div
              className="absolute left-12 top-0 w-[1180px] overflow-hidden rounded-tl-[14px] border-l border-t"
              style={{ borderColor: "var(--border-strong)", boxShadow: "0 30px 80px -20px rgba(20,20,18,.28), 0 0 0 6px color-mix(in srgb, var(--surface) 55%, transparent)" }}
            >
              <img src={dark ? "/preview-dark.webp" : "/preview-light.webp"} alt="BIOMED XPERT dashboard showing revenue, pipeline and follow-ups" className="block w-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
