import prisma from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";
import type { LoginInput } from "@/lib/validators";

export async function authenticateUser(data: LoginInput) {
  const { email, password, tenantSlug } = data;

  const user = await prisma.user.findFirst({
    where: tenantSlug
      ? {
          email,
          tenant: { slug: tenantSlug },
        }
      : { email },
    include: { tenant: true },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is not active");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const token = await signToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  });

  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}
