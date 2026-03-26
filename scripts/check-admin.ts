import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: "admin@meterra.io", role: "ADMIN" }
  });
  
  if (admin) {
    console.log("Admin found:", {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      passwordHash: admin.passwordHash,
    });
    
    if (admin.passwordHash.startsWith('$2')) {
      console.log("\nPassword hash looks like bcrypt (good!)");
    } else {
      console.log("\nPassword hash does NOT look like bcrypt!");
      console.log("First 10 chars:", admin.passwordHash.substring(0, 10));
    }
  } else {
    console.log("Admin not found");
  }
}

main().finally(() => prisma.$disconnect());
