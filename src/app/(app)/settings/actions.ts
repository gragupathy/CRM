"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ROLES, OBJECT_TYPES, FIELD_TYPES } from "@/lib/constants";
import { fieldNameToKey } from "@/lib/custom-fields";
import { parseEmail } from "@/lib/email";
import { appUrl, issueToken } from "@/lib/tokens";
import { sendInviteEmail } from "@/lib/mail";
import crypto from "crypto";
import { writeFile, unlink } from "fs/promises";
import { titleCase } from "@/lib/utils";
import { validateCompanyFields, type CompanyFormState } from "@/lib/company-validation";
import { isAllowedLogoFile } from "@/lib/company-logo";
import { companyLogoDiskPath, ensureCompanyLogoDir } from "@/lib/company-logo-fs";

function emptyToNull(value: string) {
  const v = value.trim();
  return v ? v : null;
}

export async function saveCompany(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const session = await requireRole(["ADMIN"]);
  const name = titleCase(String(formData.get("name") ?? "").trim());
  const legalName = emptyToNull(String(formData.get("legalName") ?? "").toUpperCase());
  const shortName = emptyToNull(titleCase(String(formData.get("shortName") ?? "").trim()));
  const email = emptyToNull(String(formData.get("email") ?? "").trim());
  const mobile = emptyToNull(String(formData.get("mobile") ?? "").replace(/\D/g, ""));
  const address = emptyToNull(titleCase(String(formData.get("address") ?? "").trim()));
  const city = emptyToNull(titleCase(String(formData.get("city") ?? "").trim()));
  const state = emptyToNull(String(formData.get("state") ?? "").trim());
  const postalCode = emptyToNull(String(formData.get("postalCode") ?? "").replace(/\D/g, ""));
  const bankName = emptyToNull(String(formData.get("bankName") ?? "").trim());
  const bankAccountNo = emptyToNull(String(formData.get("bankAccountNo") ?? "").replace(/\D/g, ""));
  const bankHolder = emptyToNull(titleCase(String(formData.get("bankHolder") ?? "").trim()));
  const bankAccountType = emptyToNull(String(formData.get("bankAccountType") ?? "").trim());
  const bankIfsc = emptyToNull(String(formData.get("bankIfsc") ?? "").trim().toUpperCase());
  const bankAddress = emptyToNull(String(formData.get("bankAddress") ?? "").trim());

  const invalid = validateCompanyFields({
    name,
    email,
    mobile,
    address,
    city,
    state,
    postalCode,
    bankAccountNo,
    bankIfsc,
    bankName,
    bankHolder,
    bankAccountType,
    bankAddress,
  });
  if (invalid) return { error: invalid };

  const logo = formData.get("logo");
  let logoPath: string | undefined;
  let logoMime: string | undefined;
  if (logo instanceof File && logo.size > 0) {
    const logoError = isAllowedLogoFile(logo);
    if (logoError) return { error: logoError };
    await ensureCompanyLogoDir(session.tenantId);
    const diskPath = companyLogoDiskPath(session.tenantId);
    try {
      await unlink(diskPath);
    } catch {
      /* first upload */
    }
    await writeFile(diskPath, Buffer.from(await logo.arrayBuffer()));
    logoPath = `${session.tenantId}/logo`;
    logoMime = logo.type || "image/png";
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      name,
      legalName,
      shortName,
      email,
      mobile,
      address,
      city,
      state,
      postalCode,
      country: "India",
      bankName,
      bankAccountNo,
      bankHolder,
      bankAccountType,
      bankIfsc,
      bankAddress,
      ...(logoPath ? { logoPath, logoMime } : {}),
    },
  });
  revalidatePath("/settings/company");
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function createUser(formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const parsed = parseEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "SALES");
  if ("error" in parsed || !name || !ROLES.includes(role as (typeof ROLES)[number])) {
    redirect("/settings/users?error=invalid");
  }
  const exists = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: session.tenantId, email: parsed.email } },
  });
  if (exists) redirect("/settings/users?error=exists");
  const user = await prisma.user.create({
    data: {
      tenantId: session.tenantId,
      email: parsed.email,
      name,
      passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10),
      role,
      emailVerifiedAt: null,
    },
  });
  const raw = await issueToken(user.id, "INVITE", 48);
  await sendInviteEmail(user.email, user.name, `${appUrl()}/invite?token=${raw}`);
  revalidatePath("/settings/users");
  redirect("/settings/users?invited=1");
}

export async function resendInvite(id: string) {
  const session = await requireRole(["ADMIN"]);
  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!user || user.emailVerifiedAt) {
    redirect("/settings/users");
  }
  const raw = await issueToken(user.id, "INVITE", 48);
  await sendInviteEmail(user.email, user.name, `${appUrl()}/invite?token=${raw}`);
  revalidatePath("/settings/users");
  redirect("/settings/users?invited=1");
}

export async function updateUserRole(id: string, formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const role = String(formData.get("role") ?? "");
  const isActive = formData.get("isActive") === "on";
  if (!ROLES.includes(role as (typeof ROLES)[number])) return;
  if (id === session.userId) {
    await prisma.user.update({
      where: { id },
      data: { role: "ADMIN", isActive: true },
    });
  } else {
    await prisma.user.updateMany({
      where: { id, tenantId: session.tenantId },
      data: { role, isActive },
    });
  }
  revalidatePath("/settings/users");
}

export async function createCustomField(formData: FormData) {
  const session = await requireRole(["ADMIN"]);
  const objectType = String(formData.get("objectType") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const fieldType = String(formData.get("fieldType") ?? "TEXT");
  const options = String(formData.get("options") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (
    !OBJECT_TYPES.includes(objectType as (typeof OBJECT_TYPES)[number]) ||
    !label ||
    !FIELD_TYPES.includes(fieldType as (typeof FIELD_TYPES)[number])
  ) {
    redirect("/settings/fields?error=invalid");
  }
  const key = fieldNameToKey(label);
  const last = await prisma.customField.findFirst({
    where: { tenantId: session.tenantId, objectType },
    orderBy: { sortOrder: "desc" },
  });
  await prisma.customField.create({
    data: {
      tenantId: session.tenantId,
      objectType,
      key: key || `field_${Date.now()}`,
      label,
      fieldType,
      options: JSON.stringify(options),
      required: formData.get("required") === "on",
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
  revalidatePath("/settings/fields");
  redirect("/settings/fields");
}

export async function deleteCustomField(id: string) {
  const session = await requireRole(["ADMIN"]);
  await prisma.customField.deleteMany({ where: { id, tenantId: session.tenantId } });
  revalidatePath("/settings/fields");
}
