import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string; }
interface ToastState { toast: (message: string, kind?: ToastKind) => void; }

const ToastContext = createContext<ToastState | undefined>(undefined);

const ICON = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />,
  error: <XCircle className="h-4 w-4 shrink-0" style={{ color: "var(--danger)" }} />,
  info: <Info className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />,
};

export const ToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, kind, message }]);
    setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end" aria-live="polite">
          {items.map((t) => (
            <div key={t.id} className="pop anim-pop pointer-events-auto flex w-full max-w-sm items-start gap-2.5 px-4 py-3" role={t.kind === "error" ? "alert" : "status"}>
              <span className="mt-0.5">{ICON[t.kind]}</span>
              <span className="flex-1 text-sm">{t.message}</span>
              <button className="muted -mr-1 rounded p-0.5 hover:opacity-80" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastState => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
