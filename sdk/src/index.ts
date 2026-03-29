import { z } from "zod";

const UsageEventSchema = z.object({
  eventName: z.string().min(1),
  properties: z.record(z.unknown()).optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  timestamp: z.string().datetime().or(z.date()),
  idempotencyKey: z.string().optional(),
  /** Required when the API key is not scoped to a project */
  projectId: z.string().uuid().optional(),
  /** When set, matches pricing rules scoped to this product */
  productId: z.string().uuid().optional(),
});

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

export class MeterraError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "MeterraError";
  }
}

export class Meterra {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: MeterraConfig) {
    if (!config.apiKey) {
      throw new MeterraError("API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.meterra.io";
    this.timeout = config.timeout || 30000;
  }

  async recordUsage(event: UsageEventInput): Promise<RecordUsageResponse> {
    const parsed = UsageEventSchema.safeParse(event);

    if (!parsed.success) {
      throw new MeterraError(
        `Invalid usage event: ${parsed.error.message}`,
        undefined,
        "VALIDATION_ERROR"
      );
    }

    const payload = {
      ...parsed.data,
      timestamp:
        parsed.data.timestamp instanceof Date
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
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new MeterraError(
          errorData.error || "Failed to record usage",
          response.status,
          "API_ERROR"
        );
      }

      const body = (await response.json()) as RecordUsageResponse;
      return body;
    } catch (error) {
      if (error instanceof MeterraError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new MeterraError("Request timeout", undefined, "TIMEOUT");
      }

      throw new MeterraError(
        error instanceof Error ? error.message : "Unknown error",
        undefined,
        "NETWORK_ERROR"
      );
    }
  }

  async recordBatchUsage(events: UsageEventInput[]): Promise<{
    success: boolean;
    results: Array<
      | {
          eventId: string;
          estimatedCost: number;
          pricingRuleId: string | null;
        }
      | { error: string }
    >;
  }> {
    const results: Array<
      | {
          eventId: string;
          estimatedCost: number;
          pricingRuleId: string | null;
        }
      | { error: string }
    > = [];

    for (const event of events) {
      try {
        const result = await this.recordUsage(event);
        results.push({
          eventId: result.eventId,
          estimatedCost: result.estimatedCost,
          pricingRuleId: result.pricingRuleId,
        });
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { success: true, results };
  }
}

export interface InitOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

let instance: Meterra | null = null;

export function init(options: InitOptions): Meterra {
  if (instance) {
    return instance;
  }

  instance = new Meterra(options);
  return instance;
}

export function getInstance(): Meterra {
  if (!instance) {
    throw new MeterraError("Meterra not initialized. Call meterra.init() first.");
  }
  return instance;
}

export const meterra = {
  init,
  getInstance,
  recordUsage: (event: UsageEventInput) => getInstance().recordUsage(event),
  recordBatchUsage: (events: UsageEventInput[]) =>
    getInstance().recordBatchUsage(events),
};

export default meterra;
