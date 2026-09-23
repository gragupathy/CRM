import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, ownerScope } from "@/lib/session";
import { attachmentDiskPath } from "@/lib/attachments";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ leadId: string; id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { leadId, id } = await params;
  const row = await prisma.leadAttachment.findFirst({
    where: { id, leadId, tenantId: session.tenantId, lead: ownerScope(session) },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const data = await readFile(attachmentDiskPath(row.tenantId, row.id));
    return new NextResponse(data, {
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${row.fileName.replace(/"/g, "")}"`,
        "Content-Length": String(row.size),
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
