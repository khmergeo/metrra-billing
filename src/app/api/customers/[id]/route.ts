import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";

const UpdateCustomerSchema = z.object({
  externalCustomerId: z.string().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.any().optional(),
  billingType: z.enum(["PREPAID", "POSTPAID"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CHURNED"]).optional(),
  metadata: z.any().optional(),
});

export async function GET(
  request: Request,
  context: { tenantId: string; params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        wallet: true,
        subscriptions: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            usageEvents: true,
            invoices: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
  }, { id });
}

export async function PATCH(
  request: Request,
  context: { tenantId: string; params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = UpdateCustomerSchema.parse(body);

      const customer = await prisma.customer.updateMany({
        where: { id, tenantId: ctx.tenantId },
        data,
      });

      if (customer.count === 0) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const updated = await prisma.customer.findFirst({
        where: { id, tenantId: ctx.tenantId },
        include: { wallet: true },
      });

      return NextResponse.json({ customer: updated });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Update customer error:", error);
      return NextResponse.json(
        { error: "Failed to update customer" },
        { status: 500 }
      );
    }
  }, { id });
}

export async function DELETE(
  request: Request,
  context: { tenantId: string; params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    await prisma.customer.updateMany({
      where: { id, tenantId: ctx.tenantId },
      data: { status: "CHURNED" },
    });

    return NextResponse.json({ success: true });
  }, { id });
}
