"use client";

import { useActionState, useEffect, useState } from "react";
import { titleCase } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/constants";
import { INDIAN_BANK_NAMES, bankIfscPrefix } from "@/lib/indian-banks";
import {
  EMAIL_PATTERN,
  MOBILE_PATTERN,
  isValidEmail,
  isValidMobile,
  pincodeError,
} from "@/lib/lead-validation";
import {
  ACCOUNT_NO_PATTERN,
  IFSC_PATTERN,
  accountNumberError,
  ifscError,
  type CompanyFormState,
} from "@/lib/company-validation";
import { FormActions, SubmitButton } from "@/components/forms";
import { UnderlineChoice } from "@/components/underline-choice";
import { CompanyLogoField } from "@/components/company-logo-field";
import { useToast } from "@/components/toast";

const underline =
  "w-full border-0 border-b border-slate-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 outline-none rounded-none focus:border-brand-600 focus:ring-0 placeholder:text-slate-400";

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
    <div className="grid grid-cols-1 gap-1 py-1.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4">
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

export type CompanyFormValues = {
  name: string;
  legalName?: string | null;
  email?: string | null;
  mobile?: string | null;
  hasLogo: boolean;
  logoSrc?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankHolder?: string | null;
  bankIfsc?: string | null;
  bankAddress?: string | null;
};

export function CompanyForm({
  action,
  values,
}: {
  action: (prev: CompanyFormState, formData: FormData) => Promise<CompanyFormState>;
  values: CompanyFormValues;
}) {
  const showToast = useToast();
  const [state, formAction] = useActionState(action, null);
  const [region, setRegion] = useState(values.state ?? "");
  const [bank, setBank] = useState(values.bankName ?? "");
  const [pin, setPin] = useState((values.postalCode ?? "").replace(/\D/g, "").slice(0, 6));
  const [accountNo, setAccountNo] = useState(values.bankAccountNo ?? "");
  const [holder, setHolder] = useState(values.bankHolder ?? "");
  const [bankAddr, setBankAddr] = useState(values.bankAddress ?? "");
  const [ifsc, setIfsc] = useState((values.bankIfsc ?? "").toUpperCase());
  const ifscStem = bank ? `${bankIfscPrefix(bank) ?? ""}0` : "";

  function onBankChange(next: string) {
    if (next === bank) return;
    setBank(next);
    setAccountNo("");
    setHolder("");
    setBankAddr("");
    const prefix = bankIfscPrefix(next);
    setIfsc(prefix ? `${prefix}0` : "");
  }

  function onIfscChange(raw: string) {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
    if (!ifscStem) {
      setIfsc(cleaned);
      return;
    }
    if (cleaned.startsWith(ifscStem)) {
      setIfsc(cleaned.slice(0, 11));
      return;
    }
    const rest = /^[A-Z]{4}0/.test(cleaned) ? cleaned.slice(5) : cleaned;
    setIfsc(`${ifscStem}${rest.slice(0, 6)}`);
  }

  useEffect(() => {
    if (state?.saved) showToast("Company saved successfully!!");
  }, [state, showToast]);

  return (
    <form
      noValidate
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const nameEl = form.elements.namedItem("name") as HTMLInputElement;
        const legalEl = form.elements.namedItem("legalName") as HTMLInputElement;
        const emailEl = form.elements.namedItem("email") as HTMLInputElement;
        const mobileEl = form.elements.namedItem("mobile") as HTMLInputElement;
        const addrEl = form.elements.namedItem("address") as HTMLInputElement;
        const cityEl = form.elements.namedItem("city") as HTMLInputElement;
        const pinEl = form.elements.namedItem("postalCode") as HTMLInputElement;
        const acctEl = form.elements.namedItem("bankAccountNo") as HTMLInputElement;
        const holderEl = form.elements.namedItem("bankHolder") as HTMLInputElement;
        const ifscEl = form.elements.namedItem("bankIfsc") as HTMLInputElement;
        const bankAddrEl = form.elements.namedItem("bankAddress") as HTMLInputElement;
        nameEl.value = titleCase(nameEl.value);
        legalEl.value = legalEl.value.trim().toUpperCase();
        addrEl.value = titleCase(addrEl.value);
        cityEl.value = titleCase(cityEl.value);
        holderEl.value = titleCase(holderEl.value);
        bankAddrEl.value = titleCase(bankAddrEl.value);
        ifscEl.value = ifscEl.value.trim().toUpperCase();
        nameEl.setCustomValidity(nameEl.value.trim() ? "" : "Company name is required.");
        emailEl.setCustomValidity(
          emailEl.value && !isValidEmail(emailEl.value) ? "Enter a valid email address." : "",
        );
        mobileEl.setCustomValidity(
          mobileEl.value && !isValidMobile(mobileEl.value)
            ? "Enter a 10-digit Indian mobile starting with 6, 7, 8, or 9."
            : "",
        );
        pinEl.setCustomValidity(pincodeError(pinEl.value) ?? "");
        acctEl.setCustomValidity(accountNumberError(acctEl.value) ?? "");
        ifscEl.setCustomValidity(ifscError(ifscEl.value, bank) ?? "");
        if (!form.checkValidity()) {
          e.preventDefault();
          form.reportValidity();
        }
      }}
    >
      <div className="mb-4 rounded-xl bg-sky-50 px-4 py-3">
        <h2 className="text-lg font-semibold text-ink-900">Company</h2>
      </div>

      {state?.error ? (
        <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {state.error}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card md:p-8">
        <div className="mb-6">
          <CompanyLogoField hasLogo={values.hasLogo} logoSrc={values.logoSrc} />
        </div>

        <section className="rounded-xl border border-slate-300">
          <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
            Company Details
          </h2>
          <div className="divide-y divide-slate-100 p-3 md:p-4">
            <Pair>
              <Row label="Company Name" required>
                <input
                  name="name"
                  required
                  defaultValue={values.name}
                  className={underline}
                  onBlur={(e) => {
                    e.currentTarget.value = titleCase(e.currentTarget.value);
                  }}
                />
              </Row>
              <Row label="Legal Name">
                <input
                  name="legalName"
                  defaultValue={values.legalName ?? ""}
                  className={underline}
                  onBlur={(e) => {
                    e.currentTarget.value = e.currentTarget.value.trim().toUpperCase();
                  }}
                />
              </Row>
            </Pair>
            <Pair>
              <Row label="Email">
                <input
                  name="email"
                  type="email"
                  defaultValue={values.email ?? ""}
                  pattern={EMAIL_PATTERN}
                  className={underline}
                />
              </Row>
              <Row label="Mobile">
                <input
                  name="mobile"
                  inputMode="numeric"
                  maxLength={10}
                  pattern={MOBILE_PATTERN}
                  defaultValue={values.mobile ?? ""}
                  className={underline}
                  onChange={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                  }}
                />
              </Row>
            </Pair>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-300">
          <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
            Address
          </h2>
          <div className="divide-y divide-slate-100 p-3 md:p-4">
            <Row label="Address">
              <input
                name="address"
                defaultValue={values.address ?? ""}
                className={underline}
                onBlur={(e) => {
                  e.currentTarget.value = titleCase(e.currentTarget.value);
                }}
              />
            </Row>
            <Pair>
              <Row label="City">
                <input
                  name="city"
                  defaultValue={values.city ?? ""}
                  className={underline}
                  onBlur={(e) => {
                    e.currentTarget.value = titleCase(e.currentTarget.value);
                  }}
                />
              </Row>
              <Row label="State">
                <UnderlineChoice name="state" value={region} options={INDIAN_STATES} onChange={setRegion} />
              </Row>
            </Pair>
            <Pair>
              <Row label="Pincode">
                <input
                  name="postalCode"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                  className={underline}
                  title="6-digit Indian pincode"
                />
              </Row>
              <Row label="Country">
                <input name="country" value="India" readOnly className={`${underline} text-slate-500`} />
              </Row>
            </Pair>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-300">
          <h2 className="bg-slate-100 px-3 py-2 text-base font-semibold text-slate-800 md:px-4">
            Bank Details
          </h2>
          <div className="divide-y divide-slate-100 p-3 md:p-4">
            <Pair>
              <Row label="Bank Name">
                <UnderlineChoice
                  name="bankName"
                  value={bank}
                  options={INDIAN_BANK_NAMES}
                  onChange={onBankChange}
                />
              </Row>
              <Row label="Account Number">
                <input
                  name="bankAccountNo"
                  inputMode="numeric"
                  pattern={ACCOUNT_NO_PATTERN}
                  value={accountNo}
                  className={underline}
                  onChange={(e) => setAccountNo(e.currentTarget.value.replace(/\D/g, "").slice(0, 18))}
                />
              </Row>
            </Pair>
            <Pair>
              <Row label="Account Holder Name">
                <input
                  name="bankHolder"
                  value={holder}
                  className={underline}
                  onChange={(e) => setHolder(e.currentTarget.value)}
                  onBlur={(e) => setHolder(titleCase(e.currentTarget.value))}
                />
              </Row>
              <Row label="IFSC Code">
                <input
                  name="bankIfsc"
                  maxLength={11}
                  pattern={IFSC_PATTERN}
                  value={ifsc}
                  className={underline}
                  onChange={(e) => onIfscChange(e.currentTarget.value)}
                  title="11-character IFSC"
                />
              </Row>
            </Pair>
            <Row label="Address">
              <input
                name="bankAddress"
                value={bankAddr}
                className={underline}
                onChange={(e) => setBankAddr(e.currentTarget.value)}
                onBlur={(e) => setBankAddr(titleCase(e.currentTarget.value))}
              />
            </Row>
          </div>
        </section>

        <FormActions cancelHref="/">
          <SubmitButton>Save</SubmitButton>
        </FormActions>
      </div>
    </form>
  );
}
