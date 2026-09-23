"use client";

import { DEAL_STAGES } from "@/lib/constants";
import { moveDealStage } from "@/app/(app)/deals/actions";

export function DealStageSelect({ id, stage }: { id: string; stage: string }) {
  return (
    <form action={moveDealStage.bind(null, id)} className="mt-2">
      <select
        name="stage"
        defaultValue={stage}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs"
      >
        {DEAL_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}
