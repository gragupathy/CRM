import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email({ message: "Enter a valid email address." });

export function parseEmail(value: unknown) {
  const result = emailSchema.safeParse(value);
  return result.success ? { email: result.data } : { error: result.error.issues[0]?.message ?? "Invalid email." };
}

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.");
