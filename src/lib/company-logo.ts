export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_ACCEPT = ".jpg,.jpeg,.png";
export const LOGO_MIMES = ["image/jpeg", "image/png"] as const;
export const LOGO_DISPLAY_SIZE = 96;
export const LOGO_OUTPUT_SIZE = 256;

export function isAllowedLogoFile(file: { name: string; type: string; size: number }) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["jpg", "jpeg", "png"].includes(ext)) return "Logo must be a JPG or PNG file.";
  if (file.type && !(LOGO_MIMES as readonly string[]).includes(file.type)) {
    return "Logo must be a JPG or PNG file.";
  }
  if (file.size > LOGO_MAX_BYTES) return "Logo must be 2 MB or less.";
  return null;
}
