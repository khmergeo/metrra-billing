import prisma from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function createInvoice(
  tenantId: string,
  periodStart: Date,
  periodEnd: Date,
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = new Decimal(subtotal).mul(0).toNumber();
  const total = subtotal + tax;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { tenantId },
    orderBy: { invoiceNumber: "desc" },
  });

  const lastNumber = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.split("-").pop() || "0")
    : 0;
  const invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, "0")}`;

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: "DRAFT",
        periodStart,
        periodEnd,
        subtotal: new Decimal(subtotal),
        tax: new Decimal(tax),
        total: new Decimal(total),
        currency: "USD",
        dueDate: new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
        lineItems: {
          create: lineItems.map((item) => ({
            description: item.description,
            quantity: new Decimal(item.quantity),
            unitPrice: new Decimal(item.unitPrice),
            amount: new Decimal(item.amount),
          })),
        },
      },
      include: { lineItems: true },
    });

    return invoice;
  });
}

export async function getInvoices(tenantId: string, status?: string) {
  return prisma.invoice.findMany({
    where: {
      tenantId,
      ...(status && { status: status as any }),
    },
    include: { lineItems: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateInvoicePdf(invoiceId: string): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true, tenant: true },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;

  page.drawText("INVOICE", {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });

  y -= 30;
  page.drawText(`Invoice #: ${invoice.invoiceNumber}`, {
    x: 50,
    y,
    size: 10,
    font,
  });

  y -= 15;
  page.drawText(`Date: ${invoice.createdAt.toLocaleDateString()}`, {
    x: 50,
    y,
    size: 10,
    font,
  });

  y -= 15;
  page.drawText(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, {
    x: 50,
    y,
    size: 10,
    font,
  });

  y -= 40;
  page.drawText("Bill To:", {
    x: 50,
    y,
    size: 10,
    font: boldFont,
  });

  y -= 15;
  page.drawText(invoice.tenant.name, {
    x: 50,
    y,
    size: 10,
    font,
  });

  y -= 40;
  page.drawText("Description", {
    x: 50,
    y,
    size: 10,
    font: boldFont,
  });

  page.drawText("Qty", {
    x: 350,
    y,
    size: 10,
    font: boldFont,
  });

  page.drawText("Amount", {
    x: 450,
    y,
    size: 10,
    font: boldFont,
  });

  y -= 20;

  for (const item of invoice.lineItems) {
    page.drawText(item.description, {
      x: 50,
      y,
      size: 10,
      font,
    });

    page.drawText(item.quantity.toString(), {
      x: 350,
      y,
      size: 10,
      font,
    });

    page.drawText(`$${item.amount.toString()}`, {
      x: 450,
      y,
      size: 10,
      font,
    });

    y -= 20;
  }

  y -= 20;
  page.drawLine({
    start: { x: 350, y },
    end: { x: 562, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 20;
  page.drawText(`Subtotal: $${invoice.subtotal.toString()}`, {
    x: 400,
    y,
    size: 10,
    font,
  });

  y -= 15;
  page.drawText(`Tax: $${invoice.tax.toString()}`, {
    x: 400,
    y,
    size: 10,
    font,
  });

  y -= 15;
  page.drawText(`Total: $${invoice.total.toString()}`, {
    x: 400,
    y,
    size: 12,
    font: boldFont,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
