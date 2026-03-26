import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Recreating admin account with correct password hash...\n");

  const email = "admin@meterra.io";
  const password = "admin123";
  const name = "Admin";

  const tenant = await prisma.tenant.upsert({
    where: { slug: "meterra" },
    update: {},
    create: {
      name: "Meterra Platform",
      slug: "meterra",
      status: "ACTIVE",
    },
  });

  console.log(`✓ Found tenant: ${tenant.name}`);

  await prisma.wallet.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      balance: 0,
      currency: "USD",
    },
  });

  const existingAccounts = await prisma.ledgerAccount.findFirst({
    where: { tenantId: tenant.id, code: "1000" },
  });

  if (!existingAccounts) {
    await prisma.ledgerAccount.createMany({
      data: [
        { tenantId: tenant.id, code: "1000", name: "Accounts Receivable", type: "ASSET" },
        { tenantId: tenant.id, code: "2000", name: "Accounts Payable", type: "LIABILITY" },
        { tenantId: tenant.id, code: "4000", name: "Service Revenue", type: "REVENUE" },
        { tenantId: tenant.id, code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" },
      ],
    });
    console.log("✓ Created ledger accounts");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { 
      role: "ADMIN", 
      passwordHash, 
      name,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email,
      name,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("\n" + "=".repeat(50));
  console.log("✅ ADMIN ACCOUNT UPDATED!");
  console.log("=".repeat(50));
  console.log("\n📧 Login Credentials:");
  console.log("   ─────────────────────────────");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ADMIN`);
  console.log(`   Tenant:   ${tenant.name}`);
  console.log("\n🔗 Admin Portal: http://localhost:3000/admin/login");
  console.log("=".repeat(50) + "\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
