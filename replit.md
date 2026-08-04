# Birthday Surprise

A romantic birthday surprise web app built for Anwesha. Features an animated starfield entry gate, daily surprise reveals, music player, scratch-card interactions, a birthday cake, and a cinematic finale sequence.

## Architecture

This is a **pnpm monorepo** with two runnable services and shared libraries:

| Package | Path | Purpose |
|---|---|---|
| `@workspace/birthday-surprise` | `artifacts/birthday-surprise/` | React + Vite frontend |
| `@workspace/api-server` | `artifacts/api-server/` | Express API server |
| `@workspace/db` | `lib/db/` | Drizzle ORM + PostgreSQL schema |
| `@workspace/api-spec` | `lib/api-spec/` | OpenAPI spec + codegen |
| `@workspace/api-zod` | `lib/api-zod/` | Generated Zod schemas |
| `@workspace/api-client-react` | `lib/api-client-react/` | Generated React Query hooks |

Photos of Anwesha live in `attached_assets/`.

## Running the App

Both services start automatically via managed workflows:

- **Frontend** — `artifacts/birthday-surprise: web` → served at `/`
- **API server** — `artifacts/api-server: API Server` → served at `/api`

To run manually:
```bash
# Install dependencies
pnpm install

# Frontend (dev)
pnpm --filter @workspace/birthday-surprise run dev

# API server (dev)
pnpm --filter @workspace/api-server run dev
```

## Environment

| Variable | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Auto-provisioned by Replit | PostgreSQL connection string |
| `SESSION_SECRET` | Replit Secret | Used for session signing |
| `PORT` | Injected by workflow | Required by both services |
| `BASE_PATH` | Injected by workflow | Required by the frontend |

## Database

Uses Replit's built-in PostgreSQL via Drizzle ORM. Schema is defined in `lib/db/src/schema/`. To push schema changes:

```bash
pnpm --filter @workspace/db run push
```

## User Preferences

- Keep the existing project structure and stack — do not restructure or migrate.
