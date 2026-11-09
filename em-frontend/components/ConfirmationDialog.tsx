"use client";
import { useEffect, useRef } from "react";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}
export default function ConfirmationDialog({ title, description, confirmLabel, onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={dialog} className="calm-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" onCancel={onClose}>
    <p className="eyebrow">Your practice, your pace</p>
    <h2 id="confirmation-title">{title}</h2><p id="confirmation-description">{description}</p>
    <div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
