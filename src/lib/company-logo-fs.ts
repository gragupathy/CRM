import { mkdir } from "fs/promises";
import path from "path";

export function companyLogoRoot() {
  return path.join(process.cwd(), "uploads", "company-logos");
}

export function companyLogoDiskPath(tenantId: string) {
  return path.join(companyLogoRoot(), tenantId, "logo");
}

export async function ensureCompanyLogoDir(tenantId: string) {
  const dir = path.join(companyLogoRoot(), tenantId);
  await mkdir(dir, { recursive: true });
  return dir;
}
