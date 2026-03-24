import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware";
import { getWalletBalance, deductWallet, creditWallet } from "@/services/wallet.service";

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const wallet = await getWalletBalance(ctx.tenantId);
    return NextResponse.json({ wallet });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const { action, amount, reference } = body;

      if (action === "credit") {
        const result = await creditWallet(ctx.tenantId, amount, reference);
        return NextResponse.json({ success: true, balance: result.newBalance });
      } else if (action === "debit") {
        const result = await deductWallet(ctx.tenantId, amount, reference);
        return NextResponse.json({ success: true, balance: result.newBalance });
      }

      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
      console.error("Wallet operation error:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Operation failed" },
        { status: 400 }
      );
    }
  });
}
