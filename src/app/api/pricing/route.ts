import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import prisma from "@/lib/db";

const PricingPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  rules: z.array(
    z.object({
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
    })
  ).optional(),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const plans = await prisma.pricingPlan.findMany({
      where: { tenantId: ctx.tenantId },
      include: { rules: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ plans });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = PricingPlanSchema.parse(body);

      const plan = await prisma.pricingPlan.create({
        data: {
          tenantId: ctx.tenantId,
          name: data.name,
          description: data.description,
          effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
          effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
          status: "DRAFT",
          rules: data.rules ? {
            create: data.rules,
          } : undefined,
        },
        include: { rules: true },
      });

      return NextResponse.json({ plan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create pricing plan error:", error);
      return NextResponse.json(
        { error: "Failed to create pricing plan" },
        { status: 500 }
      );
    }
  });
}
