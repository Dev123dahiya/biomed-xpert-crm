import { type ReactNode } from "react";
import { Modal } from "./Modal";
import { Spinner } from "./Spinner";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  busy?: boolean;
}

export const ConfirmDialog = ({ open, title, message, confirmLabel = "Confirm", onConfirm, onCancel, danger, busy }: Props): JSX.Element | null => (
  <Modal
    open={open}
    title={title}
    onClose={onCancel}
    width={420}
    footer={
      <>
        <button className="btn" onClick={onCancel}>Cancel</button>
        <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm} disabled={busy} data-autofocus>
          {busy && <Spinner />} {confirmLabel}
        </button>
      </>
    }
  >
    <div className="text-2 text-sm">{message}</div>
  </Modal>
);
