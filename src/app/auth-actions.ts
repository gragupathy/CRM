"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import type { Role } from "@/lib/constants";
import { parseEmail, passwordSchema } from "@/lib/email";
import { appUrl, consumeToken, issueToken } from "@/lib/tokens";
import { sendInviteEmail, sendResetEmail } from "@/lib/mail";
import { slugify } from "@/lib/utils";

async function createSession(user: {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
}) {
  const token = await signSession({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function loginAction(formData: FormData) {
  const parsed = parseEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  if ("error" in parsed || !password) {
    redirect("/login?error=missing");
  }

  const users = await prisma.user.findMany({
    where: { email: parsed.email, isActive: true },
  });

  const matched = [];
  for (const user of users) {
    if (await bcrypt.compare(password, user.passwordHash)) {
      matched.push(user);
    }
  }

  if (matched.length === 0) {
    redirect("/login?error=invalid");
  }
  if (matched.length > 1) {
    redirect("/login?error=tenant");
  }

  const user = matched[0];
  if (!user.emailVerifiedAt) {
    redirect("/login?error=unverified");
  }

  await createSession(user);
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function setupAction(formData: FormData) {
  const count = await prisma.tenant.count();
  if (count > 0) {
    redirect("/login");
  }

  const company = String(formData.get("company") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const parsed = parseEmail(formData.get("email"));
  const passwordCheck = passwordSchema.safeParse(String(formData.get("password") ?? ""));

  if (!company || !name || "error" in parsed || !passwordCheck.success) {
    redirect("/setup?error=invalid");
  }

  const slug = slugify(company) || `company-${Date.now()}`;
  const passwordHash = await bcrypt.hash(passwordCheck.data, 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: company,
      slug,
      users: {
        create: {
          name,
          email: parsed.email,
          passwordHash,
          role: "ADMIN",
          emailVerifiedAt: new Date(),
        },
      },
    },
    include: { users: true },
  });

  await createSession(tenant.users[0]);
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = parseEmail(formData.get("email"));
  if ("error" in parsed) {
    redirect("/forgot-password?error=invalid");
  }

  const users = await prisma.user.findMany({
    where: { email: parsed.email, isActive: true },
  });

  for (const user of users) {
    const raw = await issueToken(user.id, "PASSWORD_RESET", 1);
    const url = `${appUrl()}/reset-password?token=${raw}`;
    await sendResetEmail(user.email, url);
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPasswordAction(formData: FormData) {
  const raw = String(formData.get("token") ?? "");
  const passwordCheck = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  const confirm = String(formData.get("confirm") ?? "");

  if (!raw) {
    redirect("/forgot-password?error=expired");
  }
  if (!passwordCheck.success || passwordCheck.data !== confirm) {
    redirect(`/reset-password?token=${encodeURIComponent(raw)}&error=invalid`);
  }

  const user = await consumeToken(raw, "PASSWORD_RESET");
  if (!user) {
    redirect("/forgot-password?error=expired");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(passwordCheck.data, 10),
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });

  redirect("/login?reset=1");
}

export async function resendVerificationAction(formData: FormData) {
  const parsed = parseEmail(formData.get("email"));
  if ("error" in parsed) {
    redirect("/login?error=missing");
  }

  const users = await prisma.user.findMany({
    where: { email: parsed.email, isActive: true, emailVerifiedAt: null },
  });

  for (const user of users) {
    const raw = await issueToken(user.id, "INVITE", 48);
    const url = `${appUrl()}/invite?token=${raw}`;
    await sendInviteEmail(user.email, user.name, url);
  }

  redirect("/login?check=1");
}

export async function acceptInviteAction(formData: FormData) {
  const raw = String(formData.get("token") ?? "");
  const passwordCheck = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  const confirm = String(formData.get("confirm") ?? "");

  if (!raw) {
    redirect("/login?error=invite");
  }
  if (!passwordCheck.success || passwordCheck.data !== confirm) {
    redirect(`/invite?token=${encodeURIComponent(raw)}&error=invalid`);
  }

  const user = await consumeToken(raw, "INVITE");
  if (!user) {
    redirect("/login?error=invite");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(passwordCheck.data, 10),
      emailVerifiedAt: new Date(),
    },
  });

  redirect("/login?verified=1");
}
