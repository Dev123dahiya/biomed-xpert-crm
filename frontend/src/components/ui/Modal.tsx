import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/cn";
import { spring } from "../../lib/motion";

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
      const el = ref.current?.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]):not([type=file]), select, textarea, button:not([data-close])");
      (el ?? ref.current)?.focus();
    }, 40);
    return () => {
      clearTimeout(t);
      previous?.focus?.();
    };
  }, [open, ref]);
};

// Keep showing the last content while the exit animation plays, even if the
// caller has already cleared the record it was rendering.
const useLatched = <T,>(open: boolean, value: T): T => {
  const ref = useRef(value);
  if (open) ref.current = value;
  return open ? value : ref.current;
};

interface ModalProps { open: boolean; title: string; description?: ReactNode; onClose: () => void; children: ReactNode; width?: number; footer?: ReactNode }

export const Modal = ({ open, title, description, onClose, children, width = 480, footer }: ModalProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  useLockScroll(open);
  useEscape(open, onClose);
  useFocusReturn(open, ref);
  const shown = useLatched(open, { title, description, children, footer });
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" key="modal">
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--overlay)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={shown.title}
            tabIndex={-1}
            className="pop relative flex max-h-[92vh] w-full flex-col rounded-b-none sm:rounded-b-[12px]"
            style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.14 } }}
            transition={spring}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.01em]">{shown.title}</h2>
                {shown.description && <div className="muted mt-0.5 text-sm">{shown.description}</div>}
              </div>
              <button className="btn btn-ghost btn-sm btn-icon -mr-1 -mt-1" onClick={onClose} aria-label="Close" data-close>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scroll-thin overflow-y-auto px-5 pb-5">{shown.children}</div>
            {shown.footer && <div className="flex justify-end gap-2 border-t px-5 py-3 divider">{shown.footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

interface DrawerProps { open: boolean; title: string; description?: ReactNode; onClose: () => void; children: ReactNode; width?: number; side?: "right" | "left"; bare?: boolean }

export const SlideOver = ({ open, title, description, onClose, children, width = 480, side = "right", bare }: DrawerProps): JSX.Element => {
  const ref = useRef<HTMLDivElement>(null);
  useLockScroll(open);
  useEscape(open, onClose);
  useFocusReturn(open, ref);
  const shown = useLatched(open, { title, description, children });
  const offset = side === "right" ? "100%" : "-100%";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" key="drawer">
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--overlay)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={shown.title}
            tabIndex={-1}
            className={cn("absolute top-0 flex h-full flex-col", side === "right" ? "right-0" : "left-0")}
            style={{
              width,
              maxWidth: "100vw",
              background: bare ? "var(--bg)" : "var(--surface)",
              borderLeft: side === "right" ? "1px solid var(--border)" : undefined,
              boxShadow: "var(--shadow-pop)",
            }}
            initial={{ x: offset }}
            animate={{ x: 0 }}
            exit={{ x: offset, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            {bare ? (
              shown.children
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 border-b px-5 py-4 divider">
                  <div>
                    <h2 className="text-base font-semibold tracking-[-0.01em]">{shown.title}</h2>
                    {shown.description && <div className="muted mt-0.5 text-sm">{shown.description}</div>}
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon -mr-1" onClick={onClose} aria-label="Close" data-close>
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="scroll-thin flex-1 overflow-y-auto px-5 py-5">{shown.children}</div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
