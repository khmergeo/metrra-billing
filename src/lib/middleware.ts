import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import prisma from "@/lib/db";

export async function withAuth(
  request: Request,
  handler: (req: Request, context: { userId: string; tenantId: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await getAuthFromRequest(request as unknown as NextRequest);
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler(request, {
    userId: auth.userId,
    tenantId: auth.tenantId,
  });
}

export async function withTenantIsolation(
  request: Request,
  handler: (req: Request, context: { tenantId: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const auth = await getAuthFromRequest(request as unknown as NextRequest);
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler(request, {
    tenantId: auth.tenantId,
  });
}

export async function withApiKey(
  request: Request,
  handler: (req: Request, context: { tenantId: string; projectId?: string }) => Promise<NextResponse>
): Promise<NextResponse> {
  const apiKey = request.headers.get("x-api-key");
  
  if (!apiKey) {
    return NextResponse.json({ error: "API key required" }, { status: 401 });
  }

  const keyHash = require("crypto")
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const keyRecord = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      status: "ACTIVE",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: { tenant: true },
  });

  if (!keyRecord) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  await prisma.apiKey.update({
    where: { id: keyRecord.id },
    data: { lastUsedAt: new Date() },
  });

  return handler(request, {
    tenantId: keyRecord.tenantId,
    projectId: keyRecord.projectId || undefined,
  });
}
