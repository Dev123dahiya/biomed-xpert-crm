import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LogoMark, Wordmark } from "../../components/brand/Logo";
import { Spinner } from "../../components/ui/Spinner";
import { useDocumentTitle } from "../../lib/hooks";

// One heartbeat strip, repeated, drawn once on load.
const beat = (x: number) => `L${x + 30},120 l8,-6 l6,6 l10,0 l6,-62 l8,96 l7,-48 l6,14 l14,0 l10,-12 l12,12`;
const TRACE = `M0,120 ${[0, 130, 260, 390, 520, 650].map(beat).join(" ")} L800,120`;

const POINTS = [
  { color: "var(--ch-ecg)", title: "Pipeline at a glance", text: "Drag deals from first call to purchase order." },
  { color: "var(--ch-spo2)", title: "Follow-ups that surface", text: "Overdue calls and demos are flagged every morning." },
  { color: "var(--ch-bp)", title: "Reports for accounts", text: "Revenue, GST-ready customer lists and quotes, in Excel or PDF." },
];

export const LoginPage = (): JSX.Element => {
  useDocumentTitle("Sign in");
  const { login, user, loading } = useAuth();
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col" style={{ background: "var(--ink)", color: "var(--ink-text)" }}>
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(61,220,151,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(61,220,151,.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-3 px-12 pt-10">
          <LogoMark size={38} />
          <Wordmark />
        </div>

        <div className="relative mt-auto px-12">
          <h1 className="condensed max-w-lg text-[44px] font-semibold leading-[1.04] text-white" style={{ letterSpacing: "-0.01em" }}>
            Every enquiry, quote and installation, in one place.
          </h1>
          <p className="mt-4 max-w-md text-[15px]" style={{ color: "var(--ink-muted)" }}>
            The sales desk for teams selling biomedical equipment to doctors, clinics and hospitals.
          </p>
        </div>

        <svg className="relative mt-8 w-full" viewBox="0 0 800 170" preserveAspectRatio="none" height="170" aria-hidden>
          <path d={TRACE} fill="none" stroke="var(--ch-ecg)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="ecg-trace" style={{ ["--len" as string]: "2400" }} />
        </svg>

        <ul className="relative grid grid-cols-3 gap-6 px-12 pb-12 pt-6">
          {POINTS.map((p) => (
            <li key={p.title}>
              <span className="mb-3 block h-[3px] w-8 rounded-full" style={{ background: p.color }} />
              <div className="text-sm font-semibold text-white">{p.title}</div>
              <div className="mt-1 text-[13px] leading-snug" style={{ color: "var(--ink-muted)" }}>{p.text}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <form onSubmit={submit} className="w-full max-w-[380px]" noValidate>
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <LogoMark size={36} />
            <Wordmark light={false} />
          </div>
          <h2 className="page-title">Sign in</h2>
          <p className="muted mt-1.5 text-sm">Use the work account your admin created for you.</p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="label" htmlFor="email">Work email</label>
              <div className="relative">
                <Mail className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  id="email"
                  className="input h-11 pl-9"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="muted pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <input
                  id="password"
                  className="input h-11 pl-9 pr-11"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="muted absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md hover:opacity-80"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg px-3 py-2.5 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }} role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-lg mt-6 w-full" disabled={submitting || !email || !password}>
            {submitting && <Spinner />} Sign in
          </button>
          {slow && <p className="muted mt-3 text-center text-xs">Waking up the server. This can take up to a minute after a quiet spell.</p>}

          <p className="muted mt-10 text-xs">Forgot your password? Ask your admin to reset it from Settings, Team.</p>
        </form>
      </section>
    </div>
  );
};
