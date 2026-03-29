import prisma from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";
import type { PricingRule, PricingType } from "@prisma/client";

interface Tier {
  upTo: number;
  price: number;
}

export type UsageRatingContext = {
  projectId?: string | null;
  productId?: string | null;
};

/** Rules with projectId / productId set only match when that id is provided and equal; null on the rule = wildcard. */
export function selectPricingRuleForUsage(
  rules: PricingRule[],
  ctx: UsageRatingContext
): PricingRule | null {
  const filtered = rules.filter((r) => {
    const projectOk =
      r.projectId == null ||
      (ctx.projectId != null && r.projectId === ctx.projectId);
    const productOk =
      r.productId == null ||
      (ctx.productId != null && r.productId === ctx.productId);
    return projectOk && productOk;
  });

  if (filtered.length === 0) return null;

  filtered.sort((a, b) => {
    const spec = (r: PricingRule) =>
      (r.projectId ? 1 : 0) * 2 + (r.productId ? 1 : 0);
    const d = spec(b) - spec(a);
    if (d !== 0) return d;
    return a.id.localeCompare(b.id);
  });

  return filtered[0];
}

function costForRule(rule: PricingRule, quantity: number): number {
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

export async function rateUsage(
  tenantId: string,
  eventName: string,
  quantity: number,
  ctx?: UsageRatingContext
): Promise<{ cost: number; pricingRuleId: string | null }> {
  const rules = await prisma.pricingRule.findMany({
    where: {
      plan: {
        tenantId,
        status: "ACTIVE",
      },
      eventName,
    },
  });

  const rule = selectPricingRuleForUsage(rules, ctx ?? {});
  if (!rule) {
    return { cost: 0, pricingRuleId: null };
  }

  return {
    cost: costForRule(rule, quantity),
    pricingRuleId: rule.id,
  };
}

export async function calculateCost(
  tenantId: string,
  eventName: string,
  quantity: number,
  ctx?: UsageRatingContext
): Promise<number> {
  const { cost } = await rateUsage(tenantId, eventName, quantity, ctx);
  return cost;
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
      status: "ACTIVE",
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
    productId?: string | null;
    projectId?: string | null;
  }
) {
  return prisma.pricingRule.create({
    data: {
      planId,
      eventName: data.eventName,
      metric: data.metric,
      pricingType: data.pricingType,
      flatRate: data.flatRate,
      unitPrice: data.unitPrice,
      tiers: data.tiers ? JSON.parse(JSON.stringify(data.tiers)) : undefined,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      productId: data.productId ?? null,
      projectId: data.projectId ?? null,
    },
  });
}
