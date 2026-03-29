"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.meterra = exports.Meterra = exports.MeterraError = void 0;
exports.init = init;
exports.getInstance = getInstance;
const zod_1 = require("zod");
const UsageEventSchema = zod_1.z.object({
    eventName: zod_1.z.string().min(1),
    properties: zod_1.z.record(zod_1.z.unknown()).optional(),
    quantity: zod_1.z.number().positive(),
    unit: zod_1.z.string().min(1),
    timestamp: zod_1.z.string().datetime().or(zod_1.z.date()),
    idempotencyKey: zod_1.z.preprocess((v) => {
        if (v == null)
            return undefined;
        if (typeof v !== "string")
            return v;
        const t = v.trim();
        return t === "" ? undefined : t;
    }, zod_1.z.string().min(1).optional()),
    /** Required when the API key is not scoped to a project */
    projectId: zod_1.z.string().uuid().optional(),
    /** When set, matches pricing rules scoped to this product */
    productId: zod_1.z.string().uuid().optional(),
});
class MeterraError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "MeterraError";
    }
}
exports.MeterraError = MeterraError;
class Meterra {
    constructor(config) {
        if (!config.apiKey) {
            throw new MeterraError("API key is required");
        }
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || "https://api.meterra.io";
        this.timeout = config.timeout || 30000;
    }
    async recordUsage(event) {
        const parsed = UsageEventSchema.safeParse(event);
        if (!parsed.success) {
            throw new MeterraError(`Invalid usage event: ${parsed.error.message}`, undefined, "VALIDATION_ERROR");
        }
        const payload = {
            ...parsed.data,
            timestamp: parsed.data.timestamp instanceof Date
                ? parsed.data.timestamp.toISOString()
                : parsed.data.timestamp,
        };
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.baseUrl}/api/usage/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": this.apiKey,
                    "X-SDK": "node",
                    "X-SDK-Version": "1.1.0",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({})));
                throw new MeterraError(errorData.error || "Failed to record usage", response.status, "API_ERROR");
            }
            const body = (await response.json());
            return body;
        }
        catch (error) {
            if (error instanceof MeterraError) {
                throw error;
            }
            if (error instanceof Error && error.name === "AbortError") {
                throw new MeterraError("Request timeout", undefined, "TIMEOUT");
            }
            throw new MeterraError(error instanceof Error ? error.message : "Unknown error", undefined, "NETWORK_ERROR");
        }
    }
    async recordBatchUsage(events) {
        const results = [];
        for (const event of events) {
            try {
                const result = await this.recordUsage(event);
                results.push({
                    eventId: result.eventId,
                    estimatedCost: result.estimatedCost,
                    pricingRuleId: result.pricingRuleId,
                });
            }
            catch (error) {
                results.push({
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
        return { success: true, results };
    }
}
exports.Meterra = Meterra;
let instance = null;
function init(options) {
    if (instance) {
        return instance;
    }
    instance = new Meterra(options);
    return instance;
}
function getInstance() {
    if (!instance) {
        throw new MeterraError("Meterra not initialized. Call meterra.init() first.");
    }
    return instance;
}
exports.meterra = {
    init,
    getInstance,
    recordUsage: (event) => getInstance().recordUsage(event),
    recordBatchUsage: (events) => getInstance().recordBatchUsage(events),
};
exports.default = exports.meterra;
//# sourceMappingURL=index.js.map