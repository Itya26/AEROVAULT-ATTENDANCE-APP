# Deploying AEROVAULT Attendance to Railway

This repo is a pnpm workspace with three parts under `artifacts/`:

- **`aerovaultt`** — the React/Vite frontend (employee attendance web app)
- **`api-server`** — the Express API (auth, attendance, leaves, etc.)
- **`mockup-sandbox`** — a design/dev sandbox, not needed in production

For Railway, both the frontend and API are deployed as **one service**. The
API server now serves the built frontend as static files and falls back to
`index.html` for client-side routes, so there's a single origin, no CORS
config, and no separate static hosting to manage.

## What was added/changed for this

- `artifacts/api-server/src/app.ts` — now serves `artifacts/aerovaultt/dist/public`
  as static assets (if present) with an SPA fallback for non-`/api` routes.
- `nixpacks.toml` — pins Node 22 + pnpm 9.15.0 and defines the install/build/start commands.
- `railway.json` — tells Railway to use Nixpacks, sets the start command and
  a `/api/healthz` healthcheck.
- Root `package.json` — added `build:railway`, `start:railway`, `db:push`, `db:seed` scripts.
- `.env.example` — documents the required environment variables.

## Steps

1. **Push this repo to GitHub** (or connect it directly if already on GitHub),
   then in Railway: **New Project → Deploy from GitHub repo**, selecting this repo.

2. **Add a Postgres database** to the project: **New → Database → Add PostgreSQL**.

3. **Set environment variables** on the app service (Variables tab):
   - `DATABASE_URL` — reference the Postgres plugin: `${{Postgres.DATABASE_URL}}`
   - `SESSION_SECRET` — a long random string, e.g. generate with `openssl rand -hex 32`
   - `NODE_ENV` — `production`
   - Do **not** set `PORT` manually — Railway injects it, and the app reads it automatically.

4. **Deploy.** Railway will run (via `nixpacks.toml`):
   - Install: `pnpm install`
   - Build: `pnpm run build:railway` (builds the frontend, then the API server)
   - Start: `pnpm run start:railway`

5. **Initialize the database schema** (one-time, after the first successful deploy).
   Using the [Railway CLI](https://docs.railway.com/guides/cli):
   ```bash
   railway link          # link to this project
   railway run pnpm run db:push
   ```
   This uses `drizzle-kit push` to create the tables from `lib/db/src/schema`.

6. **(Optional) Seed sample data** — creates an admin, HR user, and two
   employees with the password `Aero@123`:
   ```bash
   railway run pnpm run db:seed
   ```

7. Once deployed, Railway will give you a public URL. Visit it — you should
   see the AEROVAULT Attendance login screen, and `/api/healthz` should
   return `{"status":"ok"}`.

## Notes

- Auth uses bearer JWTs (returned in the login response body, not cookies),
  so there are no cross-origin cookie concerns even though everything is
  served from one origin here.
- `mockup-sandbox` is intentionally excluded from the Railway build — it's a
  local design tool, not part of the deployed product.
- If you ever want to split the frontend and API into two separate Railway
  services instead of one, you'd need to: build `aerovaultt` with
  `BASE_PATH` set to the frontend's own path, call `setBaseUrl(...)` from
  `@workspace/api-client-react` in `artifacts/aerovaultt/src/main.tsx` pointing
  at the API service's URL, and remove the static-serving block from `app.ts`.
  The current single-service setup avoids all of that.
