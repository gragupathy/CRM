import { isValidIfsc } from "@/lib/company-validation";
import { bankIfscPrefix } from "@/lib/indian-banks";

export type IfscBranch = {
  ifsc: string;
  bank: string;
  branch: string;
  address: string;
};

function cleanPart(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function formatIfscAddress(data: { ADDRESS?: string; BRANCH?: string; CITY?: string; STATE?: string }) {
  const address = cleanPart(data.ADDRESS);
  if (address) return address;
  return [cleanPart(data.BRANCH), cleanPart(data.CITY), cleanPart(data.STATE)].filter(Boolean).join(", ");
}

export async function lookupIfsc(code: string): Promise<IfscBranch | { error: string }> {
  const ifsc = code.trim().toUpperCase();
  if (!isValidIfsc(ifsc)) {
    return { error: "Enter a valid IFSC (4 letters, 0, then 6 letters or digits)." };
  }
  const res = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return { error: "No branch found for this IFSC." };
  if (!res.ok) return { error: "Could not look up this IFSC right now." };
  const data = (await res.json()) as {
    BANK?: string;
    BRANCH?: string;
    ADDRESS?: string;
    CITY?: string;
    STATE?: string;
    IFSC?: string;
  };
  const address = formatIfscAddress(data);
  if (!address) return { error: "No branch address found for this IFSC." };
  return {
    ifsc: data.IFSC || ifsc,
    bank: cleanPart(data.BANK),
    branch: cleanPart(data.BRANCH),
    address,
  };
}

export function ifscMatchesBank(ifsc: string, bankName: string) {
  const prefix = bankIfscPrefix(bankName);
  if (!prefix) return false;
  return ifsc.trim().toUpperCase().slice(0, 4) === prefix;
}
