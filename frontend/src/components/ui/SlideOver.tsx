import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export const SlideOver = ({ open, title, onClose, children, width = 460 }: Props): JSX.Element | null => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" style={{ background: "rgba(6,12,22,0.45)" }} onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full overflow-auto p-5"
        style={{ width, maxWidth: "92vw", background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
