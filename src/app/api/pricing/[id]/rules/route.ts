import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import prisma from "@/lib/db";

const PricingRuleSchema = z.object({
  eventName: z.string().min(1),
  metric: z.string().min(1),
  pricingType: z.enum(["FLAT", "PER_UNIT", "TIERED", "VOLUME"]),
  flatRate: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  tiers: z.array(
    z.object({
      upTo: z.number().positive(),
      price: z.number(),
    })
  ).optional(),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().positive().optional(),
  productId: z.string().optional(),
  projectId: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }>; tenantId: string }
) {
  const { id: planId } = await context.params;
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const ruleData = PricingRuleSchema.parse(body);

      const plan = await prisma.pricingPlan.findFirst({
        where: {
          id: planId,
          tenantId: ctx.tenantId,
        },
      });

      if (!plan) {
        return NextResponse.json(
          { error: "Pricing plan not found" },
          { status: 404 }
        );
      }

      const rule = await prisma.pricingRule.create({
        data: {
          planId: planId,
          eventName: ruleData.eventName,
          metric: ruleData.metric,
          pricingType: ruleData.pricingType,
          flatRate: ruleData.flatRate ? ruleData.flatRate : null,
          unitPrice: ruleData.unitPrice ? ruleData.unitPrice : null,
          tiers: ruleData.tiers || undefined,
          minQuantity: ruleData.minQuantity ? ruleData.minQuantity : null,
          maxQuantity: ruleData.maxQuantity ? ruleData.maxQuantity : null,
          productId: ruleData.productId || null,
          projectId: ruleData.projectId || null,
        },
      });

      return NextResponse.json({ rule });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Add pricing rule error:", error);
      return NextResponse.json(
        { error: "Failed to add pricing rule" },
        { status: 500 }
      );
    }
  });
}
