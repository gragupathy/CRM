"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";

export const formCancelClass =
  "btn-cut inline-flex items-center justify-center border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

export function FormActions({
  cancelHref,
  children,
}: {
  cancelHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
      <Link href={cancelHref} className={formCancelClass}>
        Cancel
      </Link>
      {children}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`btn-cut inline-flex items-center justify-center px-5 py-2 text-sm font-medium disabled:opacity-60 ${className ?? "bg-brand-600 text-white hover:bg-brand-700"}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ConfirmSubmit({
  action,
  label,
  confirm,
  className,
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirm: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <button
        type="submit"
        className={
          className ??
          "inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
        }
      >
        {label}
      </button>
    </form>
  );
}
