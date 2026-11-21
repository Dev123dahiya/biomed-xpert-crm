import { Component, type ErrorInfo, type ReactNode } from "react";

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    // A new deploy can remove old code chunks. Reloading fetches the current ones.
    const chunk = /Failed to fetch dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="panel max-w-md p-7 text-center">
          <h1 className="text-lg font-semibold">{chunk ? "A new version is available" : "This page hit a problem"}</h1>
          <p className="muted mt-2 text-sm">
            {chunk ? "Reload to get the latest version of BIOMED XPERT." : "Reload the page. If it keeps happening, sign out and back in."}
          </p>
          <button className="btn btn-primary mt-5" onClick={() => window.location.reload()}>Reload page</button>
        </div>
      </div>
    );
  }
}
