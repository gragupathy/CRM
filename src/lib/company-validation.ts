import { isValidEmail, isValidMobile, pincodeError } from "@/lib/lead-validation";
import { bankIfscPrefix } from "@/lib/indian-banks";

export const IFSC_PATTERN = "^[A-Z]{4}0[A-Z0-9]{6}$";
export const ACCOUNT_NO_PATTERN = "^[0-9]{9,18}$";

export type CompanyFormState = { error?: string; saved?: boolean } | null;

export function isValidIfsc(value: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

export function ifscError(value: string, bankName?: string) {
  const code = value.trim().toUpperCase();
  if (!code) return null;
  if (code.length !== 11) return "IFSC must be 11 characters.";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
    return "Enter a valid IFSC (4 letters, 0, then 6 letters or digits).";
  }
  const prefix = bankName ? bankIfscPrefix(bankName) : undefined;
  if (prefix && code.slice(0, 4) !== prefix) {
    return `IFSC should start with ${prefix} for ${bankName}.`;
  }
  return null;
}

export function accountNumberError(value: string) {
  const n = value.replace(/\D/g, "");
  if (!n) return null;
  if (!/^[0-9]{9,18}$/.test(n)) return "Account number must be 9 to 18 digits.";
  return null;
}

export function validateCompanyFields(input: {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  postalCode?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
}) {
  if (!input.name?.trim()) return "Company name is required.";
  if (input.email && !isValidEmail(input.email)) return "Enter a valid email address.";
  if (input.mobile && !isValidMobile(input.mobile)) {
    return "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
  }
  const pin = pincodeError(input.postalCode ?? "");
  if (pin) return pin;
  const acct = accountNumberError(input.bankAccountNo ?? "");
  if (acct) return acct;
  const ifsc = ifscError(input.bankIfsc ?? "", input.bankName ?? undefined);
  if (ifsc) return ifsc;
  return null;
}
