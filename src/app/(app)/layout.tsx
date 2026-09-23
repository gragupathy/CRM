import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { logoPath: true, updatedAt: true },
  });
  const companyLogoSrc = tenant?.logoPath
    ? `/api/company/logo?t=${encodeURIComponent(tenant.updatedAt.toISOString())}`
    : null;
  return (
    <AppShell user={session} companyLogoSrc={companyLogoSrc}>
      {children}
    </AppShell>
  );
}
