# Meterra - Usage-Based Billing Platform

A comprehensive usage-based billing system built with Next.js 14, Prisma, and PostgreSQL.

## Architecture

```
meterra-billing/
├── prisma/
│   └── schema.prisma       # Database schema
├── sdk/
│   └── src/index.ts        # Node.js SDK for usage tracking
├── scripts/
│   └── create-admin.ts     # Admin account creation script
├── src/
│   ├── app/
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/     # Client dashboard pages
│   │   ├── admin/          # Admin portal (public)
│   │   ├── (admin)/        # Admin portal (protected)
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Landing page
│   ├── lib/
│   │   ├── auth/            # JWT, password, API key utilities
│   │   ├── db/              # Prisma client
│   │   └── utils/           # Common utilities
│   ├── services/           # Business logic
│   └── types/              # TypeScript types
└── package.json
```

## Features

### Epic MTR-E1: Core Platform & Auth
- Multi-tenant architecture
- JWT authentication
- API key management with hashing
- Project management
- Database migrations

### Epic MTR-E2: Usage Wallet Ledger
- Usage event ingestion with idempotency
- Wallet system with balance tracking
- Double-entry ledger accounting
- Transaction history

### Epic MTR-E3: Rating Billing Invoicing
- Flexible pricing plans (flat, per-unit, tiered, volume)
- Rating engine for cost calculation
- Invoice generation with PDF export
- Line item support

### Epic MTR-E4: Portal MultiTenant Security
- Dashboard with usage analytics
- RBAC roles (Owner, Admin, Member, Viewer)
- Audit logging
- Tenant isolation middleware

## Portals

### Client Portal
Manage your own tenant's billing, projects, and usage.

**URL:** `http://localhost:3000`

### Admin Portal
Platform-wide administration and management.

**URL:** `http://localhost:3000/admin/login`

**Features:**
- Dashboard - Platform overview with stats
- Tenants - Manage all platform tenants
- Users - Manage all platform users
- Wallets & Ledger - View all wallets and ledger entries
- System Usage - Usage analytics and trends
- Plans & Rating - Manage pricing plans and rules
- Invoices - View all platform invoices
- Audit Logs - Activity tracking
- Security & RBAC - Role permissions management

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or pnpm

### Installation

1. Clone and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and secrets
```

3. Initialize the database:
```bash
npm run db:push
npm run db:generate
```

4. Create admin account:
```bash
npm run db:create-admin
```

5. Start the development server:
```bash
npm run dev
```

### Default Admin Credentials

After running `npm run db:create-admin`:

- **Email:** `admin@meterra.io`
- **Password:** `admin123`
- **Portal:** `http://localhost:3000/admin/login`

### Database Schema

The system uses PostgreSQL with the following main tables:

- `Tenant` - Multi-tenant organizations
- `User` - User accounts with roles
- `ApiKey` - API keys for SDK authentication
- `Project` - Usage tracking projects
- `Wallet` - Tenant wallet balance
- `WalletTransaction` - Transaction history
- `UsageEvent` - Recorded usage events
- `LedgerAccount` - Chart of accounts
- `LedgerEntry` - Double-entry records
- `PricingPlan` - Pricing configurations
- `PricingRule` - Individual pricing rules
- `Invoice` - Generated invoices
- `AuditLog` - Security audit trail

## API Routes

### Client Authentication
- `POST /api/auth/login` - User login
- `DELETE /api/auth/login` - User logout
- `GET /api/auth/session` - Get current session

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/session` - Get admin session

### Tenant Management
- `POST /api/tenants` - Create tenant
- `GET /api/tenants` - List tenants (admin)

### Admin Management
- `GET /api/admin/tenants` - List all tenants
- `PATCH /api/admin/tenants/[id]` - Update tenant
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/[id]` - Update user
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/wallets` - All wallets & ledger
- `GET /api/admin/usage` - System usage analytics
- `GET /api/admin/plans` - All pricing plans
- `GET /api/admin/invoices` - All invoices
- `GET /api/admin/audit` - Audit logs
- `GET /api/admin/security` - RBAC & security

### Projects & API Keys
- `GET/POST /api/projects` - List/create projects
- `GET/POST /api/api-keys` - List/create API keys

### Usage Tracking
- `POST /api/usage/events` - Record usage event (SDK endpoint)

### Wallet
- `GET /api/wallets` - Get wallet balance
- `POST /api/wallets` - Credit/debit wallet

### Ledger
- `GET /api/ledgers` - Get trial balance
- `POST /api/ledgers` - Create ledger entry

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice

### Pricing
- `GET /api/pricing` - List pricing plans
- `POST /api/pricing` - Create pricing plan

### Audit
- `GET /api/audit` - Get audit logs

## SDK Integration

Install the SDK:
```bash
npm install @meterra/sdk
```

Initialize and use:
```typescript
import { meterra } from '@meterra/sdk';

meterra.init({
  apiKey: process.env.METERRA_API_KEY!,
});

await meterra.recordUsage({
  eventName: 'api_call',
  quantity: 1,
  unit: 'request',
  timestamp: new Date(),
});
```

## Pricing Types

The system supports multiple pricing models:

1. **Flat** - Fixed price per period
2. **Per Unit** - Price multiplied by quantity
3. **Tiered** - Graduated pricing based on usage brackets
4. **Volume** - Single price applied based on total volume

## Double-Entry Ledger

Every financial transaction creates balanced debit/credit entries:

| Account Type | Debit | Credit |
|--------------|-------|--------|
| Asset | Increase | Decrease |
| Liability | Decrease | Increase |
| Equity | Decrease | Increase |
| Revenue | Decrease | Increase |
| Expense | Increase | Decrease |

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:create-admin  # Create admin account
npm run test         # Run tests
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for JWT signing |
| `API_KEY_PREFIX` | Prefix for API keys (default: mtr) |

## License

MIT
