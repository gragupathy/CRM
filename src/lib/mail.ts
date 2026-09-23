type Mail = { to: string; subject: string; text: string };

export async function sendAppMail({ to, subject, text }: Mail) {
  console.log("\n=== HM CRM email (local: not sent over SMTP) ===");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(text);
  console.log("=== end email ===\n");
  return { delivered: false as const };
}

export async function sendInviteEmail(to: string, name: string, url: string) {
  return sendAppMail({
    to,
    subject: "Set up your HM CRM account",
    text: `Hi ${name},\n\nAn account was created for you in HM CRM. Confirm this email and choose a password:\n${url}\n\nThis link expires in 48 hours.\n`,
  });
}

export async function sendResetEmail(to: string, url: string) {
  return sendAppMail({
    to,
    subject: "Reset your HM CRM password",
    text: `A password reset was requested for this email.\n\nReset your password:\n${url}\n\nIf you did not ask for this, you can ignore the email. The link expires in 1 hour.\n`,
  });
}
