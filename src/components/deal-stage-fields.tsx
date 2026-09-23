"use client";

import { useState } from "react";
import { DEAL_STAGES, LOSS_REASONS } from "@/lib/constants";
import { Field, Select } from "@/components/ui";

export function DealStageFields({
  defaultStage,
  defaultLostReason,
}: {
  defaultStage?: string;
  defaultLostReason?: string | null;
}) {
  const [stage, setStage] = useState(defaultStage ?? "QUALIFICATION");
  return (
    <>
      <Field label="Stage">
        <Select name="stage" value={stage} onChange={(e) => setStage(e.target.value)}>
          {DEAL_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>
      {stage === "LOST" ? (
        <Field label="Loss reason">
          <Select name="lostReason" defaultValue={defaultLostReason ?? "UNSPECIFIED"}>
            {LOSS_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
    </>
  );
}
