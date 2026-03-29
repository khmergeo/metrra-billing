import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import prisma from "@/lib/db";

const PatchPlanSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { tenantId: string; params: Promise<{ id: string }> }
) {
  const { id: planId } = await context.params;
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = PatchPlanSchema.parse(body);

      const existing = await prisma.pricingPlan.findFirst({
        where: { id: planId, tenantId: ctx.tenantId },
      });
      if (!existing) {
        return NextResponse.json({ error: "Pricing plan not found" }, { status: 404 });
      }

      const plan = await prisma.pricingPlan.update({
        where: { id: planId },
        data: {
          ...(data.status != null && { status: data.status }),
          ...(data.name != null && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
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
      console.error("Patch pricing plan error:", error);
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    }
  });
}
