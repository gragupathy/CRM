"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatLeadNo, titleCase } from "@/lib/utils";
import {
  COUNTRIES,
  INDIAN_STATES,
  INDUSTRIES,
  LEAD_SOURCES,
  LEAD_TYPES,
  leadStatusChoices,
  normalizeIndustry,
  normalizeLeadStatus,
} from "@/lib/constants";
import {
  EMAIL_PATTERN,
  HTTPS_PATTERN,
  MOBILE_PATTERN,
  isValidEmail,
  isValidHttpsUrl,
  isValidMobile,
  pincodeError,
} from "@/lib/lead-validation";
import { CustomFieldInputs } from "@/components/custom-fields";
import { FormActions, SubmitButton } from "@/components/forms";
import { useToast } from "@/components/toast";
import { LeadOwnerPicker, type OwnerUser } from "@/components/lead-owner-picker";
import { UnderlineChoice } from "@/components/underline-choice";
import type { CustomField } from "@prisma/client";
import type { LeadFormState } from "@/lib/lead-validation";

const underline =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 outline-none rounded-none focus:border-brand-600 focus:ring-0 placeholder:text-slate-400";

const TITLE_CASE_FIELDS = new Set([
  "firstName",
  "lastName",
  "company",
  "jobTitle",
  "addressLine1",
  "addressLine2",
  "city",
]);

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 py-1.5 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <div className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-8 lg:grid-cols-2">{children}</div>;
}

function serializeLeadForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const entries: [string, string][] = [];
  for (const [key, value] of data.entries()) {
    if (key === "intent" || typeof value !== "string") continue;
    let v = value.trim();
    if (TITLE_CASE_FIELDS.has(key)) v = v ? titleCase(v) : v;
    if (key === "industry") v = normalizeIndustry(v) || "";
    if (key === "status") v = normalizeLeadStatus(v);
    if (key === "mobile") v = v.replace(/\D/g, "");
    entries.push([key, v]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function onTitleCaseBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.value = titleCase(e.currentTarget.value);
}

function LeadStatusSelect({ current }: { current?: string | null }) {
  const status = normalizeLeadStatus(current);
  const options = leadStatusChoices(status);
  const locked = options.length <= 1;
  return (
    <>
      <select
        name={locked ? undefined : "status"}
        defaultValue={status}
        disabled={locked}
        className={underline}
      >
        {options.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {locked ? <input type="hidden" name="status" value={status} /> : null}
    </>
  );
}

export type LeadFormValues = {
  leadNo?: number;
  leadIdPreview?: string;
  leadType?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  company?: string;
  industry?: string;
  email?: string | null;
  mobile?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  status?: string;
  source?: string;
  ownerName?: string;
  ownerId?: string;
  createdByName?: string;
  modifiedByName?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  customValues?: string;
};

export function LeadForm({
  action,
  submitLabel,
  values,
  fields,
  users = [],
  cancelHref = "/leads",
  recordName,
}: {
  action: (prev: LeadFormState, formData: FormData) => Promise<LeadFormState>;
  submitLabel: string;
  values?: LeadFormValues;
  fields: CustomField[];
  users?: OwnerUser[];
  cancelHref?: string;
  recordName?: string;
}) {
  const edit = Boolean(values?.createdAt);
  const router = useRouter();
  const showToast = useToast();
  const [state, formAction] = useActionState(action, null);
  const [country, setCountry] = useState(values?.country || "India");
  const [region, setRegion] = useState(values?.state ?? "");
  const [pin, setPin] = useState((values?.postalCode ?? "").replace(/\D/g, "").slice(0, 6));
  const formRef = useRef<HTMLFormElement>(null);
  const baselineRef = useRef("");
  const india = country === "India";
  const leadId = useMemo(
    () =>
      edit
        ? formatLeadNo(values?.leadNo, values?.createdAt)
        : (values?.leadIdPreview ?? formatLeadNo(1)),
    [edit, values?.leadNo, values?.createdAt, values?.leadIdPreview],
  );

  useEffect(() => {
    if (!state?.saved || !state.leadId) return;
    showToast("Lead saved successfully!!");
    router.push(`/leads/${state.leadId}`);
  }, [state, router, showToast]);

  useEffect(() => {
    if (!edit || !formRef.current) return;
    baselineRef.current = serializeLeadForm(formRef.current);
  }, [edit]);

  return (
    <form
      ref={formRef}
      noValidate
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const website = (form.elements.namedItem("website") as HTMLInputElement).value;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const mobile = (form.elements.namedItem("mobile") as HTMLInputElement).value;
        const pin = (form.elements.namedItem("postalCode") as HTMLInputElement).value;
        const status = normalizeLeadStatus(
          (form.elements.namedItem("status") as HTMLInputElement | HTMLSelectElement | null)?.value,
        );
        const websiteEl = form.elements.namedItem("website") as HTMLInputElement;
        const emailEl = form.elements.namedItem("email") as HTMLInputElement;
        const mobileEl = form.elements.namedItem("mobile") as HTMLInputElement;
        const pinEl = form.elements.namedItem("postalCode") as HTMLInputElement;
        const cityEl = form.elements.namedItem("city") as HTMLInputElement;
        for (const name of TITLE_CASE_FIELDS) {
          const el = form.elements.namedItem(name);
          if (el instanceof HTMLInputElement) el.value = titleCase(el.value);
        }
        websiteEl.setCustomValidity(
          website && !isValidHttpsUrl(website) ? "Website must start with https://" : "",
        );
        emailEl.setCustomValidity(email && !isValidEmail(email) ? "Enter a valid email address" : "");
        mobileEl.setCustomValidity(
          status === "CONTACTED" && !mobile
            ? "Mobile is required when status is Contacted."
            : !mobile
              ? "Mobile is required."
              : !isValidMobile(mobile)
                ? "Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9."
                : "",
        );
        pinEl.setCustomValidity(pincodeError(pin) ?? "");
        if (!form.checkValidity()) {
          e.preventDefault();
          form.reportValidity();
          return;
        }
        if (edit && serializeLeadForm(form) === baselineRef.current) {
          e.preventDefault();
          showToast("No changes are made", "info");
        }
      }}
    >
      <div className="mb-4 rounded-xl bg-sky-50 px-4 py-3">
          <h2 className="text-lg font-semibold text-ink-900">
            {edit ? (
              <>
                Edit Lead
                {recordName ? <span className="font-normal text-slate-600"> - {recordName}</span> : null}
              </>
            ) : (
              "Add Lead"
            )}
          </h2>
        </div>

      {state?.error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card md:p-8">

      {edit ? (
        <>
          <input type="hidden" name="firstName" value={values?.firstName ?? ""} />
          <input type="hidden" name="lastName" value={values?.lastName ?? ""} />
        </>
      ) : null}

      <section className="rounded-xl border border-slate-300">
        <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
          Lead Details
        </h2>
        <div className="divide-y divide-slate-100 p-3 md:p-4">
        {edit ? (
          <Pair>
            <Row label="Lead Status" required>
              <LeadStatusSelect current={values?.status} />
            </Row>
            <Row label="Lead Source" required>
              <select name="source" required defaultValue={values?.source ?? ""} className={underline}>
                <option value="">-Select-</option>
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Row>
          </Pair>
        ) : (
          <>
            <Pair>
              <Row label="Lead ID">
                <p className="py-1.5 text-sm font-medium text-slate-800">{leadId}</p>
              </Row>
              <Row label="Lead Status" required>
                <LeadStatusSelect current={values?.status} />
              </Row>
            </Pair>

            <Pair>
              <Row label="Name" required>
                <div className="grid grid-cols-2 gap-6">
                  <label className="block">
                    <input
                      name="firstName"
                      required
                      defaultValue={values?.firstName ?? ""}
                      className={underline}
                      onBlur={onTitleCaseBlur}
                    />
                    <span className="mt-0.5 block whitespace-nowrap text-xs font-bold text-slate-600">First Name</span>
                  </label>
                  <label className="block">
                    <input
                      name="lastName"
                      defaultValue={values?.lastName ?? ""}
                      className={underline}
                      onBlur={onTitleCaseBlur}
                    />
                    <span className="mt-0.5 block whitespace-nowrap text-xs font-bold text-slate-600">Last Name</span>
                  </label>
                </div>
              </Row>
              <Row label="Lead Source" required>
                <select name="source" required defaultValue={values?.source ?? ""} className={underline}>
                  <option value="">-Select-</option>
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Row>
            </Pair>
          </>
        )}

        <Pair>
          <Row label="Lead Type" required>
            <select
              name="leadType"
              required
              defaultValue={values?.leadType ?? ""}
              className={underline}
            >
              <option value="">-Select-</option>
              {LEAD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Lead Owner" required>
            <LeadOwnerPicker users={users} defaultOwnerId={values?.ownerId} />
          </Row>
        </Pair>

        <Pair>
          <Row label="Industry">
            <select name="industry" defaultValue={normalizeIndustry(values?.industry)} className={underline}>
              <option value="">-Select-</option>
              {INDUSTRIES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Company Name">
            <input
              name="company"
              defaultValue={values?.company ?? ""}
              className={underline}
              onBlur={onTitleCaseBlur}
            />
          </Row>
        </Pair>

        <Pair>
          <Row label="Job Title">
            <input
              name="jobTitle"
              defaultValue={values?.jobTitle ?? ""}
              className={underline}
              onBlur={onTitleCaseBlur}
            />
          </Row>
          <Row label="Website">
            <input
              name="website"
              type="text"
              placeholder="https://"
              defaultValue={values?.website ?? ""}
              className={underline}
              pattern={HTTPS_PATTERN}
              title="Must start with https://"
            />
          </Row>
        </Pair>

        <Pair>
          <Row label="Email">
            <input
              name="email"
              type="email"
              defaultValue={values?.email ?? ""}
              className={underline}
              pattern={EMAIL_PATTERN}
              title="Enter a valid email address"
            />
          </Row>
          <Row label="Mobile" required>
            <input
              name="mobile"
              required
              defaultValue={values?.mobile ?? ""}
              className={underline}
              inputMode="numeric"
              maxLength={10}
              pattern={MOBILE_PATTERN}
              title="10-digit Indian mobile starting with 6, 7, 8, or 9"
              onInput={(e) => {
                const el = e.currentTarget;
                el.value = el.value.replace(/\D/g, "").slice(0, 10);
              }}
            />
          </Row>
        </Pair>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-300">
        <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
          Address
        </h2>
        <div className="divide-y divide-slate-100 p-3 md:p-4">
          <Pair>
            <Row label="Address Line 1">
              <input
                name="addressLine1"
                type="text"
                defaultValue={values?.addressLine1 ?? ""}
                className={underline}
              />
            </Row>
            <Row label="Country">
              <UnderlineChoice
                name="country"
                value={country}
                options={COUNTRIES}
                allowEmpty={false}
                onChange={(next) => {
                  setCountry(next);
                  if (next === "India" && !(INDIAN_STATES as readonly string[]).includes(region)) {
                    setRegion("");
                  }
                }}
              />
            </Row>
          </Pair>
          <Pair>
            <Row label="Address Line 2">
              <input
                name="addressLine2"
                type="text"
                defaultValue={values?.addressLine2 ?? ""}
                className={underline}
              />
            </Row>
            <Row label="State">
              {india ? (
                <UnderlineChoice name="state" value={region} options={INDIAN_STATES} onChange={setRegion} />
              ) : (
                <input name="state" key={country} defaultValue={region} className={underline} />
              )}
            </Row>
          </Pair>
          <Pair>
            <Row label="City">
              <input name="city" type="text" defaultValue={values?.city ?? ""} className={underline} />
            </Row>
            <Row label="Pincode">
              <input
                name="postalCode"
                type="text"
                autoComplete="postal-code"
                value={pin}
                className={underline}
                maxLength={6}
                title="6-digit Indian pincode"
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </Row>
          </Pair>
        </div>
      </section>

      {fields.length ? (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <CustomFieldInputs fields={fields} valuesRaw={values?.customValues} />
        </div>
      ) : null}
      </div>

      <FormActions cancelHref={cancelHref}>
        <SubmitButton name="intent" value="save" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </FormActions>
    </form>
  );
}
