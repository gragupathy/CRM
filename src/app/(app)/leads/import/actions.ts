"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { nextLeadNo } from "@/lib/leads";
import { mapCsvRows, parseCsv } from "@/lib/lead-import";
import { isValidMobile } from "@/lib/lead-validation";
import { LEAD_SOURCES, LEAD_TYPES } from "@/lib/constants";
import { titleCase } from "@/lib/utils";

function mapEnum(
  items: readonly { value: string; label: string }[],
  raw?: string,
  fallback?: string,
) {
  if (!raw) return fallback ?? null;
  const t = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const hit = items.find((i) => {
    const label = i.label.toLowerCase();
    const rawl = raw.trim().toLowerCase();
    return i.value.toLowerCase() === t || label === rawl || label.startsWith(`${rawl} `) || label.startsWith(`${rawl}(`);
  });
  return hit?.value ?? fallback ?? null;
}

export async function importLeadsFromFile(formData: FormData) {
  const session = await requireSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/leads/import?error=Choose%20a%20CSV%20or%20XLS%20file");
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && !name.endsWith(".xls") && !name.endsWith(".xlsx") && !name.endsWith(".txt")) {
    redirect("/leads/import?error=Supported%20formats%3A%20CSV%2C%20XLS%2C%20XLSX");
  }
  const text = await file.text();
  if (text.includes("PK") && !text.includes(",")) {
    redirect("/leads/import?error=Please%20save%20the%20Excel%20file%20as%20CSV%20and%20try%20again");
  }
  const rows = mapCsvRows(parseCsv(text));
  if (rows.length === 0) {
    redirect("/leads/import?error=No%20data%20rows%20found");
  }

  let n = await nextLeadNo(session.tenantId);
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const mobile = (row.mobile ?? "").replace(/\D/g, "").slice(-10);
    const firstName = (row.firstName ?? "").trim();
    if (!firstName || !isValidMobile(mobile)) {
      skipped += 1;
      continue;
    }
    const leadType = mapEnum(LEAD_TYPES, row.leadType, "INDIVIDUAL")!;
    const source = mapEnum(LEAD_SOURCES, row.source, "WEBSITE")!;
    await prisma.lead.create({
      data: {
        tenantId: session.tenantId,
        ownerId: session.userId,
        createdById: session.userId,
        modifiedById: session.userId,
        leadNo: n,
        leadType,
        firstName,
        lastName: (row.lastName ?? "").trim(),
        email: row.email?.trim() || null,
        mobile,
        phone: mobile,
        source,
        company: row.company?.trim() || null,
        jobTitle: row.jobTitle?.trim() || null,
        website: row.website?.trim() || null,
        city: row.city ? titleCase(row.city) : null,
        state: row.state?.trim() || null,
        country: row.country?.trim() || "India",
        postalCode: row.postalCode?.trim() || null,
        status: "NEW",
      },
    });
    n += 1;
    created += 1;
  }
  revalidatePath("/leads");
  redirect(`/leads?imported=${created}&skipped=${skipped}`);
}
