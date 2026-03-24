import prisma from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { PricingType } from "@prisma/client";

interface Tier {
  upTo: number;
  price: number;
}

export async function calculateCost(
  tenantId: string,
  eventName: string,
  quantity: number
): Promise<number> {
  const rules = await prisma.pricingRule.findMany({
    where: {
      plan: {
        tenantId,
        status: "ACTIVE",
      },
      eventName,
    },
  });

  if (rules.length === 0) {
    return 0;
  }

  const rule = rules[0];
  const qty = new Decimal(quantity);

  switch (rule.pricingType as PricingType) {
    case "FLAT":
      return rule.flatRate?.toNumber() || 0;

    case "PER_UNIT":
      return qty.mul(rule.unitPrice?.toNumber() || 0).toNumber();

    case "TIERED":
      return calculateTieredCost(qty, rule.tiers as Tier[] | null);

    case "VOLUME":
      return calculateVolumeCost(qty, rule.tiers as Tier[] | null);

    default:
      return 0;
  }
}

function calculateTieredCost(quantity: Decimal, tiers: Tier[] | null): number {
  if (!tiers || tiers.length === 0) return 0;

  let totalCost = new Decimal(0);
  let remainingQty = quantity;

  const sortedTiers = [...tiers].sort((a, b) => a.upTo - b.upTo);

  for (const tier of sortedTiers) {
    if (remainingQty.lessThanOrEqualTo(0)) break;

    const tierQty = remainingQty.lessThan(tier.upTo)
      ? remainingQty
      : new Decimal(tier.upTo);

    totalCost = totalCost.add(tierQty.mul(tier.price));
    remainingQty = remainingQty.sub(tierQty);
  }

  return totalCost.toNumber();
}

function calculateVolumeCost(quantity: Decimal, tiers: Tier[] | null): number {
  if (!tiers || tiers.length === 0) return 0;

  const sortedTiers = [...tiers].sort((a, b) => b.upTo - a.upTo);
  const applicableTier = sortedTiers.find((t) => quantity.lessThanOrEqualTo(t.upTo));

  if (!applicableTier) return 0;

  return quantity.mul(applicableTier.price).toNumber();
}

export async function createPricingPlan(
  tenantId: string,
  name: string,
  description?: string
) {
  return prisma.pricingPlan.create({
    data: {
      tenantId,
      name,
      description,
      status: "DRAFT",
    },
  });
}

export async function addPricingRule(
  planId: string,
  data: {
    eventName: string;
    metric: string;
    pricingType: PricingType;
    flatRate?: number;
    unitPrice?: number;
    tiers?: Tier[];
    minQuantity?: number;
    maxQuantity?: number;
  }
) {
  return prisma.pricingRule.create({
    data: {
      planId,
      ...data,
    },
  });
}
