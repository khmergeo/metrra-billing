import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withApiKey } from "@/lib/middleware";
import { UsageEventSchema } from "@/lib/validators";
import { rateUsage } from "@/services/rating.service";

export async function POST(
  request: Request,
  context: { tenantId: string; projectId?: string }
) {
  return withApiKey(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = UsageEventSchema.parse(body);

      const effectiveProjectId = ctx.projectId ?? data.projectId;
      if (!effectiveProjectId) {
        return NextResponse.json(
          {
            error:
              "projectId is required: use a project-scoped API key or pass projectId in the request body",
          },
          { status: 400 }
        );
      }

      const project = await prisma.project.findFirst({
        where: {
          id: effectiveProjectId,
          tenantId: ctx.tenantId,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      if (data.productId) {
        const product = await prisma.product.findFirst({
          where: {
            id: data.productId,
            tenantId: ctx.tenantId,
          },
        });
        if (!product) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }
      }

      const event = await prisma.usageEvent.create({
        data: {
          projectId: effectiveProjectId,
          eventName: data.eventName,
          properties: JSON.parse(JSON.stringify(data.properties || {})),
          quantity: data.quantity,
          unit: data.unit,
          timestamp: new Date(data.timestamp),
          idempotencyKey: data.idempotencyKey,
        },
      });

      const { cost, pricingRuleId } = await rateUsage(
        ctx.tenantId,
        data.eventName,
        data.quantity,
        {
          projectId: effectiveProjectId,
          productId: data.productId,
        }
      );

      return NextResponse.json({
        success: true,
        eventId: event.id,
        estimatedCost: cost,
        pricingRuleId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Usage event error:", error);
      return NextResponse.json(
        { error: "Failed to record usage" },
        { status: 500 }
      );
    }
  });
}
