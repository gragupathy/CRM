import { PrismaClient } from "@prisma/client";

const SCHEMA_VERSION = "company-account-type";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: string;
};

function createClient() {
  return new PrismaClient();
}

if (globalForPrisma.prisma && globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION;
}
