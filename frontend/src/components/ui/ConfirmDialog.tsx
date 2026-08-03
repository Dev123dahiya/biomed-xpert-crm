import { type ReactNode } from "react";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger }: Props): JSX.Element | null => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: "rgba(6,12,22,0.45)" }} onClick={onCancel} />
      <div className="card relative w-full max-w-sm p-5">
        <div className="mb-1 font-display text-base font-semibold">{title}</div>
        <div className="muted mb-4 text-sm">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
