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

    const [roles, apiKeys] = await Promise.all([
      prisma.role.findMany({
        include: {
          _count: {
            select: { rolePermissions: true },
          },
        },
      }),
      prisma.apiKey.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const apiKeyStats = {
      total: apiKeys.reduce((sum, k) => sum + k._count, 0),
      active: apiKeys.find(k => k.status === "ACTIVE")?._count || 0,
      revoked: apiKeys.find(k => k.status === "REVOKED")?._count || 0,
      expired: apiKeys.find(k => k.status === "EXPIRED")?._count || 0,
    };

    const userRoles = await prisma.user.groupBy({
      by: ["role"],
      _count: true,
    });

    const roleMap = new Map(userRoles.map(r => [r.role as string, r._count]));
    
    const defaultPermissions: Record<string, any> = {
      OWNER: { tenants: ["create", "read", "update", "delete"], users: ["create", "read", "update", "delete", "suspend"], projects: ["create", "read", "update", "delete"], apiKeys: ["create", "read", "revoke"], wallets: ["read", "credit", "debit"], usage: ["create", "read"], pricing: ["create", "read", "update", "delete"], invoices: ["create", "read", "update", "send", "cancel"], audit: ["read"], settings: ["read", "update"] },
      ADMIN: { tenants: ["read", "update"], users: ["create", "read", "update", "suspend"], projects: ["create", "read", "update", "delete"], apiKeys: ["create", "read", "revoke"], wallets: ["read", "credit", "debit"], usage: ["read"], pricing: ["create", "read", "update"], invoices: ["create", "read", "update", "send"], audit: ["read"], settings: ["read", "update"] },
      MEMBER: { projects: ["read", "update"], apiKeys: ["create", "read"], wallets: ["read"], usage: ["create", "read"], pricing: ["read"], invoices: ["read"], settings: ["read"] },
      VIEWER: { projects: ["read"], apiKeys: ["read"], wallets: ["read"], usage: ["read"], pricing: ["read"], invoices: ["read"] },
    };

    return NextResponse.json({
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        permissions: r.permissions,
        userCount: roleMap.get(r.name) || 0,
        createdAt: r.createdAt.toISOString(),
      })),
      defaultRoles: ["OWNER", "ADMIN", "MEMBER", "VIEWER"].map((name) => ({
        name,
        userCount: roleMap.get(name) || 0,
        permissions: defaultPermissions[name] || {},
      })),
      apiKeyStats,
    });
  } catch (error) {
    console.error("Get security error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security data" },
      { status: 500 }
    );
  }
}
