import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { Badge, Card, ErrorText, Field, PageHeader, Select, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { createUser, resendInvite, updateUserRole } from "../actions";
import { ROLES } from "@/lib/constants";

const errors: Record<string, string> = {
  invalid: "Name, a valid email, and a role are required.",
  exists: "That email is already used in this company.",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const { error, invited } = await searchParams;
  const users = await prisma.user.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <PageHeader
          title="Users & roles"
          subtitle="New people get an invite link. They confirm email by opening it and setting a password. Locally the link is printed in the terminal."
        />
        {invited ? (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Invite sent. Until SMTP is set, copy the link from the terminal running npm run dev.
          </p>
        ) : null}
        <Card>
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="font-medium">
                    {u.name}{" "}
                    {!u.isActive ? <Badge tone="red">Inactive</Badge> : null}
                    {u.id === session.userId ? <Badge tone="blue">You</Badge> : null}
                    {u.emailVerifiedAt ? (
                      <Badge tone="green">Email confirmed</Badge>
                    ) : (
                      <Badge tone="amber">Pending email</Badge>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {!u.emailVerifiedAt ? (
                    <form action={resendInvite.bind(null, u.id)}>
                      <button type="submit" className="text-sm text-brand-700">
                        Resend invite
                      </button>
                    </form>
                  ) : null}
                  <form action={updateUserRole.bind(null, u.id)} className="flex items-center gap-3">
                    <Select name="role" defaultValue={u.role} disabled={u.id === session.userId}>
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                    {u.id === session.userId ? null : (
                      <label className="flex items-center gap-1 text-sm text-slate-600">
                        <input type="checkbox" name="isActive" defaultChecked={u.isActive} />
                        Active
                      </label>
                    )}
                    <SubmitButton>Update</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <div>
        <h2 className="mb-3 font-semibold">Invite user</h2>
        <Card className="p-5">
          <form action={createUser} className="space-y-3">
            <ErrorText message={error ? errors[error] : undefined} />
            <Field label="Name">
              <TextInput name="name" required />
            </Field>
            <Field label="Email">
              <TextInput name="email" type="email" required />
            </Field>
            <Field label="Role">
              <Select name="role" defaultValue="SALES">
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <SubmitButton>Send invite</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
