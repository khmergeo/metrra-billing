import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";

const CreatePaymentSchema = z.object({
  customerId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default("USD"),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "PAYPAL", "CRYPTO", "WIRE"]).optional(),
  provider: z.string().optional(),
  providerPaymentId: z.string().optional(),
  metadata: z.any().optional(),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");

    const where: any = { tenantId: ctx.tenantId };
    if (customerId) {
      where.customerId = customerId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = CreatePaymentSchema.parse(body);

      if (data.invoiceId) {
        const invoice = await prisma.invoice.findFirst({
          where: { id: data.invoiceId, tenantId: ctx.tenantId },
        });

        if (!invoice) {
          return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }
      }

      const payment = await prisma.payment.create({
        data: {
          tenantId: ctx.tenantId,
          customerId: data.customerId,
          invoiceId: data.invoiceId,
          amount: data.amount,
          currency: data.currency,
          paymentMethod: data.paymentMethod,
          provider: data.provider,
          providerPaymentId: data.providerPaymentId,
          status: "SUCCEEDED",
          metadata: data.metadata,
        },
      });

      return NextResponse.json({ payment }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create payment error:", error);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }
  });
}
