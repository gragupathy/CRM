import Link from "next/link";
import { Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { loginAction, resendVerificationAction } from "../auth-actions";
import { ErrorText, Field, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { PasswordInput } from "@/components/password-input";
import { AuthSplit } from "@/components/auth-split";

const errors: Record<string, string> = {
  missing: "Enter a valid email and password.",
  invalid: "Those credentials did not match a user.",
  tenant: "That email is used in more than one company. Ask your admin which workspace to use.",
  unverified: "Confirm your email before signing in. Use the invite link, or resend it below.",
  invite: "That invite link is invalid or has expired. Ask your admin to send a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string; verified?: string; check?: string }>;
}) {
  const { error, next, reset, verified, check } = await searchParams;
  const tenantCount = await prisma.tenant.count();

  return (
    <AuthSplit
      title="Your pipeline, in one place."
      lines={[
        "Capture leads and convert them into accounts and deals.",
        "See what the team owes this week — calls, meetings, and follow-ups.",
        "Each client gets their own workspace, fields, and roles.",
      ]}
    >
      <h2 className="text-center text-2xl font-semibold text-ink-900">Log in</h2>
      <p className="mt-1 text-center text-sm text-slate-500">Use your work email and password.</p>
      <form action={loginAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next || "/"} />
        {reset ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Password updated. Sign in with your new password.
          </p>
        ) : null}
        {verified ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Email confirmed. You can sign in now.
          </p>
        ) : null}
        {check ? (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
            If that account exists, we sent a confirmation link. Locally, check the terminal running the app.
          </p>
        ) : null}
        <ErrorText message={error ? errors[error] : undefined} />
        <Field label="Email address">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <TextInput
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@company.com"
              className="pl-10"
            />
          </div>
        </Field>
        <Field label="Password">
          <PasswordInput />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <SubmitButton className="w-full py-2.5" pendingLabel="Signing in…">
          Log in
        </SubmitButton>
      </form>
      {error === "unverified" ? (
        <form action={resendVerificationAction} className="mt-4">
          <p className="mb-2 text-xs text-slate-500">Enter the same email to resend the invite.</p>
          <div className="flex gap-2">
            <TextInput name="email" type="email" required placeholder="you@company.com" />
            <SubmitButton pendingLabel="Sending…">Resend</SubmitButton>
          </div>
        </form>
      ) : null}
      {tenantCount === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have a workspace?{" "}
          <Link href="/setup" className="font-medium text-brand-700">
            Create one
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-center text-xs text-slate-400">Demo: admin@demo.local / demo1234</p>
      )}
    </AuthSplit>
  );
}
