"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmTone = "primary",
  cancelLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  confirmTone?: "primary" | "danger";
  cancelLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const titleId = `confirm-dialog-title-${instanceId}`;
  const bodyId = `confirm-dialog-body-${instanceId}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="app-dialog"
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={cancelLabel}>
          ✕
        </button>
      </div>
      <div className="dialog-body" id={bodyId}>
        {typeof body === "string" ? <p>{body}</p> : body}
      </div>
      <div className="dialog-foot">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`btn btn-sm ${confirmTone === "danger" ? "btn-danger" : "btn-primary"}`}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function InfoDialog({
  open,
  title,
  closeLabel,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const titleId = `info-dialog-title-${instanceId}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="app-dialog"
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby={titleId}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
          ✕
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      <div className="dialog-foot">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          {closeLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Toast({
  message,
  onDismiss,
  closeLabel,
}: {
  message: string;
  onDismiss: () => void;
  closeLabel: string;
}) {
  return (
    <div className="toast-region" aria-live="polite">
      <div className="toast" role="status">
        <span aria-hidden="true">✓</span>
        <span style={{ flex: 1 }}>{message}</span>
        <button type="button" onClick={onDismiss} aria-label={closeLabel}>
          ✕
        </button>
      </div>
    </div>
  );
}
