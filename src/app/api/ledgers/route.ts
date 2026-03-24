import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/middleware";
import { recordLedgerEntry, getLedgerTrialBalance } from "@/services/ledger.service";

const LedgerEntrySchema = z.object({
  projectId: z.string().uuid(),
  debitAccountCode: z.string(),
  creditAccountCode: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  reference: z.string(),
});

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const trialBalance = await getLedgerTrialBalance(ctx.tenantId);
    return NextResponse.json({ trialBalance });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = LedgerEntrySchema.parse(body);

      const result = await recordLedgerEntry(
        ctx.tenantId,
        data.projectId,
        data.debitAccountCode,
        data.creditAccountCode,
        data.amount,
        data.description,
        data.reference
      );

      return NextResponse.json({ success: true, entries: result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Ledger entry error:", error);
      return NextResponse.json(
        { error: "Failed to create ledger entry" },
        { status: 500 }
      );
    }
  });
}
