import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedDashboardHistory(
  tenantId: string,
  owners: { adminId: string; managerId: string; salesId: string },
) {
  const already = await prisma.deal.count({
    where: { tenantId, name: { startsWith: "Dash ·" } },
  });
  if (already > 0) return;

  const ownerIds = [owners.adminId, owners.managerId, owners.salesId];
  const reasons = ["FEATURE", "BUDGET", "PRICE", "ALTERNATIVE", "URGENCY"] as const;
  const now = new Date();
  const rows = [];

  for (let i = 0; i < 12; i++) {
    const closed = new Date(now.getFullYear(), now.getMonth() - 11 + i, 6 + (i % 6));
    const createdWon = new Date(closed.getTime() - (35 + i * 4) * 86400000);
    rows.push({
      tenantId,
      ownerId: ownerIds[i % 3],
      name: `Dash · won ${i + 1}`,
      amount: 18000 + i * 9200,
      stage: "WON",
      probability: 100,
      createdAt: createdWon,
      closedAt: closed,
      updatedAt: closed,
    });
    rows.push({
      tenantId,
      ownerId: ownerIds[(i + 1) % 3],
      name: `Dash · lost ${i + 1}`,
      amount: 9000 + i * 4100,
      stage: "LOST",
      probability: 0,
      lostReason: reasons[i % reasons.length],
      createdAt: createdWon,
      closedAt: closed,
      updatedAt: closed,
    });
    rows.push({
      tenantId,
      ownerId: ownerIds[(i + 2) % 3],
      name: `Dash · open ${i + 1}`,
      amount: 14000 + i * 3600,
      stage: ["QUALIFICATION", "PROPOSAL", "NEGOTIATION"][i % 3],
      probability: [15, 40, 60][i % 3],
      expectedClose: new Date(now.getFullYear(), now.getMonth() + (i % 12), 12),
      createdAt: new Date(now.getTime() - (18 + i * 9) * 86400000),
    });
  }

  await prisma.deal.createMany({ data: rows });
}

async function main() {
  const existing = await prisma.tenant.findUnique({ where: { slug: "demo" } });
  if (existing) {
    await prisma.user.updateMany({
      where: {
        tenantId: existing.id,
        email: { in: ["admin@demo.local", "manager@demo.local", "sales@demo.local"] },
        emailVerifiedAt: null,
      },
      data: { emailVerifiedAt: new Date() },
    });
    const users = await prisma.user.findMany({ where: { tenantId: existing.id } });
    const admin = users.find((u) => u.email === "admin@demo.local");
    const manager = users.find((u) => u.email === "manager@demo.local");
    const sales = users.find((u) => u.email === "sales@demo.local");
    if (admin && manager && sales) {
      await seedDashboardHistory(existing.id, {
        adminId: admin.id,
        managerId: manager.id,
        salesId: sales.id,
      });
    }
    if (sales) {
      await prisma.activity.updateMany({
        where: { tenantId: existing.id, subject: "Negotiation review — Acme" },
        data: { dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5) },
      });
      const greenDue = await prisma.activity.findFirst({
        where: { tenantId: existing.id, subject: "Site visit — 5 day follow-up" },
      });
      if (!greenDue) {
        await prisma.activity.create({
          data: {
            tenantId: existing.id,
            ownerId: sales.id,
            type: "TASK",
            subject: "Site visit — 5 day follow-up",
            dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
          },
        });
      }
    }
    await prisma.customField.deleteMany({
      where: { tenantId: existing.id, key: "budget_range" },
    });
    console.log("Demo tenant already exists. Login:  admin@demo.local / demo1234");
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: "Horizon Sales", slug: "demo" },
  });

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const now = new Date();

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@demo.local",
      name: "Ava Admin",
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: now,
    },
  });

  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "manager@demo.local",
      name: "Marcus Manager",
      passwordHash,
      role: "MANAGER",
      emailVerifiedAt: now,
    },
  });

  const sales = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "sales@demo.local",
      name: "Sofia Sales",
      passwordHash,
      role: "SALES",
      emailVerifiedAt: now,
    },
  });

  await prisma.customField.createMany({
    data: [
      {
        tenantId: tenant.id,
        objectType: "ACCOUNT",
        key: "employees",
        label: "Employees",
        fieldType: "NUMBER",
        sortOrder: 1,
      },
      {
        tenantId: tenant.id,
        objectType: "DEAL",
        key: "competitor",
        label: "Main competitor",
        fieldType: "TEXT",
        sortOrder: 1,
      },
    ],
  });

  const acme = await prisma.account.create({
    data: {
      tenantId: tenant.id,
      ownerId: manager.id,
      name: "Acme Manufacturing",
      industry: "Manufacturing",
      website: "https://acme.example",
      email: "hello@acme.example",
      phone: "+1 555 0100",
      city: "Austin",
      customValues: JSON.stringify({ employees: "240" }),
    },
  });

  const northwind = await prisma.account.create({
    data: {
      tenantId: tenant.id,
      ownerId: sales.id,
      name: "Northwind Retail",
      industry: "Retail",
      email: "ops@northwind.example",
      city: "Chicago",
    },
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      ownerId: manager.id,
      accountId: acme.id,
      firstName: "Priya",
      lastName: "Shah",
      email: "priya.shah@acme.example",
      phone: "+1 555 0101",
      title: "VP Operations",
    },
  });

  await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      ownerId: sales.id,
      accountId: northwind.id,
      firstName: "James",
      lastName: "Cole",
      email: "james.cole@northwind.example",
      title: "Procurement Lead",
    },
  });

  await prisma.lead.createMany({
    data: [
      {
        tenantId: tenant.id,
        ownerId: sales.id,
        createdById: sales.id,
        modifiedById: sales.id,
        leadNo: 1,
        leadType: "COMPANY",
        firstName: "Elena",
        lastName: "Ruiz",
        jobTitle: "Marketing Manager",
        email: "elena@brightco.example",
        mobile: "+91 98765 00011",
        website: "https://brightco.example",
        company: "BrightCo",
        industry: "IT",
        source: "WEBSITE",
        status: "NEW",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        score: 20,
        customValues: "{}",
      },
      {
        tenantId: tenant.id,
        ownerId: sales.id,
        createdById: sales.id,
        modifiedById: sales.id,
        leadNo: 2,
        leadType: "COMPANY",
        firstName: "Tom",
        lastName: "Nguyen",
        jobTitle: "Operations Head",
        email: "tom@harbor.example",
        mobile: "+1 555 0144",
        company: "Harbor Logistics",
        industry: "MANUFACTURING",
        source: "REFERRAL",
        status: "QUALIFIED",
        country: "United States",
        score: 70,
        customValues: "{}",
      },
      {
        tenantId: tenant.id,
        ownerId: manager.id,
        createdById: manager.id,
        modifiedById: manager.id,
        leadNo: 3,
        leadType: "INDIVIDUAL",
        firstName: "Maya",
        lastName: "Singh",
        jobTitle: "Founder",
        email: "maya@orbit.example",
        mobile: "+91 99887 11223",
        website: "https://orbit.example",
        company: "Orbit Labs",
        industry: "BFSI",
        source: "EVENT",
        status: "CONTACTED",
        city: "Mumbai",
        country: "India",
        score: 45,
      },
    ],
  });

  const dealWon = await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      ownerId: manager.id,
      accountId: acme.id,
      contactId: contact.id,
      name: "Acme plant rollout",
      amount: 48000,
      stage: "NEGOTIATION",
      probability: 60,
      expectedClose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      customValues: JSON.stringify({ competitor: "LegacySoft" }),
    },
  });

  await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      ownerId: sales.id,
      accountId: northwind.id,
      name: "Northwind POS refresh",
      amount: 18500,
      stage: "PROPOSAL",
      probability: 40,
      expectedClose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 40),
    },
  });

  await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      ownerId: admin.id,
      name: "Inbound SMB bundle",
      amount: 6200,
      stage: "QUALIFICATION",
      probability: 15,
    },
  });

  await seedDashboardHistory(tenant.id, {
    adminId: admin.id,
    managerId: manager.id,
    salesId: sales.id,
  });

  await prisma.activity.createMany({
    data: [
      {
        tenantId: tenant.id,
        ownerId: sales.id,
        type: "CALL",
        subject: "Discovery call with Elena",
        body: "Interested in annual plan. Follow up next week.",
        leadId: (await prisma.lead.findFirst({ where: { email: "elena@brightco.example" } }))!.id,
      },
      {
        tenantId: tenant.id,
        ownerId: manager.id,
        type: "MEETING",
        subject: "Negotiation review — Acme",
        dealId: dealWon.id,
        accountId: acme.id,
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      },
      {
        tenantId: tenant.id,
        ownerId: sales.id,
        type: "TASK",
        subject: "Send Northwind proposal PDF",
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    ],
  });

  console.log("Seeded Horizon Sales (slug: demo)");
  console.log("  admin@demo.local / demo1234");
  console.log("  manager@demo.local / demo1234");
  console.log("  sales@demo.local / demo1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
