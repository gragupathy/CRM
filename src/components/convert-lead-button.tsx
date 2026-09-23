"use client";

import { useActionState, useState } from "react";
import { convertLeadFieldErrors } from "@/lib/lead-validation";
import type { LeadFormState } from "@/lib/lead-validation";

const CONVERT_HINT = "Lead must be Qualified before conversion.";

export function ConvertLeadButton({
  enabled,
  action,
  className,
  accountName,
  lead,
}: {
  enabled: boolean;
  action: (prev: LeadFormState, formData: FormData) => Promise<LeadFormState>;
  className: string;
  accountName: string;
  lead: {
    leadType?: string | null;
    firstName?: string | null;
    company?: string | null;
    mobile?: string | null;
    phone?: string | null;
    ownerId?: string | null;
  };
}) {
  const [state, formAction] = useActionState(action, null);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError || state?.error;

  if (!enabled) {
    return (
      <span className="inline-flex cursor-not-allowed" title={CONVERT_HINT}>
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label={`Convert, ${CONVERT_HINT}`}
          className={`${className} pointer-events-none opacity-50 hover:bg-white`}
        >
          Convert
        </button>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        action={formAction}
        onSubmit={(e) => {
          const missing = convertLeadFieldErrors(lead);
          if (missing) {
            e.preventDefault();
            setLocalError(missing);
            return;
          }
          setLocalError(null);
          if (!window.confirm("Convert this lead to an account and contact?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="accountName" value={accountName} />
        <input type="hidden" name="createDeal" value="on" />
        <input type="hidden" name="dealName" value={`${accountName} deal`} />
        <input type="hidden" name="amount" value="0" />
        <input type="hidden" name="dealStage" value="QUALIFICATION" />
        <button type="submit" className={className}>
          Convert
        </button>
      </form>
      {error ? <p className="max-w-xs text-right text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
