import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "@/lib/db";
import { withApiKey, withAuth } from "@/lib/middleware";
import { UsageEventSchema } from "@/lib/validators";
import { rateUsage } from "@/services/rating.service";
import { deductWalletTx } from "@/services/wallet.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const where = { project: { tenantId: ctx.tenantId } };

    const [events, total, spendAgg] = await Promise.all([
      prisma.usageEvent.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 500,
      }),
      prisma.usageEvent.count({ where }),
      prisma.usageEvent.aggregate({
        where,
        _sum: { ratedCost: true },
      }),
    ]);

    const serialized = events.map((e) => ({
      id: e.id,
      projectId: e.projectId,
      projectName: e.project.name,
      eventName: e.eventName,
      properties: e.properties as Record<string, unknown>,
      quantity: e.quantity.toString(),
      unit: e.unit,
      timestamp: e.timestamp.toISOString(),
      createdAt: e.createdAt.toISOString(),
      ratedCost: e.ratedCost?.toString() ?? null,
      appliedRuleId: e.appliedRuleId,
    }));

    return NextResponse.json({
      events: serialized,
      total,
      totalRatedSpend: spendAgg._sum.ratedCost?.toString() ?? "0",
    });
  });
}

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

      const { event, cost, pricingRuleId } = await prisma.$transaction(
        async (tx) => {
          const rated = await rateUsage(
            ctx.tenantId,
            data.eventName,
            data.quantity,
            {
              projectId: effectiveProjectId,
              productId: data.productId,
            },
            tx
          );

          const event = await tx.usageEvent.create({
            data: {
              projectId: effectiveProjectId,
              eventName: data.eventName,
              properties: JSON.parse(JSON.stringify(data.properties || {})),
              quantity: data.quantity,
              unit: data.unit,
              timestamp: new Date(data.timestamp),
              idempotencyKey: data.idempotencyKey ?? undefined,
              ratedCost:
                rated.cost > 0 ? new Decimal(rated.cost) : null,
              appliedRuleId: rated.pricingRuleId,
            },
          });

          await deductWalletTx(
            tx,
            ctx.tenantId,
            rated.cost,
            `usage:${event.id}`,
            {
              usageEventId: event.id,
              eventName: data.eventName,
              pricingRuleId: rated.pricingRuleId,
            }
          );

          return {
            event,
            cost: rated.cost,
            pricingRuleId: rated.pricingRuleId,
          };
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
      if (error instanceof Error) {
        if (error.message === "Insufficient balance") {
          return NextResponse.json(
            { error: "Insufficient wallet balance" },
            { status: 402 }
          );
        }
        if (error.message === "Wallet not found") {
          return NextResponse.json(
            { error: "Wallet not found for tenant" },
            { status: 500 }
          );
        }
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const fields = error.meta?.target;
        const isIdempotency =
          Array.isArray(fields) &&
          fields.some((f) => String(f).includes("idempotency"));
        return NextResponse.json(
          {
            error: isIdempotency
              ? "Duplicate idempotency key; this event was already recorded"
              : "Unique constraint violation",
          },
          { status: 409 }
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
