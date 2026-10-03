# E-Commerce — Sprint 2: Catalog Data Foundation

Node.js/Express + PostgreSQL backend implementing the category → product →
variant → SKU data model from `docs/SPRINT_2.md`.

## Prerequisites

- Node.js 18+
- A local PostgreSQL instance (14+ recommended)

## Setup

```bash
npm install
cp .env.example .env
cp .env.example .env.test   # point DATABASE_URL at a separate, disposable test DB
```

Edit `.env` (and `.env.test`) and fill in real values:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string, e.g. `postgres://user:pass@localhost:5432/ecommerce_dev` |
| `JWT_SECRET` | Signing secret for admin auth tokens — use a long random string, not a real word |
| `PORT` | Port the API listens on (default `3000`) |

Never commit `.env` or `.env.test` — both are in `.gitignore`.

## Run migrations

```bash
createdb ecommerce_dev   # if it doesn't exist yet
npm run migrate
```

Migrations are plain numbered `.sql` files in `migrations/`, applied in
order and tracked in a `schema_migrations` table so re-running `npm run
migrate` is a no-op once everything is applied.

## Seed data

```bash
npm run seed
```

Inserts the 4 categories / 3 products / 5 SKUs described in
`docs/SPRINT_2.md` §6, including the one intentionally-absent variant
combination (CAT04).

## Run the API

```bash
npm run dev    # nodemon, auto-restart
# or
npm start
```

## Run tests

```bash
createdb ecommerce_test   # the DB named in .env.test's DATABASE_URL
npm run db:test:reset     # drops + recreates the schema, then re-applies migrations
npm test
```

`db:test:reset` refuses to run unless `NODE_ENV=test` (see
`migrations/reset.js`) so it can't accidentally wipe a dev database.

## Project structure

```
src/
  app.js, server.js        Express app + entrypoint
  db.js                     pg Pool, env-aware (.env vs .env.test)
  middleware/                auth (JWT admin check), error handler
  controllers/, routes/      categories, products, skus
migrations/                 numbered SQL files + migrate.js / reset.js
seeds/seed.js                seed data matching docs/SPRINT_2.md §6
tests/                       Jest + Supertest, one file per CAT0x cluster
docs/SPRINT_2.md             design doc this implementation follows
```

## Known gaps

See `docs/SPRINT_2.md` §8 for the full list (Cart_Items still at
product-level, no asset upload pipeline, no public read API yet, etc.) —
all intentionally out of scope for this sprint.
