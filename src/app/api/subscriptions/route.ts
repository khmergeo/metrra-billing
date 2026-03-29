import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";

const CreateSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  pricingPlanId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY", "QUARTERLY", "PAY_AS_YOU_GO"]).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  metadata: z.any().optional(),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const where: any = { tenantId: ctx.tenantId };
    if (customerId) {
      where.customerId = customerId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ subscriptions });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = CreateSubscriptionSchema.parse(body);

      const customer = await prisma.customer.findFirst({
        where: { id: data.customerId, tenantId: ctx.tenantId },
      });

      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      const plan = await prisma.pricingPlan.findFirst({
        where: { id: data.pricingPlanId, tenantId: ctx.tenantId },
      });
      if (!plan) {
        return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
      }

      const startDate = data.startDate;
      const billingCycle = data.billingCycle || "MONTHLY";

      let currentPeriodEnd: Date;
      switch (billingCycle) {
        case "MONTHLY":
          currentPeriodEnd = new Date(startDate);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          break;
        case "YEARLY":
          currentPeriodEnd = new Date(startDate);
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          break;
        case "QUARTERLY":
          currentPeriodEnd = new Date(startDate);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
          break;
        default:
          currentPeriodEnd = new Date(startDate);
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      const subscription = await prisma.subscription.create({
        data: {
          customerId: data.customerId,
          tenantId: ctx.tenantId,
          pricingPlanId: data.pricingPlanId,
          billingCycle,
          startDate,
          endDate: data.endDate ?? null,
          currentPeriodStart: startDate,
          currentPeriodEnd,
          metadata: data.metadata,
        },
      });

      return NextResponse.json({ subscription }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create subscription error:", error);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }
  });
}
