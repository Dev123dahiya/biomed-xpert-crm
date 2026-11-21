import { Link } from "react-router-dom";
import { useDocumentTitle } from "../lib/hooks";

const NotFoundPage = (): JSX.Element => {
  useDocumentTitle("Page not found");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <svg width="220" height="60" viewBox="0 0 220 60" aria-hidden className="mb-6">
        <path d="M0 30h220" stroke="var(--border-strong)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
      <h1 className="page-title">No signal on this page</h1>
      <p className="muted mt-2 max-w-sm text-sm">The link may be old, or the record was deleted. Head back to the dashboard to pick up where you left off.</p>
      <Link to="/" className="btn btn-primary mt-6">Go to dashboard</Link>
    </div>
  );
};

export default NotFoundPage;
