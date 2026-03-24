import prisma from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { hashApiKey } from "@/lib/auth";
import type { CreateTenantInput } from "@/lib/validators";

export async function createTenant(data: CreateTenantInput) {
  const { name, slug, adminEmail, adminName, adminPassword } = data;

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name,
        slug,
      },
    });

    const passwordHash = await hashPassword(adminPassword);

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: adminEmail,
        name: adminName,
        passwordHash,
        role: "OWNER",
      },
    });

    await tx.wallet.create({
      data: {
        tenantId: tenant.id,
        balance: 0,
        currency: "USD",
      },
    });

    const assetAccount = await tx.ledgerAccount.create({
      data: {
        tenantId: tenant.id,
        code: "1000",
        name: "Accounts Receivable",
        type: "ASSET",
      },
    });

    const liabilityAccount = await tx.ledgerAccount.create({
      data: {
        tenantId: tenant.id,
        code: "2000",
        name: "Accounts Payable",
        type: "LIABILITY",
      },
    });

    const revenueAccount = await tx.ledgerAccount.create({
      data: {
        tenantId: tenant.id,
        code: "4000",
        name: "Service Revenue",
        type: "REVENUE",
      },
    });

    await tx.ledgerAccount.create({
      data: {
        tenantId: tenant.id,
        code: "5000",
        name: "Cost of Goods Sold",
        type: "EXPENSE",
      },
    });

    return { tenant, accounts: { assetAccount, liabilityAccount, revenueAccount } };
  });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    include: { wallet: true },
  });
}
