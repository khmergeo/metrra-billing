import prisma from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function deductWallet(
  tenantId: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { tenantId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const amountDecimal = new Decimal(amount);
    const newBalance = wallet.balance.sub(amountDecimal);

    if (newBalance.lessThan(0)) {
      throw new Error("Insufficient balance");
    }

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount: amountDecimal,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        reference,
        metadata,
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    return { transaction, newBalance: newBalance.toNumber() };
  });
}

export async function creditWallet(
  tenantId: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>
) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({
      where: { tenantId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const amountDecimal = new Decimal(amount);
    const newBalance = wallet.balance.add(amountDecimal);

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: amountDecimal,
        balanceBefore: wallet.balance,
        balanceAfter: newBalance,
        reference,
        metadata,
      },
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    return { transaction, newBalance: newBalance.toNumber() };
  });
}

export async function getWalletBalance(tenantId: string) {
  const wallet = await prisma.wallet.findUnique({
    where: { tenantId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  return wallet;
}
