import type { CustomField } from "@prisma/client";
import { Field, Select, TextArea, TextInput } from "./ui";
import { readCustomValues } from "@/lib/custom-fields";

export function CustomFieldInputs({
  fields,
  valuesRaw,
}: {
  fields: CustomField[];
  valuesRaw?: string;
}) {
  if (fields.length === 0) return null;
  const values = readCustomValues(valuesRaw ?? "{}");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const name = `cf_${field.key}`;
        const value = values[field.key] ?? "";
        const options = (() => {
          try {
            return JSON.parse(field.options) as string[];
          } catch {
            return [];
          }
        })();
        return (
          <Field key={field.id} label={field.label}>
            {field.fieldType === "TEXTAREA" ? (
              <TextArea name={name} defaultValue={value} required={field.required} />
            ) : field.fieldType === "SELECT" ? (
              <Select name={name} defaultValue={value} required={field.required}>
                <option value="">Select…</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            ) : (
              <TextInput
                name={name}
                type={
                  field.fieldType === "NUMBER"
                    ? "number"
                    : field.fieldType === "DATE"
                      ? "date"
                      : "text"
                }
                defaultValue={value}
                required={field.required}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}

export function CustomFieldValues({
  fields,
  valuesRaw,
}: {
  fields: CustomField[];
  valuesRaw?: string;
}) {
  if (fields.length === 0) return null;
  const values = readCustomValues(valuesRaw ?? "{}");
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.id}>
          <dt className="text-sm font-semibold text-slate-700">{field.label}</dt>
          <dd className="text-sm text-ink-800">{values[field.key] || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
