import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastItem { id: number; kind: ToastKind; message: string; }
interface ToastState { toast: (message: string, kind?: ToastKind) => void; }

const ToastContext = createContext<ToastState | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="card flex items-center gap-2 px-4 py-3 shadow-lg" style={{ minWidth: 240 }}>
            {t.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4" style={{ color: "#16a34a" }} />
            ) : (
              <XCircle className="h-4 w-4" style={{ color: "#ef4444" }} />
            )}
            <span className="text-sm">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastState => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
