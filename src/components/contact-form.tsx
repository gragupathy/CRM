"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { titleCase, formatDateDmy } from "@/lib/utils";
import { COUNTRIES, INDIAN_STATES } from "@/lib/constants";
import {
  EMAIL_PATTERN,
  MOBILE_PATTERN,
  isValidEmail,
  isValidMobile,
  pincodeError,
} from "@/lib/lead-validation";
import type { ContactFormState } from "@/lib/lead-validation";
import { CustomFieldInputs } from "@/components/custom-fields";
import { FormActions, SubmitButton } from "@/components/forms";
import { useToast } from "@/components/toast";
import { LeadOwnerPicker, type OwnerUser } from "@/components/lead-owner-picker";
import { UnderlineChoice } from "@/components/underline-choice";
import type { CustomField } from "@prisma/client";

const underline =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 outline-none rounded-none focus:border-brand-600 focus:ring-0 placeholder:text-slate-400";

const TITLE_CASE_FIELDS = new Set([
  "firstName",
  "lastName",
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

function serializeContactForm(form: HTMLFormElement) {
  const data = new FormData(form);
  const entries: [string, string][] = [];
  for (const [key, value] of data.entries()) {
    if (key === "intent" || typeof value !== "string") continue;
    let v = value.trim();
    if (TITLE_CASE_FIELDS.has(key)) v = v ? titleCase(v) : v;
    if (key === "mobile") v = v.replace(/\D/g, "");
    entries.push([key, v]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

function onTitleCaseBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.value = titleCase(e.currentTarget.value);
}

export type ContactFormValues = {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  email?: string | null;
  mobile?: string | null;
  accountId?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  ownerId?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  createdByName?: string | null;
  modifiedByName?: string | null;
  customValues?: string;
};

export function ContactForm({
  action,
  values,
  fields,
  users = [],
  accounts,
  cancelHref = "/contacts",
  recordName,
}: {
  action: (prev: ContactFormState, formData: FormData) => Promise<ContactFormState>;
  values?: ContactFormValues;
  fields: CustomField[];
  users?: OwnerUser[];
  accounts: { id: string; name: string }[];
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

  useEffect(() => {
    if (!state?.saved || !state.contactId) return;
    showToast("Contact saved successfully!!");
    router.push(`/contacts/${state.contactId}`);
  }, [state, router, showToast]);

  useEffect(() => {
    if (!edit || !formRef.current) return;
    baselineRef.current = serializeContactForm(formRef.current);
  }, [edit]);

  return (
    <form
      ref={formRef}
      noValidate
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const email = (form.elements.namedItem("email") as HTMLInputElement).value;
        const mobile = (form.elements.namedItem("mobile") as HTMLInputElement).value;
        const pin = (form.elements.namedItem("postalCode") as HTMLInputElement).value;
        const emailEl = form.elements.namedItem("email") as HTMLInputElement;
        const mobileEl = form.elements.namedItem("mobile") as HTMLInputElement;
        const pinEl = form.elements.namedItem("postalCode") as HTMLInputElement;
        for (const name of TITLE_CASE_FIELDS) {
          const el = form.elements.namedItem(name);
          if (el instanceof HTMLInputElement) el.value = titleCase(el.value);
        }
        emailEl.setCustomValidity(email && !isValidEmail(email) ? "Enter a valid email address" : "");
        mobileEl.setCustomValidity(
          !mobile
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
        if (edit && serializeContactForm(form) === baselineRef.current) {
          e.preventDefault();
          showToast("No changes are made", "info");
        }
      }}
    >
      <div className="mb-4 rounded-xl bg-sky-50 px-4 py-3">
        <h2 className="text-lg font-semibold text-ink-900">
          {edit ? (
            <>
              Edit Contact
              {recordName ? <span className="font-normal text-slate-600"> - {recordName}</span> : null}
            </>
          ) : (
            "Add Contact"
          )}
        </h2>
      </div>

      {state?.error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card md:p-8">
        <section className="rounded-xl border border-slate-300">
          <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
            Contact Details
          </h2>
          <div className="divide-y divide-slate-100 p-3 md:p-4">
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
                    <span className="mt-0.5 block whitespace-nowrap text-xs font-bold text-slate-600">
                      First Name
                    </span>
                  </label>
                  <label className="block">
                    <input
                      name="lastName"
                      defaultValue={values?.lastName ?? ""}
                      className={underline}
                      onBlur={onTitleCaseBlur}
                    />
                    <span className="mt-0.5 block whitespace-nowrap text-xs font-bold text-slate-600">
                      Last Name
                    </span>
                  </label>
                </div>
              </Row>
              <Row label="Contact Owner" required>
                <LeadOwnerPicker users={users} defaultOwnerId={values?.ownerId} />
              </Row>
            </Pair>

            <Pair>
              <Row label="Account Name">
                <select name="accountId" defaultValue={values?.accountId ?? ""} className={underline}>
                  <option value="">-None-</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Job Title">
                <input
                  name="jobTitle"
                  defaultValue={values?.jobTitle ?? ""}
                  className={underline}
                  onBlur={onTitleCaseBlur}
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
                  autoComplete="street-address"
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
                  <UnderlineChoice
                    name="state"
                    value={region}
                    options={INDIAN_STATES}
                    onChange={setRegion}
                  />
                ) : (
                  <input name="state" defaultValue={region} className={underline} />
                )}
              </Row>
            </Pair>
            <Pair>
              <Row label="City">
                <input
                  name="city"
                  type="text"
                  defaultValue={values?.city ?? ""}
                  className={underline}
                />
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

        {edit ? (
          <section className="mt-4 rounded-xl border border-slate-300">
            <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
              System Details
            </h2>
            <div className="divide-y divide-slate-100 p-3 md:p-4">
              <Pair>
                <Row label="Created By">
                  <p className="py-1.5 text-sm text-ink-900">{values?.createdByName ?? "—"}</p>
                </Row>
                <Row label="Created Date">
                  <p className="py-1.5 text-sm text-ink-900">{formatDateDmy(values?.createdAt)}</p>
                </Row>
              </Pair>
              <Pair>
                <Row label="Modified By">
                  <p className="py-1.5 text-sm text-ink-900">{values?.modifiedByName ?? "—"}</p>
                </Row>
                <Row label="Modified Date">
                  <p className="py-1.5 text-sm text-ink-900">{formatDateDmy(values?.updatedAt)}</p>
                </Row>
              </Pair>
            </div>
          </section>
        ) : null}

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
