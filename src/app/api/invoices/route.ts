import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { createInvoice, getInvoices, generateInvoicePdf } from "@/services/invoice.service";

const CreateInvoiceSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      amount: z.number().positive(),
    })
  ),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;

    const invoices = await getInvoices(ctx.tenantId, status);
    return NextResponse.json({ invoices });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = CreateInvoiceSchema.parse(body);

      const invoice = await createInvoice(
        ctx.tenantId,
        new Date(data.periodStart),
        new Date(data.periodEnd),
        data.lineItems
      );

      return NextResponse.json({ invoice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create invoice error:", error);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }
  });
}
