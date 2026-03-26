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
    const resource = searchParams.get("resource");
    const search = searchParams.get("search");

    const where: any = {};
    
    if (resource && resource !== "ALL") {
      where.resource = resource;
    }
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { resource: { contains: search, mode: "insensitive" } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        tenant: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        resource: l.resource,
        resourceId: l.resourceId,
        changes: l.changes,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        createdAt: l.createdAt.toISOString(),
        tenantId: l.tenantId,
        userId: l.userId,
        userName: l.user?.name || null,
        userEmail: l.user?.email || null,
        tenantName: l.tenant?.name || null,
      })),
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
