export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_EXTS = [
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "pdf",
  "gif",
  "png",
  "jpg",
  "jpeg",
  "bmp",
] as const;

export const ATTACHMENT_ACCEPT = ALLOWED_ATTACHMENT_EXTS.map((ext) => `.${ext}`).join(",");

export function attachmentExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function isAllowedAttachment(name: string) {
  return (ALLOWED_ATTACHMENT_EXTS as readonly string[]).includes(attachmentExt(name));
}

export function attachmentTooLargeAlert(fileName: string) {
  return `"${fileName}" is larger than 2 MB. Each attachment must be 2 MB or less.`;
}

export function attachmentTypeAlert(fileName: string) {
  return `"${fileName}" is not an allowed type. Attach a document, Excel file, PDF, GIF, PNG, or a Windows/Mac screenshot (JPG, JPEG, BMP, PNG, or GIF).`;
}
