import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/** Debit wallet inside an existing transaction (e.g. with usage ingest). */
export async function deductWalletTx(
  tx: Prisma.TransactionClient,
  tenantId: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>
) {
  if (amount <= 0) {
    return null;
  }

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
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  });

  return { transaction, newBalance: newBalance.toNumber() };
}

export async function deductWallet(
  tenantId: string,
  amount: number,
  reference: string,
  metadata?: Record<string, unknown>
) {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }
  const result = await prisma.$transaction((tx) =>
    deductWalletTx(tx, tenantId, amount, reference, metadata)
  );
  if (!result) {
    throw new Error("Debit failed");
  }
  return result;
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
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
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
