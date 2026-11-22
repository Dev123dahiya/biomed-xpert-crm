import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: string; ms: number }
interface ToastState { toast: (message: string, kind?: ToastKind) => void; }

const ToastContext = createContext<ToastState | undefined>(undefined);

const ICON = {
  success: <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />,
  error: <XCircle className="h-4 w-4 shrink-0" style={{ color: "var(--danger)" }} />,
  info: <Info className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />,
};
const BAR = { success: "var(--success)", error: "var(--danger)", info: "var(--primary)" };

export const ToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    const ms = kind === "error" ? 6000 : 3500;
    setItems((prev) => [...prev.slice(-3), { id, kind, message, ms }]);
    setTimeout(() => dismiss(id), ms);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end" aria-live="polite">
          <AnimatePresence initial={false}>
            {items.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
                transition={{ type: "spring", stiffness: 520, damping: 36 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.6}
                onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 80) dismiss(t.id); }}
                className="pop pointer-events-auto relative flex w-full max-w-sm items-start gap-2.5 overflow-hidden px-4 py-3"
                role={t.kind === "error" ? "alert" : "status"}
              >
                <span className="mt-0.5">{ICON[t.kind]}</span>
                <span className="flex-1 text-[13px]">{t.message}</span>
                <button className="muted -mr-1 rounded p-0.5 hover:opacity-80" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </button>
                <motion.span
                  className="absolute bottom-0 left-0 h-[2px]"
                  style={{ background: BAR[t.kind], opacity: 0.5 }}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: t.ms / 1000, ease: "linear" }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
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
