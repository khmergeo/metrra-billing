import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { tenantId: ctx.tenantId },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.auditLog.count({
        where: { tenantId: ctx.tenantId },
      }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string; userId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const { action, resource, resourceId, changes } = body;

      const log = await prisma.auditLog.create({
        data: {
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          action,
          resource,
          resourceId,
          changes,
        },
      });

      return NextResponse.json({ log });
    } catch (error) {
      console.error("Audit log error:", error);
      return NextResponse.json(
        { error: "Failed to create audit log" },
        { status: 500 }
      );
    }
  });
}
