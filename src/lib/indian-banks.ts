/**
 * Active banks shown in Settings → Company → Bank Details.
 *
 * This is not fetched live. It is a local list of RBI scheduled commercial
 * banks (public sector, private sector, small finance) plus payments banks
 * that still operate current/savings accounts in India. Names and IFSC
 * prefixes follow RBI / NPCI bank codes. Refresh this file when RBI adds,
 * merges, or withdraws a bank.
 */
export const INDIAN_BANK_SOURCE =
  "RBI scheduled commercial banks (kept in the app; not a live API)";

export const INDIAN_BANKS = [
  { name: "Airtel Payments Bank", ifscPrefix: "AIRP" },
  { name: "AU Small Finance Bank", ifscPrefix: "AUBL" },
  { name: "Axis Bank", ifscPrefix: "UTIB" },
  { name: "Bandhan Bank", ifscPrefix: "BDBL" },
  { name: "Bank of Baroda", ifscPrefix: "BARB" },
  { name: "Bank of India", ifscPrefix: "BKID" },
  { name: "Bank of Maharashtra", ifscPrefix: "MAHB" },
  { name: "Barclays Bank", ifscPrefix: "BARC" },
  { name: "Canara Bank", ifscPrefix: "CNRB" },
  { name: "Capital Small Finance Bank", ifscPrefix: "CLBL" },
  { name: "Central Bank of India", ifscPrefix: "CBIN" },
  { name: "Citibank", ifscPrefix: "CITI" },
  { name: "City Union Bank", ifscPrefix: "CIUB" },
  { name: "CSB Bank", ifscPrefix: "CSBK" },
  { name: "DBS Bank India", ifscPrefix: "DBSS" },
  { name: "DCB Bank", ifscPrefix: "DCBL" },
  { name: "Deutsche Bank", ifscPrefix: "DEUT" },
  { name: "Dhanlaxmi Bank", ifscPrefix: "DLXB" },
  { name: "Equitas Small Finance Bank", ifscPrefix: "ESFB" },
  { name: "ESAF Small Finance Bank", ifscPrefix: "ESMF" },
  { name: "Federal Bank", ifscPrefix: "FDRL" },
  { name: "Fino Payments Bank", ifscPrefix: "FINO" },
  { name: "HDFC Bank", ifscPrefix: "HDFC" },
  { name: "HSBC", ifscPrefix: "HSBC" },
  { name: "ICICI Bank", ifscPrefix: "ICIC" },
  { name: "IDBI Bank", ifscPrefix: "IBKL" },
  { name: "IDFC FIRST Bank", ifscPrefix: "IDFB" },
  { name: "India Post Payments Bank", ifscPrefix: "IPOS" },
  { name: "Indian Bank", ifscPrefix: "IDIB" },
  { name: "Indian Overseas Bank", ifscPrefix: "IOBA" },
  { name: "IndusInd Bank", ifscPrefix: "INDB" },
  { name: "Jammu and Kashmir Bank", ifscPrefix: "JAKA" },
  { name: "Jana Small Finance Bank", ifscPrefix: "JSFB" },
  { name: "Jio Payments Bank", ifscPrefix: "JIOP" },
  { name: "Karnataka Bank", ifscPrefix: "KARB" },
  { name: "Karur Vysya Bank", ifscPrefix: "KVBL" },
  { name: "Kotak Mahindra Bank", ifscPrefix: "KKBK" },
  { name: "Nainital Bank", ifscPrefix: "NTBL" },
  { name: "North East Small Finance Bank", ifscPrefix: "NESF" },
  { name: "NSDL Payments Bank", ifscPrefix: "NSPB" },
  { name: "Punjab and Sind Bank", ifscPrefix: "PSIB" },
  { name: "Punjab National Bank", ifscPrefix: "PUNB" },
  { name: "RBL Bank", ifscPrefix: "RATN" },
  { name: "South Indian Bank", ifscPrefix: "SIBL" },
  { name: "Standard Chartered Bank", ifscPrefix: "SCBL" },
  { name: "State Bank of India", ifscPrefix: "SBIN" },
  { name: "Suryoday Small Finance Bank", ifscPrefix: "SURY" },
  { name: "Tamilnad Mercantile Bank", ifscPrefix: "TMBL" },
  { name: "UCO Bank", ifscPrefix: "UCBA" },
  { name: "Ujjivan Small Finance Bank", ifscPrefix: "UJVN" },
  { name: "Union Bank of India", ifscPrefix: "UBIN" },
  { name: "Unity Small Finance Bank", ifscPrefix: "UNBA" },
  { name: "Utkarsh Small Finance Bank", ifscPrefix: "UTKS" },
  { name: "Yes Bank", ifscPrefix: "YESB" },
] as const;

export const INDIAN_BANK_NAMES = INDIAN_BANKS.map((b) => b.name);

export function bankIfscPrefix(bankName: string) {
  return INDIAN_BANKS.find((b) => b.name === bankName)?.ifscPrefix;
}
