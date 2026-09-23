import type { CustomField, User } from "@prisma/client";
import { Field, Select, TextInput } from "@/components/ui";
import { CustomFieldInputs } from "@/components/custom-fields";
import { FormActions, SubmitButton } from "@/components/forms";
import type { SessionUser } from "@/lib/auth";

export function OwnerField({
  users,
  session,
  defaultOwnerId,
}: {
  users: Pick<User, "id" | "name">[];
  session: SessionUser;
  defaultOwnerId?: string;
}) {
  if (session.role === "SALES") return null;
  return (
    <Field label="Owner">
      <Select name="ownerId" defaultValue={defaultOwnerId ?? session.userId}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function AccountFields({
  session,
  users,
  fields,
  account,
  cancelHref,
}: {
  session: SessionUser;
  users: Pick<User, "id" | "name">[];
  fields: CustomField[];
  cancelHref: string;
  account?: {
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    ownerId: string;
    customValues: string;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account name">
          <TextInput name="name" required defaultValue={account?.name} />
        </Field>
        <OwnerField users={users} session={session} defaultOwnerId={account?.ownerId} />
        <Field label="Industry">
          <TextInput name="industry" defaultValue={account?.industry ?? ""} />
        </Field>
        <Field label="Website">
          <TextInput name="website" defaultValue={account?.website ?? ""} />
        </Field>
        <Field label="Email">
          <TextInput name="email" type="email" defaultValue={account?.email ?? ""} />
        </Field>
        <Field label="Phone">
          <TextInput name="phone" defaultValue={account?.phone ?? ""} />
        </Field>
        <Field label="City">
          <TextInput name="city" defaultValue={account?.city ?? ""} />
        </Field>
        <Field label="Address">
          <TextInput name="address" defaultValue={account?.address ?? ""} />
        </Field>
      </div>
      <CustomFieldInputs fields={fields} valuesRaw={account?.customValues} />
      <FormActions cancelHref={cancelHref}>
        <SubmitButton>Save</SubmitButton>
      </FormActions>
    </div>
  );
}
