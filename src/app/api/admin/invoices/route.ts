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

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    
    if (status && status !== "ALL") {
      where.status = status;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const tenantIds = Array.from(new Set(invoices.map(i => i.tenantId)));
    const tenants = await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, name: true, slug: true },
    });
    const tenantMap = new Map(tenants.map(t => [t.id, t]));

    const allInvoices = await prisma.invoice.findMany();
    
    const stats = {
      total: allInvoices.length,
      pending: allInvoices.filter(i => i.status === "PENDING").length,
      paid: allInvoices.filter(i => i.status === "PAID").length,
      overdue: allInvoices.filter(i => i.status === "OVERDUE").length,
      totalAmount: allInvoices.reduce((sum, i) => sum + parseFloat(i.total.toString()), 0),
    };

    return NextResponse.json({
      invoices: invoices.map((i) => {
        const tenant = tenantMap.get(i.tenantId);
        return {
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          status: i.status,
          subtotal: i.subtotal.toString(),
          tax: i.tax.toString(),
          total: i.total.toString(),
          currency: i.currency,
          tenantId: i.tenantId,
          tenantName: tenant?.name || "Unknown",
          tenantSlug: tenant?.slug || "unknown",
          periodStart: i.periodStart.toISOString(),
          periodEnd: i.periodEnd.toISOString(),
          dueDate: i.dueDate.toISOString(),
          paidAt: i.paidAt?.toISOString() || null,
          createdAt: i.createdAt.toISOString(),
        };
      }),
      stats,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
