import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setupAction } from "../auth-actions";
import { ErrorText, Field, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { AuthSplit } from "@/components/auth-split";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const count = await prisma.tenant.count();
  if (count > 0) redirect("/login");
  const { error } = await searchParams;

  return (
    <AuthSplit
      kicker="First workspace"
      title="Create your company."
      lines={[
        "You become the admin for this workspace.",
        "Because you typed the email here, it is treated as confirmed.",
        "Later teammates get an invite link to confirm their own email.",
      ]}
    >
      <h2 className="text-center text-2xl font-semibold text-ink-900">Create workspace</h2>
      <form action={setupAction} className="mt-6 space-y-4">
        <ErrorText
          message={
            error
              ? "Company name, your name, a valid email, and a password of 8+ characters are required."
              : undefined
          }
        />
        <Field label="Company name">
          <TextInput name="company" required placeholder="Horizon Sales" />
        </Field>
        <Field label="Your name">
          <TextInput name="name" required />
        </Field>
        <Field label="Admin email">
          <TextInput name="email" type="email" required />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="new-password" minLength={8} />
        </Field>
        <SubmitButton className="w-full py-2.5" pendingLabel="Creating…">
          Create workspace
        </SubmitButton>
      </form>
    </AuthSplit>
  );
}
