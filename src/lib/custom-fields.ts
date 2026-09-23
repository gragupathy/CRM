import type { CustomField } from "@prisma/client";
import { prisma } from "./prisma";
import { parseJson } from "./utils";
import type { ObjectType } from "./constants";

export async function getCustomFields(tenantId: string, objectType: ObjectType) {
  await prisma.customField.deleteMany({
    where: { tenantId, key: { in: ["budget_range"] } },
  });
  return prisma.customField.findMany({
    where: { tenantId, objectType },
    orderBy: { sortOrder: "asc" },
  });
}

export function readCustomValues(raw: string) {
  return parseJson<Record<string, string>>(raw, {});
}

export function customValuesFromForm(formData: FormData, fields: CustomField[]) {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const v = formData.get(`cf_${field.key}`);
    values[field.key] = typeof v === "string" ? v : "";
  }
  return JSON.stringify(values);
}

export function fieldNameToKey(label: string) {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}
