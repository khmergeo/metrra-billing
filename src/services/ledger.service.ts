import prisma from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function recordLedgerEntry(
  tenantId: string,
  projectId: string,
  debitAccountCode: string,
  creditAccountCode: string,
  amount: number,
  description: string,
  reference: string,
  metadata?: Record<string, unknown>
) {
  return prisma.$transaction(async (tx) => {
    const debitAccount = await tx.ledgerAccount.findFirst({
      where: { tenantId, code: debitAccountCode },
    });

    const creditAccount = await tx.ledgerAccount.findFirst({
      where: { tenantId, code: creditAccountCode },
    });

    if (!debitAccount || !creditAccount) {
      throw new Error("Account not found");
    }

    const amountDecimal = new Decimal(amount);

    const [debitEntry, creditEntry] = await Promise.all([
      tx.ledgerEntry.create({
        data: {
          tenantId,
          projectId,
          accountId: debitAccount.id,
          entryType: "DEBIT",
          amount: amountDecimal,
          description,
          reference,
          metadata: { ...metadata, oppositeAccount: creditAccountCode },
        },
      }),
      tx.ledgerEntry.create({
        data: {
          tenantId,
          projectId,
          accountId: creditAccount.id,
          entryType: "CREDIT",
          amount: amountDecimal,
          description,
          reference,
          metadata: { ...metadata, oppositeAccount: debitAccountCode },
        },
      }),
    ]);

    return { debitEntry, creditEntry };
  });
}

export async function getLedgerBalance(tenantId: string, accountCode: string) {
  const account = await prisma.ledgerAccount.findFirst({
    where: { tenantId, code: accountCode },
    include: {
      entries: true,
    },
  });

  if (!account) return null;

  let debitTotal = new Decimal(0);
  let creditTotal = new Decimal(0);

  for (const entry of account.entries) {
    if (entry.entryType === "DEBIT") {
      debitTotal = debitTotal.add(entry.amount);
    } else {
      creditTotal = creditTotal.add(entry.amount);
    }
  }

  return {
    account,
    debitTotal: debitTotal.toNumber(),
    creditTotal: creditTotal.toNumber(),
    balance:
      account.type === "ASSET" || account.type === "EXPENSE"
        ? debitTotal.sub(creditTotal).toNumber()
        : creditTotal.sub(debitTotal).toNumber(),
  };
}

export async function getLedgerTrialBalance(tenantId: string) {
  const accounts = await prisma.ledgerAccount.findMany({
    where: { tenantId },
    include: { entries: true },
  });

  const trialBalance = accounts.map((account) => {
    let debitTotal = new Decimal(0);
    let creditTotal = new Decimal(0);

    for (const entry of account.entries) {
      if (entry.entryType === "DEBIT") {
        debitTotal = debitTotal.add(entry.amount);
      } else {
        creditTotal = creditTotal.add(entry.amount);
      }
    }

    return {
      code: account.code,
      name: account.name,
      type: account.type,
      debit: debitTotal.toNumber(),
      credit: creditTotal.toNumber(),
    };
  });

  return trialBalance;
}
