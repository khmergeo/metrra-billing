import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  
  if (!token) {
    throw new Error("Unauthorized");
  }

  const payload = await verifyToken(token);
  
  if (!payload || payload.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return payload;
}

export async function GET() {
  try {
    await requireAdmin();

    const [wallets, ledgerEntries, transactions] = await Promise.all([
      prisma.wallet.findMany({
        include: {
          tenant: {
            select: { name: true, slug: true },
          },
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      }),
      prisma.ledgerEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          tenant: { select: { name: true, slug: true } },
          project: { select: { name: true } },
          account: { select: { name: true, code: true } },
        },
      }),
      prisma.walletTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const totalBalance = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balance.toString()),
      0
    );

    const totalCredits = transactions
      .filter(t => t.type === "CREDIT")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const totalDebits = transactions
      .filter(t => t.type === "DEBIT")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return NextResponse.json({
      wallets: wallets.map((w) => ({
        id: w.id,
        tenantId: w.tenantId,
        tenantName: w.tenant.name,
        tenantSlug: w.tenant.slug,
        balance: w.balance.toString(),
        currency: w.currency,
        alertThreshold: w.alertThreshold?.toString() || null,
        createdAt: w.createdAt.toISOString(),
        recentTransactions: w.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount.toString(),
          createdAt: t.createdAt.toISOString(),
        })),
      })),
      ledgerEntries: ledgerEntries.map((e) => ({
        id: e.id,
        tenantId: e.tenantId,
        projectId: e.projectId,
        accountId: e.accountId,
        entryType: e.entryType,
        amount: e.amount.toString(),
        description: e.description,
        reference: e.reference,
        createdAt: e.createdAt.toISOString(),
        tenant: e.tenant,
        project: e.project,
        account: e.account,
      })),
      stats: {
        totalBalance,
        avgBalance: wallets.length > 0 ? totalBalance / wallets.length : 0,
        totalCredits,
        totalDebits,
      },
    });
  } catch (error) {
    console.error("Get wallets error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
