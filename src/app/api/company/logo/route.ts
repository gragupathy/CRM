import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { companyLogoDiskPath } from "@/lib/company-logo-fs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenant = await prisma.tenant.findFirst({
    where: { id: session.tenantId, logoPath: { not: null } },
    select: { logoMime: true },
  });
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const data = await readFile(companyLogoDiskPath(session.tenantId));
    return new NextResponse(data, {
      headers: {
        "Content-Type": tenant.logoMime || "image/png",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }
}
