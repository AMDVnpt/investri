# InvestRI

Rhode Island alternative-investment marketplace POC. All offering terms, tax-credit rates, and project data are **illustrative** and configurable. No real-money investing.

## Apps

- `apps/mobile` — Expo citizen app (iOS / Android / web)
- `apps/admin` — Next.js Commerce Console
- `apps/manager` — Next.js fund-manager shell
- `apps/api` — NestJS `/api/v1`

## Local setup

Requires Node 20+, pnpm 9, and Docker (for Postgres).

```bash
cp .env.example .env
cp .env.example apps/api/.env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- API: http://localhost:3001/api/v1
- OpenAPI: http://localhost:3001/api/docs
- Admin: http://localhost:3003
- Manager: http://localhost:3002
- Mobile: `pnpm --filter @investri/mobile start` (Expo)

## Demo accounts

Password for all seeded users: `DemoPass123!`

| Email | Role |
| --- | --- |
| alex.smith@demo.investri.ri | Citizen investor |
| reviewer@commerce.ri.gov | Commerce reviewer + tax admin |
| admin@investri.local | System admin |
| manager@demo.investri.ri | Fund manager |

## Demo

See [DEMO.md](DEMO.md) for the five-minute procurement walkthrough. Run `pnpm demo:reset` (same as `pnpm db:reset`) before a live presentation.

## Product rules

Never treat a target return as guaranteed. Never mix tax credits into investment performance. Never present the proposed tax credit as enacted law. Never say a user “received” a credit before Commerce certification.
