# Birthday Surprise

A romantic birthday surprise web app built with React + Vite (frontend) and Express (API server).

## Project structure

pnpm monorepo with two services:

| Service | Path | Port | Description |
|---|---|---|---|
| Birthday Surprise (frontend) | `artifacts/birthday-surprise/` | 5173 | React + Vite + Tailwind UI |
| API Server | `artifacts/api-server/` | 8080 | Express API, music upload, object storage |

Shared libraries live in `lib/` (api-client-react, api-zod, api-spec, db).

## How to run

Both services start automatically via configured workflows.

- **Frontend**: `PORT=5173 BASE_PATH=/ pnpm --filter @workspace/birthday-surprise run dev`
- **API server**: `PORT=8080 pnpm --filter @workspace/api-server run dev`

Install dependencies: `pnpm install`

## Notes

- The API server's object storage routes require `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR` env vars (Replit Object Storage). These are only needed if the storage/upload features are used.
- The `lib/db` package requires `DATABASE_URL` — it is not imported by the current API routes so the server starts without it.
- Music files are served from `artifacts/birthday-surprise/public/music/` and can be uploaded via `POST /api/upload-music`.

## User preferences

(Add any preferences here as needed.)
