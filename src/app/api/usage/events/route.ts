import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withApiKey } from "@/lib/middleware";
import { UsageEventSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  context: { tenantId: string; projectId?: string }
) {
  return withApiKey(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = UsageEventSchema.parse(body);

      if (ctx.projectId) {
        const project = await prisma.project.findFirst({
          where: {
            id: ctx.projectId,
            tenantId: ctx.tenantId,
          },
        });

        if (!project) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
          );
        }
      }

      const event = await prisma.usageEvent.create({
        data: {
          projectId: ctx.projectId || "",
          eventName: data.eventName,
          properties: data.properties || {},
          quantity: data.quantity,
          unit: data.unit,
          timestamp: new Date(data.timestamp),
          idempotencyKey: data.idempotencyKey,
        },
      });

      return NextResponse.json({
        success: true,
        eventId: event.id,
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
