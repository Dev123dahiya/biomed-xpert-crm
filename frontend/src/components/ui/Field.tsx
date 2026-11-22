import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn("input", className)} {...props} />,
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn("input", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn("input", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export const FieldError = ({ message }: { message?: string }): JSX.Element | null =>
  message ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--danger)" }} role="alert">{message}</p> : null;

interface FieldProps { label: string; htmlFor?: string; error?: string; hint?: ReactNode; className?: string; children: ReactNode; optional?: boolean }
export const Field = ({ label, htmlFor, error, hint, className, children, optional }: FieldProps): JSX.Element => (
  <div className={className}>
    <label className="label" htmlFor={htmlFor}>
      {label}
      {optional && <span className="muted font-normal"> (optional)</span>}
    </label>
    {children}
    {error ? <FieldError message={error} /> : hint ? <p className="hint">{hint}</p> : null}
  </div>
);

// Number input with a rupee prefix.
export const MoneyInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <div className="relative">
    <span className="muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm">₹</span>
    <input ref={ref} type="number" inputMode="decimal" step="1" min="0" className={cn("input num pl-7", className)} {...props} />
  </div>
));
MoneyInput.displayName = "MoneyInput";
