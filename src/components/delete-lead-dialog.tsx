"use client";

import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

export function DeleteLeadButton({
  action,
  leadName,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  leadName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        Delete
      </button>
      <ConfirmDeleteDialog
        open={open}
        title="Delete lead?"
        message={`${leadName} will be removed.`}
        onCancel={() => setOpen(false)}
        action={action}
      />
    </>
  );
}
