# ASAM SOVD Explorer & Simulator — Tasks & Progress

## Status Legend
- [ ] Planned
- [>] In progress
- [x] Done
- [!] Blocked

## Milestones
- Phase 1 — Simulator + Auth ready (spec-aligned `/v1`)
- Phase 2 — Explorer core + Proxy/RBAC
- Phase 3 — Full SOVD coverage + Admin UI + persistence

## Project Setup
- [x] Initialize Next.js app with App Router
- [x] Configure API routes under `app/api/v1` (Node runtime)
- [x] Add `middleware.ts` for JWT decode and RBAC enforcement
- [ ] Add OpenAPI type generation from `docs/api-specs/sovd-api.yaml`
- [x] Add OpenAPI type generation from `docs/api-specs/sovd-api.yaml`
- [ ] Add path rewrites (optional) from `/api/sim/*` → `/v1/*`

## Spec Alignment
- [x] Use server base `/v1` from spec
- [x] Support `EntityCollection` enum: `Area|Component|App|Function`
- [x] Honor `include-schema` query in responses
- [x] Remove/clarify non-spec params (e.g., `status[timestamp]`)
- [x] Use `{data-list-id}` naming consistently
 - [x] Add `/api/sim/*` → `/v1/*` rewrite for dev

## Simulator API (Next.js Route Handlers)
### Authentication
- [x] `POST /v1/authorize` — issue auth code/token (local mock)
- [x] `POST /v1/token` — exchange to JWT with role claim

### Discovery
- [x] `GET /v1/{entity-collection}` — discovered entities
- [x] `GET /v1/{entity-collection}/{entity-id}` — capabilities
- [x] `GET /v1/areas/{area-id}/subareas`
- [x] `GET /v1/components/{component-id}/subcomponents`
- [x] `GET /v1/areas/{area-id}/related-components`
- [x] `GET /v1/components/{component-id}/related-apps`

### Data
- [x] `GET /v1/{entity-collection}/{entity-id}/data` (with optional schema)
- [x] `GET /v1/{entity-collection}/{entity-id}/data/{data-id}` — read single
- [x] `POST /v1/{entity-collection}/{entity-id}/data/{data-id}` — write
- [x] `GET /v1/{entity-collection}/{entity-id}/data-lists`
- [x] `POST /v1/{entity-collection}/{entity-id}/data-lists` — create list (Location header)
- [x] `GET /v1/{entity-collection}/{entity-id}/data-lists/{data-list-id}`

### Faults
- [x] `GET /v1/{entity-collection}/{entity-id}/faults`
- [x] `GET/POST/DELETE /v1/{entity-collection}/{entity-id}/faults/{fault-code}`

### Operations
- [x] `GET /v1/{entity-collection}/{entity-id}/operations`
- [x] `GET/POST /v1/{entity-collection}/{entity-id}/operations/{operation-id}`
- [x] `POST/GET /v1/{entity-collection}/{entity-id}/operations/{operation-id}/executions`
- [x] `GET /v1/{entity-collection}/{entity-id}/operations/{operation-id}/executions/{execution-id}`

### Modes
- [x] `GET /v1/{entity-collection}/{entity-id}/modes`
- [x] `GET /v1/{entity-collection}/{entity-id}/modes/{mode-id}`

### Logs
- [x] `GET /v1/{entity-collection}/{entity-id}/logs/entries` (RFC3339 timestamps)
- [x] `GET /v1/{entity-collection}/{entity-id}/logs/config`

### Locks
- [x] `POST/GET /v1/{entity-collection}/{entity-id}/locks`
- [x] `DELETE/GET /v1/{entity-collection}/{entity-id}/locks/{lock-id}`

### Software Updates
- [x] `GET /v1/{entity-collection}/{entity-id}/updates`
- [x] `GET/DELETE /v1/{entity-collection}/{entity-id}/updates/{update-package-id}`
- [x] `GET /v1/{entity-collection}/{entity-id}/updates/{update-package-id}/status`
- [x] `PUT /v1/{entity-collection}/{entity-id}/updates/{update-package-id}/prepare`
- [x] `PUT /v1/{entity-collection}/{entity-id}/updates/{update-package-id}/execute`
- [x] `PUT /v1/{entity-collection}/{entity-id}/updates/{update-package-id}/automated`
- [x] `POST /v1/updates` — register update

## RBAC (Middleware)
- [x] Parse JWT, extract role claim (`Viewer|Developer|Admin`)
- [x] Map `(path pattern, method) → permission`
- [x] Deny-by-default, return `403` with spec-like error body

## Simulator State
- [x] In-memory fixtures for entities and values (Phase 1)
- [x] Abstract storage layer for data, faults, logs
- [x] Add Prisma + SQLite (Phase 3), optional MySQL migration

## Explorer UI
- [x] SOVD tree driven by discovery endpoints
- [x] Request console (dynamic methods, `include-schema` parameter)
- [x] Response analyzers (tables, schema/data split)
- [x] Role-based UI gating and action visibility

## Testing & Quality
- [x] Unit tests for route handlers and RBAC
- [x] Type-check and lint scripts (CI-ready)
- [x] E2E flows for discovery, data read/write

## Next Actions
- [x] Scaffold Next.js app and base `app/api/v1` folders
- [x] Implement discovery `GET` endpoints
- [x] Implement data `GET/POST` with `include-schema`
- [x] Add `middleware.ts` RBAC and seed fixtures
- [x] Generate types from OpenAPI and wire into handlers
