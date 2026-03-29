import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";

const CreateCustomerSchema = z.object({
  externalCustomerId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.any().optional(),
  billingType: z.enum(["PREPAID", "POSTPAID"]).optional(),
  metadata: z.any().optional(),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");
    const status = searchParams.get("status");

    const where: any = { tenantId: ctx.tenantId };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { externalCustomerId: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          wallet: true,
          _count: {
            select: {
              subscriptions: true,
              invoices: true,
              usageEvents: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = CreateCustomerSchema.parse(body);

      const existing = await prisma.customer.findFirst({
        where: { tenantId: ctx.tenantId, email: data.email },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }

      const customer = await prisma.customer.create({
        data: {
          tenantId: ctx.tenantId,
          externalCustomerId: data.externalCustomerId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          billingType: data.billingType || "POSTPAID",
          metadata: data.metadata,
        },
        include: {
          wallet: true,
        },
      });

      return NextResponse.json({ customer }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create customer error:", error);
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      );
    }
  });
}
