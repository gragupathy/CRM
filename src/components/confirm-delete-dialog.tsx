"use client";

import { useState } from "react";

export function ConfirmDeleteDialog({
  open,
  title,
  message,
  onCancel,
  action,
}: {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  action: (formData: FormData) => void | Promise<void>;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="confirm-delete-title" className="text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cut inline-flex items-center justify-center border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <form action={action}>
            <button
              type="submit"
              className="btn-cut inline-flex items-center justify-center bg-rose-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDeleteButton({
  title,
  message,
  action,
  className,
  children,
}: {
  title: string;
  message: string;
  action: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
        }
      >
        {children}
      </button>
      <ConfirmDeleteDialog
        open={open}
        title={title}
        message={message}
        onCancel={() => setOpen(false)}
        action={action}
      />
    </>
  );
}
