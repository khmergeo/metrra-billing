import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().default("unit"),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const products = await prisma.product.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        _count: {
          select: { pricingRules: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = CreateProductSchema.parse(body);

      const existing = await prisma.product.findFirst({
        where: { tenantId: ctx.tenantId, name: data.name },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Product with this name already exists" },
          { status: 400 }
        );
      }

      const product = await prisma.product.create({
        data: {
          tenantId: ctx.tenantId,
          name: data.name,
          description: data.description,
          unit: data.unit,
        },
      });

      return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create product error:", error);
      return NextResponse.json(
        { error: "Failed to create product" },
        { status: 500 }
      );
    }
  });
}
