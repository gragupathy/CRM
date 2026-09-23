import { mkdir } from "fs/promises";
import path from "path";

export function attachmentsRoot() {
  return path.join(process.cwd(), "uploads", "lead-attachments");
}

export function attachmentDiskPath(tenantId: string, id: string) {
  return path.join(attachmentsRoot(), tenantId, id);
}

export async function ensureAttachmentDir(tenantId: string) {
  const dir = path.join(attachmentsRoot(), tenantId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function safeFileName(name: string) {
  const base = name.replace(/[/\\]+/g, "_").replace(/[<>:"|?*\u0000-\u001f]+/g, "_").trim();
  return (base || "file").slice(0, 180);
}
