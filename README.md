# SOVD Simulation — Explorer & API

## Overview
- Next.js app (App Router) for an interactive SOVD Explorer and simulator APIs.
- JWT-based authentication and role-based authorization with allow/deny rules.
- Prisma ORM with SQLite by default for local development; flexible for other databases.
- Middleware enforces RBAC, normalizes `/sovd/v1/*` and `/v1/*` paths, and rewrites `/sovd/v1/*` to `/v1/*`.

## Quick Start
- Requirements: Node.js 18+, npm.
- Install: `npm install`
- Database setup:
  - Set `DATABASE_URL` in `.env` (SQLite example: `DATABASE_URL="file:./dev.db"`).
  - Migrate: `npx prisma migrate dev`
  - Seed: `npx prisma db seed` (seeds permissions like Admin allow and specific denies)
- Run dev server: `npm run dev` then open `http://localhost:3000` (or `3001`).

## Debugging
- VS Code launch config included:
  - `Next.js Dev (Server Debug)` launches with Node inspector on `9229`.
  - `Attach to Next.js (9229)` to attach to an already running dev server.
- Set breakpoints in `app/api/*/route.ts`, `middleware.ts`, and `lib/*`.

## API Prefix
- Client requests use `'/sovd/v1/*'` and middleware rewrites to `'/v1/*'` for handlers.
- Admin APIs under `'/api/admin/*'` are accessible to Admin role.

## Authentication
- Tokens include `permissions` and `denyPermissions` fields.
- Permissions come from DB `permissions` table; base rules apply only when DB entries are missing.
- Deny-first precedence is enforced in middleware.

## Authorization Model
- Allow rules and deny rules are path+method patterns (supports `*` wildcards).
- Precedence: deny wildcard → deny exact or pattern → allow wildcard → allow exact or pattern → default policy.
- Normalization matches both `'/sovd/v1/*'` and `'/v1/*'`.

## Key Files
- Middleware: `middleware.ts` — permission enforcement and prefix rewrite.
- RBAC utilities: `lib/rbac.ts` — role access from DB and base fallbacks; normalization and merging.
- Permission checks: `lib/permissions-util.ts` — wildcard/prefix-aware matching with deny-first precedence.
- JWT utilities: `lib/enhanced-jwt.ts` — token creation, payload typings including `denyPermissions`.
- Admin Token Tool: `app/admin/token-tool/page.tsx` — manage tokens, visualize permissions.

## Database
- Prisma schema in `prisma/schema.prisma` defines `Permission` with fields `role`, `pathPattern`, `method`, `access`.
- Seed script (`prisma/seed.ts`) populates initial permissions; `access` may be JSON like `{"allowed": true}`.
- RBAC parsing accepts `allow`/`deny` strings as well as JSON `{ allowed: boolean }`.

## Development Scripts
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`

## Folder Structure
- `app/explorer/` — SOVD Explorer UI.
- `app/api/` — API routes (admin, v1).
- `lib/` — business logic, RBAC, JWT utilities.
- `prisma/` — schema and seed.
- `.vscode/launch.json` — VS Code debug config.

## Notes
- Admin role can access `/api/admin/*`; application APIs are checked against DB-configured allow/deny lists.
- Fault operations and operations logging persist `LogEntry` with correct foreign key to `SOVDEntity.id`.
