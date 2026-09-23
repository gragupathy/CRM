import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { CompanyForm } from "@/components/company-form";
import { saveCompany } from "../actions";

export default async function CompanySettingsPage() {
  const session = await requireRole(["ADMIN"]);
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: session.tenantId } });

  return (
    <CompanyForm
      action={saveCompany}
      values={{
        name: tenant.name,
        legalName: tenant.legalName,
        email: tenant.email,
        mobile: tenant.mobile,
        hasLogo: Boolean(tenant.logoPath),
        logoSrc: tenant.logoPath
          ? `/api/company/logo?t=${encodeURIComponent(tenant.updatedAt.toISOString())}`
          : undefined,
        address: tenant.address,
        city: tenant.city,
        state: tenant.state,
        postalCode: tenant.postalCode,
        country: tenant.country,
        bankName: tenant.bankName,
        bankAccountNo: tenant.bankAccountNo,
        bankHolder: tenant.bankHolder,
        bankIfsc: tenant.bankIfsc,
        bankAddress: tenant.bankAddress,
      }}
    />
  );
}
