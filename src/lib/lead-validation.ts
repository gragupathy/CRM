import { normalizeLeadStatus } from "@/lib/constants";

export const EMAIL_PATTERN = "^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$";
export const MOBILE_PATTERN = "^[6-9][0-9]{9}$";
export const PINCODE_PATTERN = "[1-9][0-9]{5}";
export const HTTPS_PATTERN = "^https://.+$";

const emailRe = new RegExp(EMAIL_PATTERN);

const DUMMY_PINS = new Set([
  "111111",
  "222222",
  "333333",
  "444444",
  "555555",
  "666666",
  "777777",
  "888888",
  "999999",
  "123456",
  "234567",
  "345678",
  "456789",
  "654321",
  "765432",
  "876543",
  "987654",
]);

export function isValidEmail(value: string) {
  return emailRe.test(value.trim());
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidMobile(value: string) {
  return /^[6-9][0-9]{9}$/.test(digitsOnly(value));
}

export function isValidHttpsUrl(value: string) {
  const v = value.trim();
  if (!/^https:\/\/.+/i.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && Boolean(u.hostname);
  } catch {
    return false;
  }
}

export function isValidPincode(value: string) {
  const pin = value.trim();
  if (!/^[1-9][0-9]{5}$/.test(pin)) return false;
  return !DUMMY_PINS.has(pin);
}

export function pincodeError(value: string) {
  const pin = value.trim();
  if (!pin) return null;
  if (!/^[0-9]{6}$/.test(pin)) return "Pincode must be 6 digits.";
  if (pin.startsWith("0")) return "Indian pincode cannot start with 0.";
  if (DUMMY_PINS.has(pin)) return "Enter a valid India Post pincode.";
  return null;
}

export type LeadFormState = { error?: string; saved?: boolean; leadId?: string } | null;
export type ContactFormState = { error?: string; saved?: boolean; contactId?: string } | null;

export function validateContactFields(input: {
  firstName?: string | null;
  email?: string | null;
  mobile?: string | null;
  postalCode?: string | null;
}) {
  if (!input.firstName?.trim() || input.firstName.trim().toLowerCase() === "unknown") {
    return "First name is required.";
  }
  if (!input.mobile) return "Mobile is required.";
  if (!isValidMobile(input.mobile)) {
    return "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
  }
  if (input.email && !isValidEmail(input.email)) {
    return "Enter a valid email address.";
  }
  if (input.postalCode) {
    return pincodeError(input.postalCode);
  }
  return null;
}

export function convertLeadFieldErrors(lead: {
  leadType?: string | null;
  firstName?: string | null;
  company?: string | null;
  mobile?: string | null;
  phone?: string | null;
  ownerId?: string | null;
}) {
  const leadType = lead.leadType?.trim() || "";
  const firstName = lead.firstName?.trim() || "";
  const mobile = (lead.mobile || lead.phone || "").trim();
  const ownerId = lead.ownerId?.trim() || "";
  const company = lead.company?.trim() || "";

  if (leadType !== "INDIVIDUAL" && leadType !== "COMPANY") {
    return "Lead type is required to convert this lead.";
  }
  if (!firstName || firstName.toLowerCase() === "unknown") {
    return "First name is required to convert this lead.";
  }
  if (!ownerId) {
    return "Lead owner is required to convert this lead.";
  }
  if (!mobile) {
    return "Mobile is required to convert this lead.";
  }
  if (leadType === "COMPANY" && !company) {
    return "Company name is required to convert a B2B lead.";
  }
  return null;
}

export function validateLeadFields(input: {
  source?: string | null;
  leadType?: string | null;
  email?: string | null;
  mobile?: string | null;
  website?: string | null;
  postalCode?: string | null;
  state?: string | null;
  status?: string | null;
}) {
  if (!input.source) return "Lead source is required.";
  if (!input.leadType) return "Lead type is required.";
  if (normalizeLeadStatus(input.status) === "CONTACTED" && !input.mobile) {
    return "Mobile is required when status is Contacted.";
  }
  if (!input.mobile) return "Mobile is required.";
  if (!isValidMobile(input.mobile)) {
    return "Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.";
  }
  if (input.email && !isValidEmail(input.email)) {
    return "Enter a valid email address.";
  }
  if (input.website && !isValidHttpsUrl(input.website)) {
    return "Website must be a valid https:// URL.";
  }
  if (input.postalCode) {
    return pincodeError(input.postalCode);
  }
  return null;
}
