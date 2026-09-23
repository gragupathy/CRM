import { isValidEmail, isValidMobile, pincodeError } from "@/lib/lead-validation";
import { bankIfscPrefix } from "@/lib/indian-banks";

export const IFSC_PATTERN = "^[A-Z]{4}0[A-Z0-9]{6}$";
export const ACCOUNT_NO_PATTERN = "^[0-9]{9,18}$";
export const BANK_ACCOUNT_TYPES = ["Current", "Savings", "OD", "CC"] as const;

export type CompanyFormState = { error?: string; saved?: boolean } | null;

export function isValidIfsc(value: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.trim().toUpperCase());
}

export function ifscError(value: string, bankName?: string, required = false) {
  const code = value.trim().toUpperCase();
  if (!code) return required ? "IFSC code is required." : null;
  if (code.length !== 11) {
    return "IFSC must be 11 characters: 4 letters, 0, then 6 letters or digits.";
  }
  if (!/^[A-Z]{4}/.test(code.slice(0, 4))) return "The first 4 characters of IFSC must be letters.";
  if (code[4] !== "0") return "The fifth character of IFSC must be 0.";
  if (!/^[A-Z0-9]{6}$/.test(code.slice(5))) {
    return "The last 6 characters of IFSC must be letters or digits.";
  }
  if (!isValidIfsc(code)) {
    return "Enter a valid IFSC (4 letters, 0, then 6 letters or digits).";
  }
  const prefix = bankName ? bankIfscPrefix(bankName) : undefined;
  if (prefix && code.slice(0, 4) !== prefix) {
    return `IFSC should start with ${prefix} for ${bankName}.`;
  }
  return null;
}

export function accountNumberError(value: string, required = false) {
  const n = value.replace(/\D/g, "");
  if (!n) return required ? "Account number is required." : null;
  if (!/^[0-9]{9,18}$/.test(n)) return "Account number must be 9 to 18 digits.";
  return null;
}

export function validateCompanyFields(input: {
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
  bankHolder?: string | null;
  bankAccountType?: string | null;
  bankAddress?: string | null;
}) {
  if (!input.name?.trim()) return "Company name is required.";
  if (input.email && !isValidEmail(input.email)) return "Enter a valid email address.";
  if (!input.mobile) return "Mobile is required.";
  if (!isValidMobile(input.mobile)) {
    return "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
  }
  if (!input.address?.trim()) return "Address is required.";
  if (!input.city?.trim()) return "City is required.";
  if (!input.state?.trim()) return "State is required.";
  if (!input.postalCode?.trim()) return "Pincode is required.";
  const pin = pincodeError(input.postalCode ?? "");
  if (pin) return pin;
  if (!input.bankName?.trim()) return "Bank name is required.";
  const acct = accountNumberError(input.bankAccountNo ?? "", true);
  if (acct) return acct;
  if (!input.bankHolder?.trim()) return "Account holder name is required.";
  if (
    !input.bankAccountType?.trim() ||
    !(BANK_ACCOUNT_TYPES as readonly string[]).includes(input.bankAccountType)
  ) {
    return "Account type is required.";
  }
  const ifsc = ifscError(input.bankIfsc ?? "", input.bankName ?? undefined, true);
  if (ifsc) return ifsc;
  if (!input.bankAddress?.trim()) return "Bank address is required.";
  return null;
}
