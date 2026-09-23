import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { Badge, Card, ErrorText, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-dialog";
import { SubmitButton } from "@/components/forms";
import { createCustomField, deleteCustomField } from "../actions";
import { FIELD_TYPES, OBJECT_TYPES } from "@/lib/constants";

export default async function FieldsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  await prisma.customField.deleteMany({
    where: { tenantId: session.tenantId, key: "budget_range" },
  });
  const { error } = await searchParams;
  const fields = await prisma.customField.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ objectType: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader
          title="Custom fields"
          subtitle="Add client-specific fields on accounts, contacts, leads, and deals without code."
        />
        <Card>
          {fields.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No custom fields yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {fields.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium">{f.label}</p>
                    <p className="text-xs text-slate-500">
                      {f.objectType} · {f.fieldType} · key `{f.key}`
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.required ? <Badge tone="amber">Required</Badge> : null}
                    <ConfirmDeleteButton
                      action={deleteCustomField.bind(null, f.id)}
                      title="Delete field?"
                      message={`${f.label} will be removed from field definitions. Existing values stay in stored JSON.`}
                    >
                      Remove
                    </ConfirmDeleteButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Add field</h2>
        <Card className="p-5">
          <form action={createCustomField} className="space-y-3">
            <ErrorText
              message={error ? "Choose an object, label, and field type." : undefined}
            />
            <Field label="Object">
              <Select name="objectType" defaultValue="LEAD">
                {OBJECT_TYPES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Label">
              <TextInput name="label" required placeholder="Field label" />
            </Field>
            <Field label="Type">
              <Select name="fieldType" defaultValue="TEXT">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Select options" hint="Comma-separated. Used only for SELECT.">
              <TextInput name="options" placeholder="Low, Medium, High" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="required" />
              Required
            </label>
            <SubmitButton>Add field</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
