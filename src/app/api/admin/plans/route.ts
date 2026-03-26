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

    const [plans, rules] = await Promise.all([
      prisma.pricingPlan.findMany({
        include: {
          tenant: { select: { name: true } },
          _count: { select: { rules: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pricingRule.findMany({
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        tenantId: p.tenantId,
        tenantName: p.tenant.name,
        ruleCount: p._count.rules,
        effectiveFrom: p.effectiveFrom?.toISOString() || null,
        effectiveTo: p.effectiveTo?.toISOString() || null,
        createdAt: p.createdAt.toISOString(),
      })),
      rules: rules.map((r) => ({
        id: r.id,
        eventName: r.eventName,
        metric: r.metric,
        pricingType: r.pricingType,
        flatRate: r.flatRate?.toString() || null,
        unitPrice: r.unitPrice?.toString() || null,
        planId: r.planId,
      })),
    });
  } catch (error) {
    console.error("Get plans error:", error);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 500 }
    );
  }
}
