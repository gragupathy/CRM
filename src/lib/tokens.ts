import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

export type TokenType = "INVITE" | "PASSWORD_RESET" | "EMAIL_VERIFY";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newRawToken() {
  return randomBytes(32).toString("hex");
}

export function appUrl() {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function issueToken(userId: string, type: TokenType, hoursValid: number) {
  await prisma.authToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });
  const raw = newRawToken();
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + hoursValid * 60 * 60 * 1000),
    },
  });
  return raw;
}

export async function consumeToken(raw: string, type: TokenType) {
  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) {
    return null;
  }
  await prisma.authToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  return token.user;
}
