# HCMC MVP

Portfolio prototype based on the design documents in `docs/`. It uses fictional demo accounts and must not be used with real congregation data without a privacy, security, and church acceptance review.

## Included

- React public site, mobile newcomer registration, public activity list, scripture lookup, and staff dashboard.
- NestJS API with validated requests, JWT login, backend role checks, reception-only newcomer access, duplicate flags, activity management, duty assignment and overlap checks, confirmation, roster copy, audit records, and a retryable Resend email queue.
- Prisma/MySQL schema. Public scripture lookup only searches verses that an administrator has independently licensed and imported into `ScriptureVerse`; no Bible text is bundled.

## Run locally

1. Install Node 20+ and MySQL 8. Create an empty demo database.
2. `npm install`
3. Copy `.env.example` to `apps/api/.env`. Set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and `CRON_SECRET`. For actual email delivery, set `RESEND_API_KEY` and a verified `EMAIL_FROM`.
4. `npm run db:generate --workspace apps/api`
5. `npm run db:migrate --workspace apps/api`
6. Set `DEMO_ADMIN_PASSWORD` to a unique 12+ character local demo password, then `npm run db:seed --workspace apps/api`.
7. In separate terminals run `npm run dev --workspace apps/api` and `npm run dev --workspace apps/web`. Open `http://localhost:5173`.

### Direct MySQL setup

For a fresh local database, run the complete schema and fictional seed file in MySQL Workbench: open `database/hcmc_mvp_mysql.sql`, select all, and execute. From the CLI, the equivalent is:

```powershell
mysql -u root -p < database/hcmc_mvp_mysql.sql
```

Then create `apps/api/.env` from `.env.example` and set the matching connection URL, for example `DATABASE_URL="mysql://root:YOUR_URL_ENCODED_PASSWORD@localhost:3306/hcmc_demo"`. URL-encode characters such as `@`, `#`, `/`, `:` and `%` in the password. The SQL is intended for a fresh `hcmc_demo` schema; use Prisma migrations for an existing database rather than rerunning the table creation statements.

The TypeScript seed uses the password supplied through `DEMO_ADMIN_PASSWORD`. The direct SQL demo login is `admin@example.com` / `HcmcDemo2026!`; change this immediately unless the database is a disposable local demo. Another fictional volunteer is seeded at `volunteer@example.com`. Use only `example.com` addresses for portfolio demonstrations.

## API and current limits

Endpoints follow `docs/api_endpoints_design.md` under `/api/v1`. Additional minimal management endpoints are `POST /rosters/duties`, `POST /rosters/assignments`, `PATCH /activities/:id`, `GET /users/volunteers`, and `GET /ministries`. `POST /tasks/process-emails` requires `x-cron-secret`. Time values are stored as UTC and formatted in `Pacific/Auckland` by the UI.

This prototype does **not** implement vector indexing, semantic retrieval, grounded answer generation, SSE, complete Bible ingestion, email action links, account management, retention jobs, or production deployment. Reminders are queued 48 hours before an activity but require a configured cron trigger and Resend credentials for delivery. `/scripture/ask` responds with 503 until a licensed corpus and a verifiable RAG pipeline are configured. This is deliberate: returning an invented answer or bundling a copyrighted translation would contradict the project's data governance goals.

For production work, add migration-reviewed schema changes, persistent rate limiting, email idempotency/locking across workers, CSRF and abuse protection, a privacy request flow, stronger ministry-scoped authorization, and end-to-end tests. Confirm church address, service time, sender domain, Bible translation rights, and access roles with stakeholders before replacing placeholder public copy.
