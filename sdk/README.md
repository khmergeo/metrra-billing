# Meterra SDK

Node.js SDK for usage tracking with Meterra billing platform.

## Installation

```bash
npm install @metrra/sdk
```

## Quick Start

```typescript
import { metrra } from '@metrra/sdk';

// Initialize with your API key
metrra.init({
  apiKey: 'mtr_your_api_key_here',
  baseUrl: 'https://api.metrra.io', // Optional, defaults to production
});

// Record a usage event
await metrra.recordUsage({
  eventName: 'api_call',
  quantity: 1,
  unit: 'request',
  timestamp: new Date(),
});

// With properties
await metrra.recordUsage({
  eventName: 'video_processed',
  quantity: 120,
  unit: 'seconds',
  timestamp: new Date(),
  properties: {
    resolution: '1080p',
    codec: 'h264',
  },
});
```

## API

### `metrra.init(options)`

Initialize the Meterra SDK.

- `options.apiKey` (required): Your API key from the dashboard
- `options.baseUrl` (optional): API base URL
- `options.timeout` (optional): Request timeout in ms (default: 30000)

### `metrra.recordUsage(event)`

Record a single usage event.

```typescript
await metrra.recordUsage({
  eventName: 'function_execution',
  quantity: 1,
  unit: 'call',
  timestamp: new Date(),
  idempotencyKey: 'unique-key-123', // Optional, prevents duplicate events
  properties: {
    region: 'us-east-1',
    tier: 'premium',
  },
});
```

### `metrra.recordBatchUsage(events)`

Record multiple usage events.

```typescript
const results = await metrra.recordBatchUsage([
  { eventName: 'email_sent', quantity: 1, unit: 'email', timestamp: new Date() },
  { eventName: 'sms_sent', quantity: 1, unit: 'sms', timestamp: new Date() },
]);
```

## Usage Examples

### Serverless Functions (AWS Lambda)

```typescript
import { metrra } from '@metrra/sdk';

metrra.init({ apiKey: process.env.METRRA_API_KEY! });

export const handler = async (event: APIGatewayEvent) => {
  // Process request
  await metrra.recordUsage({
    eventName: 'api_request',
    quantity: 1,
    unit: 'request',
    timestamp: new Date(),
    properties: {
      endpoint: event.path,
      method: event.httpMethod,
    },
  });

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
```

### Express.js Middleware

```typescript
import express from 'express';
import { metrra } from '@metrra/sdk';

metrra.init({ apiKey: process.env.METRRA_API_KEY! });

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    metrra.recordUsage({
      eventName: 'http_request',
      quantity: 1,
      unit: 'request',
      timestamp: new Date(),
      properties: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: Date.now() - start,
      },
    });
  });
  
  next();
});
```

### Cron Jobs

```typescript
import { metrra } from '@metrra/sdk';

metrra.init({ apiKey: process.env.METRRA_API_KEY! });

// Record compute time
await metrra.recordUsage({
  eventName: 'background_job',
  quantity: 5.5,
  unit: 'minutes',
  timestamp: new Date(),
  properties: {
    jobName: 'data_sync',
    recordsProcessed: 10000,
  },
});
```

## Error Handling

```typescript
import { metrra, MeterraError } from '@metrra/sdk';

metrra.init({ apiKey: process.env.METRRA_API_KEY! });

try {
  await metrra.recordUsage({
    eventName: 'test',
    quantity: 1,
    unit: 'unit',
    timestamp: new Date(),
  });
} catch (error) {
  if (error instanceof MeterraError) {
    console.error(`Meterra Error: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
    console.error(`Code: ${error.code}`);
  }
}
```

## License

MIT
