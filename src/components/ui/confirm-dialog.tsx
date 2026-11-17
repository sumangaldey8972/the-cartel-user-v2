import { AlertTriangle, X } from "lucide-react";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ title, message, confirmLabel = "Delete", busy = false, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
      <div className="confirm-dialog__card">
        <header><span className="confirm-dialog__icon"><AlertTriangle size={17} /></span><button type="button" aria-label="Close confirmation" onClick={onCancel} disabled={busy}><X size={16} /></button></header>
        <div className="confirm-dialog__body"><h2 id="confirm-dialog-title">{title}</h2><p>{message}</p></div>
        <footer><button type="button" onClick={onCancel} disabled={busy}>Cancel</button><button className="confirm-dialog__danger" type="button" onClick={onConfirm} disabled={busy}>{busy ? "Deleting…" : confirmLabel}</button></footer>
      </div>
    </div>
  );
}
