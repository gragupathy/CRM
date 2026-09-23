import Link from "next/link";
import { Mail } from "lucide-react";
import { forgotPasswordAction } from "../auth-actions";
import { ErrorText, Field, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { AuthSplit } from "@/components/auth-split";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <AuthSplit
      kicker="Account recovery"
      title="Reset access in one step."
      lines={[
        "Enter the email on your user record.",
        "We send a one-hour link to choose a new password.",
        "Until SMTP is configured, the link is printed in the app terminal.",
      ]}
    >
      <h2 className="text-center text-2xl font-semibold text-ink-900">Forgot password</h2>
      <p className="mt-1 text-center text-sm text-slate-500">
        We&apos;ll email a reset link if that address is on an active account.
      </p>
      {sent ? (
        <p className="mt-6 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          If an account exists for that email, a reset link is on its way. Check the terminal while running locally.
        </p>
      ) : (
        <form action={forgotPasswordAction} className="mt-6 space-y-4">
          <ErrorText
            message={
              error === "invalid"
                ? "Enter a valid email address."
                : error === "expired"
                  ? "That reset link is invalid or expired. Request a new one."
                  : undefined
            }
          />
          <Field label="Email address">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextInput name="email" type="email" required className="pl-10" placeholder="you@company.com" />
            </div>
          </Field>
          <SubmitButton className="w-full py-2.5" pendingLabel="Sending…">
            Send reset link
          </SubmitButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-brand-700">
          Back to log in
        </Link>
      </p>
    </AuthSplit>
  );
}
