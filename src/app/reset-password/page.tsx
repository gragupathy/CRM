import { resetPasswordAction } from "../auth-actions";
import { ErrorText, Field } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { AuthSplit } from "@/components/auth-split";
import Link from "next/link";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <AuthSplit title="Link missing." lines={["Request a new password reset from the login screen."]}>
        <p className="text-sm text-slate-600">That reset link is incomplete.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-sm font-medium text-brand-700">
          Request a new link
        </Link>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      kicker="New password"
      title="Choose a password only you know."
      lines={["At least 8 characters.", "This also confirms your email if it was still pending."]}
    >
      <h2 className="text-center text-2xl font-semibold text-ink-900">Set new password</h2>
      <form action={resetPasswordAction} className="mt-6 space-y-4">
        <input type="hidden" name="token" value={token} />
        <ErrorText message={error ? "Passwords must match and be at least 8 characters." : undefined} />
        <Field label="New password">
          <PasswordInput name="password" autoComplete="new-password" minLength={8} />
        </Field>
        <Field label="Confirm password">
          <PasswordInput name="confirm" autoComplete="new-password" minLength={8} placeholder="Confirm password" />
        </Field>
        <SubmitButton className="w-full py-2.5" pendingLabel="Updating…">
          Update password
        </SubmitButton>
      </form>
    </AuthSplit>
  );
}
