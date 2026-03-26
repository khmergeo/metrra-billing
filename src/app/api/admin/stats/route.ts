import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = await verifyToken(token);
  
  if (!payload || payload.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return payload;
}

export async function GET() {
  try {
    await requireAdmin();

    const [tenants, users, usageEvents, wallets, invoices] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.usageEvent.count(),
      prisma.wallet.findMany({ select: { balance: true } }),
      prisma.invoice.findMany({ select: { status: true, total: true } }),
    ]);

    const totalRevenue = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balance.toString()),
      0
    );

    const pendingInvoices = invoices.filter(i => i.status === "PENDING").length;

    const recentTenants = await prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { users: true } },
      },
    });

    const stats = {
      totalTenants: tenants,
      activeTenants: await prisma.tenant.count({ where: { status: "ACTIVE" } }),
      totalUsers: users,
      totalUsageEvents: usageEvents,
      totalRevenue,
      pendingInvoices,
      recentActivity: usageEvents,
      failedOperations: 0,
    };

    return NextResponse.json({
      stats,
      recentTenants: recentTenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        userCount: t._count.users,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
