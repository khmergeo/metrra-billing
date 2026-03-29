import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";
import { hashApiKey, generateApiKey } from "@/lib/auth";
import { ApiKeySchema } from "@/lib/validators";

export async function DELETE(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json({ error: "Key ID required" }, { status: 400 });
    }

    await prisma.apiKey.deleteMany({
      where: { id: keyId, tenantId: ctx.tenantId },
    });

    return NextResponse.json({ success: true });
  });
}

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId: ctx.tenantId },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        projectId: true,
        status: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ apiKeys });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await req.json();
      const data = ApiKeySchema.parse(body);

      const { key, hash, prefix } = generateApiKey();
      const keyHash = hashApiKey(key);

      const apiKey = await prisma.apiKey.create({
        data: {
          tenantId: ctx.tenantId,
          keyHash,
          keyPrefix: prefix,
          name: data.name,
          projectId: data.projectId,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      return NextResponse.json({
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          key,
          prefix: apiKey.keyPrefix,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create API key error:", error);
      return NextResponse.json(
        { error: "Failed to create API key" },
        { status: 500 }
      );
    }
  });
}
