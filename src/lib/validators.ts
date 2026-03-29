import { z } from "zod";

export const TenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export const CreateTenantSchema = TenantSchema.extend({
  adminEmail: z.string().email(),
  adminName: z.string().min(1),
  adminPassword: z.string().min(8),
});

export const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).optional(),
});

export const CreateUserSchema = UserSchema.extend({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
});

export const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export const ApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const UsageEventSchema = z.object({
  eventName: z.string().min(1),
  properties: z.record(z.unknown()).optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  timestamp: z.string().datetime(),
  idempotencyKey: z.string().optional(),
  projectId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});

export const PricingPlanSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
});

export const PricingRuleSchema = z.object({
  eventName: z.string().min(1),
  metric: z.string().min(1),
  pricingType: z.enum(["FLAT", "PER_UNIT", "TIERED", "VOLUME"]),
  flatRate: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  tiers: z
    .array(
      z.object({
        upTo: z.number().positive(),
        price: z.number(),
      })
    )
    .optional(),
  minQuantity: z.number().min(0).optional(),
  maxQuantity: z.number().positive().optional(),
});

export type TenantInput = z.infer<typeof TenantSchema>;
export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UserInput = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProjectInput = z.infer<typeof ProjectSchema>;
export type ApiKeyInput = z.infer<typeof ApiKeySchema>;
export type UsageEventInput = z.infer<typeof UsageEventSchema>;
export type PricingPlanInput = z.infer<typeof PricingPlanSchema>;
export type PricingRuleInput = z.infer<typeof PricingRuleSchema>;
