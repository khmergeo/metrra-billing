import { z } from "zod";
declare const UsageEventSchema: z.ZodObject<{
    eventName: z.ZodString;
    properties: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    quantity: z.ZodNumber;
    unit: z.ZodString;
    timestamp: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    idempotencyKey: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    /** Required when the API key is not scoped to a project */
    projectId: z.ZodOptional<z.ZodString>;
    /** When set, matches pricing rules scoped to this product */
    productId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    eventName: string;
    quantity: number;
    unit: string;
    timestamp: string | Date;
    properties?: Record<string, unknown> | undefined;
    idempotencyKey?: string | undefined;
    projectId?: string | undefined;
    productId?: string | undefined;
}, {
    eventName: string;
    quantity: number;
    unit: string;
    timestamp: string | Date;
    properties?: Record<string, unknown> | undefined;
    idempotencyKey?: unknown;
    projectId?: string | undefined;
    productId?: string | undefined;
}>;
export type UsageEventInput = z.infer<typeof UsageEventSchema>;
export interface RecordUsageResponse {
    success: boolean;
    eventId: string;
    estimatedCost: number;
    pricingRuleId: string | null;
}
export interface MeterraConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export declare class MeterraError extends Error {
    statusCode?: number | undefined;
    code?: string | undefined;
    constructor(message: string, statusCode?: number | undefined, code?: string | undefined);
}
export declare class Meterra {
    private apiKey;
    private baseUrl;
    private timeout;
    constructor(config: MeterraConfig);
    recordUsage(event: UsageEventInput): Promise<RecordUsageResponse>;
    recordBatchUsage(events: UsageEventInput[]): Promise<{
        success: boolean;
        results: Array<{
            eventId: string;
            estimatedCost: number;
            pricingRuleId: string | null;
        } | {
            error: string;
        }>;
    }>;
}
export interface InitOptions {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}
export declare function init(options: InitOptions): Meterra;
export declare function getInstance(): Meterra;
export declare const meterra: {
    init: typeof init;
    getInstance: typeof getInstance;
    recordUsage: (event: UsageEventInput) => Promise<RecordUsageResponse>;
    recordBatchUsage: (events: UsageEventInput[]) => Promise<{
        success: boolean;
        results: Array<{
            eventId: string;
            estimatedCost: number;
            pricingRuleId: string | null;
        } | {
            error: string;
        }>;
    }>;
};
export default meterra;
//# sourceMappingURL=index.d.ts.map