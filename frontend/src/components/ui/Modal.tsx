import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";

const useLockScroll = (open: boolean) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
};

// Only the top-most open dialog reacts to Escape, so closing a nested
// dialog doesn't also close the drawer underneath it.
const stack: number[] = [];
let nextId = 1;
const useEscape = (open: boolean, onClose: () => void) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const id = nextId++;
    stack.push(id);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && stack[stack.length - 1] === id) {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [open]);
};

// Move focus into the dialog when it opens and back to the trigger when it closes.
const useFocusReturn = (open: boolean, ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]), select, textarea, button:not([data-close])");
      (el ?? ref.current)?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      previous?.focus?.();
    };
  }, [open, ref]);
};

interface ModalProps { open: boolean; title: string; description?: ReactNode; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode }

export const Modal = ({ open, title, description, onClose, children, width = 480, footer }: ModalProps): JSX.Element | null => {
  const ref = useRef<HTMLDivElement>(null);
  useLockScroll(open);
  useEscape(open, onClose);
  useFocusReturn(open, ref);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="anim-fade absolute inset-0" style={{ background: "var(--overlay)" }} onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="pop anim-pop relative flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-b-[12px]"
        style={{ maxWidth: width }}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && <div className="muted mt-0.5 text-sm">{description}</div>}
          </div>
          <button className="btn btn-ghost btn-sm btn-icon -mr-1 -mt-1" onClick={onClose} aria-label="Close" data-close>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scroll-thin overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-5 py-3 divider">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
};

interface DrawerProps { open: boolean; title: string; description?: ReactNode; onClose: () => void; children: ReactNode; width?: number; side?: "right" | "left"; bare?: boolean }

export const SlideOver = ({ open, title, description, onClose, children, width = 480, side = "right", bare }: DrawerProps): JSX.Element | null => {
  const ref = useRef<HTMLDivElement>(null);
  useLockScroll(open);
  useEscape(open, onClose);
  useFocusReturn(open, ref);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="anim-fade absolute inset-0" style={{ background: "var(--overlay)" }} onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute top-0 flex h-full flex-col",
          side === "right" ? "anim-right right-0" : "anim-left left-0",
        )}
        style={{
          width,
          maxWidth: "100vw",
          background: bare ? "var(--ink)" : "var(--surface)",
          borderLeft: side === "right" ? "1px solid var(--border)" : undefined,
          boxShadow: "var(--shadow-pop)",
        }}
      >
        {bare ? (
          children
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4 divider">
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                {description && <div className="muted mt-0.5 text-sm">{description}</div>}
              </div>
              <button className="btn btn-ghost btn-sm btn-icon -mr-1" onClick={onClose} aria-label="Close" data-close>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
