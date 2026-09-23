import { acceptInviteAction } from "../auth-actions";
import { ErrorText, Field } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { AuthSplit } from "@/components/auth-split";
import Link from "next/link";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <AuthSplit title="Invite needed." lines={["Ask your admin to send a new invite to your email."]}>
        <p className="text-sm text-slate-600">This invite link is missing a token.</p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-brand-700">
          Back to log in
        </Link>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      kicker="Confirm email"
      title="Activate your account."
      lines={[
        "This page proves you can open mail sent to your address.",
        "Set a password, then sign in to the CRM.",
      ]}
    >
      <h2 className="text-center text-2xl font-semibold text-ink-900">Confirm email</h2>
      <p className="mt-1 text-center text-sm text-slate-500">Choose a password to finish setup.</p>
      <form action={acceptInviteAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <ErrorText message={error ? "Passwords must match and be at least 8 characters." : undefined} />
        <Field label="Password">
          <PasswordInput name="password" autoComplete="new-password" minLength={8} />
        </Field>
        <Field label="Confirm password">
          <PasswordInput name="confirm" autoComplete="new-password" minLength={8} placeholder="Confirm password" />
        </Field>
        <SubmitButton className="w-full py-2.5" pendingLabel="Saving…">
          Confirm and continue
        </SubmitButton>
      </form>
    </AuthSplit>
  );
}
