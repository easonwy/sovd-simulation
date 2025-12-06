# SOVD Simulation Platform - Phase 3 Development Plan

> **Date:** December 6, 2025  
> **Based on:** Current codebase review + README requirements  
> **Target:** Complete Phase 3 implementation with persistent database, advanced visualization, and admin UI

---

## 📊 Current State Analysis

### Phase 1-2 Completion Status

#### ✅ Backend (Simulator API)
- **Authentication:** JWT token generation (`POST /v1/authorize`, `POST /v1/token`)
- **Discovery Endpoints:** Entity listing and capabilities
- **Data Operations:** Read/write single data points (`/data/{id}`)
- **Faults Management:** List, read, confirm, clear faults
- **Locks:** Create and release resource locks
- **Logs:** RFC3339 timestamp entries
- **Operations:** Basic operation definitions
- **Modes:** Entity mode support
- **Software Updates:** Update package tracking

#### ✅ Frontend (Explorer UI)
- **Tree Navigation:** Collection-based entity browsing
- **Request Console:** Path, method, headers, body editing
- **Response Display:** JSON rendering and header inspection
- **Token Management:** Local storage-based auth token

#### ✅ Authorization
- **RBAC Middleware:** Role-based access control in middleware.ts
- **Three Roles:** Viewer (read-only), Developer (read/write), Admin (full)
- **Path-based Rules:** Simple pattern matching for permissions

#### ❌ Persistence Layer
- **Current:** In-memory Map objects in `lib/state.ts`
- **Issue:** Data lost on server restart
- **New (Phase 3):** Prisma + SQLite/MySQL integration

---

## 🎯 Phase 3 Objectives

### Primary Goals
1. **Persistent Storage:** Migrate from in-memory to database-backed storage
2. **Advanced Visualization:** Time-series data charts, structured fault tables
3. **Admin UI:** Role & permission management interface
4. **Production Ready:** MySQL migration path, backup strategy

### Scope Mapping

| Category | Current | Target | Effort |
|----------|---------|--------|--------|
| Database | In-memory | Prisma + SQLite/MySQL | 🔴 High |
| Data Viz | JSON only | Charts + Tables | 🟡 Medium |
| Admin UI | None | Full CRUD | 🔴 High |
| RBAC | Basic | Fine-grained path patterns | 🟡 Medium |
| API Endpoints | 80% spec | 100% spec compliant | 🟡 Medium |
| Testing | Basic smoke tests | Integration + E2E | 🟡 Medium |
| Docs | Architecture | Implementation guides | 🟢 Low |

---

## 📋 Detailed Implementation Plan

### Phase 3.1: Database Migration (Weeks 1-2)

#### 3.1.1 Database Abstraction Layer

**Goal:** Encapsulate data access logic  
**Priority:** 🔴 Critical

**Create new files in `lib/`:**

```typescript
// lib/entities.ts - Entity CRUD operations
export async function getEntityByIdAndCollection(id: string, collection: string)
export async function listEntitiesByCollection(collection: string)
export async function createEntity(data: EntityInput)
export async function updateEntity(id: string, data: EntityInput)
export async function deleteEntity(id: string)

// lib/data.ts - Data value operations
export async function readDataValue(entityId: string, dataId: string)
export async function writeDataValue(entityId: string, dataId: string, value: unknown)
export async function listDataValues(entityId: string, filters?: DataFilters)
export async function createDataList(entityId: string, dataIds: string[])

// lib/faults.ts - Fault management
export async function listFaults(entityId: string, filters?: FaultFilters)
export async function readFault(entityId: string, code: string)
export async function createFault(entityId: string, code: string, severity?: string)
export async function confirmFault(entityId: string, code: string)
export async function clearFault(entityId: string, code: string)
export async function clearAllFaults(entityId: string)

// lib/operations.ts - Operation management
export async function listOperations(entityId: string)
export async function readOperation(entityId: string, operationId: string)
export async function executeOperation(entityId: string, operationId: string, params?: unknown)
export async function getExecutionStatus(executionId: string)

// lib/permissions.ts - RBAC operations
export async function checkPermission(role: string, method: string, pathPattern: string)
export async function listPermissions(role?: string)
export async function createPermission(role: string, pathPattern: string, method: string, canRead: boolean, canWrite: boolean, canDelete: boolean)
export async function updatePermission(id: string, permissions: Partial<Permission>)
export async function deletePermission(id: string)
```

**Tasks:**
- [ ] Create 5 new abstraction files
- [ ] Implement all CRUD operations using Prisma
- [ ] Add error handling and validation
- [ ] Write unit tests for each module

**Estimated:** 3-4 days

---

#### 3.1.2 Migrate Route Handlers

**Goal:** Update all existing endpoints to use database layer  
**Priority:** 🔴 Critical

**Migration order (dependency-based):**

1. **Discovery Endpoints** (easiest)
   - `GET /v1/{entity-collection}`
   - `GET /v1/{entity-collection}/{entity-id}`
   - Update: `app/v1/[entity-collection]/route.ts`
   - Update: `app/v1/[entity-collection]/[entity-id]/route.ts`

2. **Data Endpoints** (medium)
   - `GET/POST /v1/{entity-collection}/{entity-id}/data/{data-id}`
   - `GET /v1/{entity-collection}/{entity-id}/data`
   - `GET /v1/{entity-collection}/{entity-id}/data-lists`
   - `POST /v1/{entity-collection}/{entity-id}/data-lists`
   - `GET /v1/{entity-collection}/{entity-id}/data-lists/{list-id}`
   - Update: 5+ route files

3. **Fault Endpoints** (medium)
   - `GET/DELETE /v1/{entity-collection}/{entity-id}/faults`
   - `GET/POST/DELETE /v1/{entity-collection}/{entity-id}/faults/{fault-code}`
   - Update: 2 route files

4. **Complex Endpoints** (hardest)
   - Operations with execution tracking
   - Locks with atomic operations
   - Update packages with status tracking

**Migration Template:**
```typescript
// Before (in-memory)
import { listFaults } from '@/lib/state'

export async function GET(req: NextRequest) {
  const resp = listFaults(collection, entityId)
  return NextResponse.json(resp)
}

// After (database)
import { listFaults } from '@/lib/faults'

export async function GET(req: NextRequest) {
  try {
    const resp = await listFaults(entityId, filters)
    return NextResponse.json(resp)
  } catch (error) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
}
```

**Tasks:**
- [ ] Migrate Discovery endpoints (2 files)
- [ ] Migrate Data endpoints (5 files)
- [ ] Migrate Fault endpoints (2 files)
- [ ] Migrate Operation endpoints (3 files)
- [ ] Migrate Lock endpoints (2 files)
- [ ] Add transaction support for complex operations
- [ ] Test each endpoint group

**Estimated:** 5-6 days

---

#### 3.1.3 Database Schema Enhancement

**Goal:** Optimize schema for Phase 3 features  
**Priority:** 🟡 Medium

**Current schema:** 12 models in `prisma/schema.prisma`

**Enhancements needed:**

```typescript
// Add indexes for performance
model SOVDEntity {
  // Add composite indexes
  @@index([collection, entityId])
  @@index([collection, createdAt])
}

model DataValue {
  // Add timestamp index for time-series queries
  @@index([entityId, updatedAt])
  @@index([category])
}

model Fault {
  // Add status index for filtering
  @@index([entityId, status])
  @@index([severity])
  @@index([createdAt])
}

model LogEntry {
  // Add composite index for time-range queries
  @@index([entityId, timestamp])
  @@index([severity])
}

model OperationExecution {
  // Add status tracking index
  @@index([operationId, status])
  @@index([createdAt])
}
```

**Add new tables for Phase 3 features:**

```typescript
// Time-series data snapshots (for visualization)
model DataSnapshot {
  id         String   @id @default(cuid())
  dataId     String   // Reference to DataValue
  value      String   // JSON-serialized value
  timestamp  DateTime
  createdAt  DateTime @default(now())

  @@index([dataId, timestamp])
}

// Audit trail for data changes
model AuditLog {
  id        String   @id @default(cuid())
  entityId  String
  action    String   // 'READ', 'WRITE', 'DELETE', etc.
  path      String   // Full resource path
  role      String   // User role
  result    String   // 'success' | 'denied'
  timestamp DateTime @default(now())

  @@index([entityId, timestamp])
  @@index([role, result])
}
```

**Tasks:**
- [ ] Add performance indexes
- [ ] Create DataSnapshot model for time-series
- [ ] Create AuditLog model for audit trail
- [ ] Run migration: `npm run db:migrate:dev`
- [ ] Test query performance

**Estimated:** 1-2 days

---

### Phase 3.2: Advanced Visualization (Weeks 2-3)

#### 3.2.1 Time-Series Data Charts

**Goal:** Visualize data trends over time  
**Priority:** 🟡 Medium

**Components to create:**

```typescript
// app/explorer/_components/DataChart.tsx
// Chart data points over time with Chart.js or Recharts
// Features:
// - Interactive line chart
// - Zoom and pan
// - Data point inspection
// - Export to CSV

interface DataChartProps {
  entityId: string
  dataId: string
  timeRange?: { start: Date; end: Date }
}

export function DataChart(props: DataChartProps) {
  // Fetch historical data from /data-history API
  // Group by time buckets (1m, 5m, 1h, 1d)
  // Render using Recharts LineChart
}
```

**New API endpoint:**

```typescript
// GET /v1/{entity-collection}/{entity-id}/data/{data-id}/history
// Query params:
// - timeRange: '1h|6h|24h|7d|30d'
// - bucketSize: 'minute|hour|day'
// Returns: Array of { timestamp, value, min, max, avg }
```

**Tasks:**
- [ ] Install charting library (Recharts recommended)
- [ ] Create DataChart component
- [ ] Implement `/history` endpoint
- [ ] Create data aggregation queries
- [ ] Add time-range selector UI
- [ ] Test with sample data

**Estimated:** 3-4 days

---

#### 3.2.2 Structured Fault/Event Tables

**Goal:** Display faults and logs in searchable, filterable tables  
**Priority:** 🟡 Medium

**Components:**

```typescript
// app/explorer/_components/FaultsTable.tsx
// Features:
// - Sortable columns
// - Filter by status, severity
// - Search by fault code
// - Bulk actions (clear, confirm)
// - Pagination

// app/explorer/_components/LogsTable.tsx
// Features:
// - RFC3339 timestamp display
// - Severity badges
// - Context inspection
// - Real-time updates (polling)
// - Export logs
```

**UI Library:** Use existing components or add:
- Table library (TanStack Table)
- Badge components for status
- Filter UI

**Tasks:**
- [ ] Install table library
- [ ] Create FaultsTable component
- [ ] Create LogsTable component
- [ ] Implement filtering/searching
- [ ] Add bulk operations
- [ ] Add real-time updates (polling)

**Estimated:** 2-3 days

---

#### 3.2.3 Schema/Data Split Display

**Goal:** Highlight schema vs. data when `include-schema=true`  
**Priority:** 🟢 Low

**Implementation:**

```tsx
// Update RequestConsole to parse and display schema separately
interface ResponseWithSchema {
  schema?: JSONSchema7
  data: unknown
}

export function ResponseDisplay(resp: ResponseWithSchema) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div>
        <h4>Schema</h4>
        <code>{JSON.stringify(resp.schema, null, 2)}</code>
      </div>
      <div>
        <h4>Data</h4>
        <code>{JSON.stringify(resp.data, null, 2)}</code>
      </div>
    </div>
  )
}
```

**Tasks:**
- [ ] Update RequestConsole component
- [ ] Add schema detection logic
- [ ] Highlight schema vs data
- [ ] Add schema validation UI

**Estimated:** 1 day

---

### Phase 3.3: Admin UI for RBAC (Weeks 3-4)

#### 3.3.1 Permission Management UI

**Goal:** Admin interface to configure role-based access  
**Priority:** 🔴 High

**New route:** `/admin/permissions`

**Features:**

```typescript
// Page: /admin/permissions
// Components:

// 1. RoleList - List all roles (Viewer, Developer, Admin)
// 2. PermissionEditor - Edit permissions for selected role
// 3. PathPatternBuilder - Visual pattern editor
// 4. PermissionPreview - Show affected endpoints

interface PermissionRow {
  pathPattern: string      // '/v1/App/*/data/*'
  method: 'GET' | 'POST' | 'DELETE'
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
}

// UI Layout:
// [Role Selector] -> [Permission Table] -> [Add/Edit Dialog]
```

**API Endpoints:**

```typescript
// GET /admin/permissions?role=Developer
// POST /admin/permissions (create)
// PUT /admin/permissions/{id} (update)
// DELETE /admin/permissions/{id}
// GET /admin/permissions/preview?role=Developer&path=/v1/App/*/data/*
```

**Tasks:**
- [ ] Create `/admin` layout
- [ ] Create RoleList component
- [ ] Create PermissionTable component
- [ ] Create PathPatternBuilder component
- [ ] Implement admin API endpoints
- [ ] Add permission validation
- [ ] Add audit logging for permission changes

**Estimated:** 4-5 days

---

#### 3.3.2 User & Audit Management

**Goal:** Manage users and audit trail  
**Priority:** 🟡 Medium

**New routes:**
- `/admin/users` - User listing, role assignment
- `/admin/audit` - Audit log viewer

**Features:**

```typescript
// /admin/users
// - List users with roles
// - Change user roles
// - Disable/enable users
// - View last activity

// /admin/audit
// - Search audit logs
// - Filter by user/action/time
// - Export audit trail
// - Real-time updates
```

**Tasks:**
- [ ] Create UserManagement component
- [ ] Create AuditViewer component
- [ ] Create audit logging middleware
- [ ] Implement user API endpoints
- [ ] Add export functionality

**Estimated:** 3-4 days

---

#### 3.3.3 Simulator Control Console

**Goal:** Configure simulator behavior  
**Priority:** 🟡 Medium

**New route:** `/admin/simulator`

**Features:**

```typescript
// Simulator Configuration:
// 1. Entity Management - Add/edit/delete entities
// 2. Fault Injection - Create test faults
// 3. Data Seeding - Reset to initial state
// 4. Performance Settings - Response delays, data generation

// UI Components:
// - EntityEditor - Create/edit entities
// - FaultInjector - Define fault scenarios
// - DataSeeder - Reset/populate sample data
// - Settings - Latency, batch sizes, etc.
```

**Tasks:**
- [ ] Create SimulatorControl page
- [ ] Create EntityEditor component
- [ ] Create FaultInjector component
- [ ] Implement configuration API
- [ ] Add preset scenarios

**Estimated:** 2-3 days

---

### Phase 3.4: Testing & Documentation (Week 4)

#### 3.4.1 Integration Tests

**Goal:** Test database layer with real data  
**Priority:** 🔴 High

```typescript
// tests/integration/entities.test.ts
describe('Entity Operations', () => {
  test('should list entities by collection')
  test('should read entity with capabilities')
  test('should create custom entity')
})

// tests/integration/faults.test.ts
describe('Fault Management', () => {
  test('should list faults with status filter')
  test('should create fault')
  test('should confirm fault')
  test('should clear fault')
})

// tests/integration/rbac.test.ts
describe('RBAC Permissions', () => {
  test('Viewer can only GET')
  test('Developer can GET/POST/DELETE faults')
  test('Admin can do anything')
})
```

**Setup:**
```bash
# Use test database
DATABASE_URL="file:./prisma/test.db" jest

# Seed test data
npm run db:seed --env test
```

**Tasks:**
- [ ] Set up Jest configuration
- [ ] Create test database fixtures
- [ ] Write entity tests
- [ ] Write data operation tests
- [ ] Write fault management tests
- [ ] Write RBAC tests
- [ ] Achieve 80%+ coverage

**Estimated:** 3-4 days

---

#### 3.4.2 E2E Tests

**Goal:** Full flow testing from UI to database  
**Priority:** 🟡 Medium

```typescript
// tests/e2e/user-flow.spec.ts
test('User can authenticate and browse entities', async () => {
  // Login
  // Select entity collection
  // View entity details
  // Read data
  // Execute operation
})

test('Admin can manage permissions', async () => {
  // Navigate to /admin/permissions
  // Select role
  // Edit permission
  // Verify changes apply
})
```

**Setup:** Playwright or Cypress

**Tasks:**
- [ ] Set up E2E testing framework
- [ ] Create login flow test
- [ ] Create data browsing test
- [ ] Create permission test
- [ ] Create fault injection test

**Estimated:** 2-3 days

---

#### 3.4.3 Performance Testing

**Goal:** Ensure database queries are efficient  
**Priority:** 🟡 Medium

**Benchmarks:**
- Discovery endpoints: < 100ms
- Data read: < 50ms
- Fault listing (1000 faults): < 100ms
- Permission checks: < 5ms

**Tools:** Artillery, k6, or custom benchmarks

**Tasks:**
- [ ] Set up performance testing
- [ ] Create load test scenarios
- [ ] Profile slow queries
- [ ] Add missing indexes
- [ ] Verify benchmarks met

**Estimated:** 2 days

---

### Phase 3.5: Production Deployment (Ongoing)

#### 3.5.1 MySQL Migration

**Goal:** Enable production database deployment  
**Priority:** 🔴 Critical

**Steps:**

```bash
# 1. Update .env for production
DATABASE_URL="mysql://user:password@prod-host:3306/sovd_production"

# 2. Run migrations
npx prisma migrate deploy

# 3. Seed production data
npm run db:seed -- --production

# 4. Verify
npm run test:api -- --env production
```

**Tasks:**
- [ ] Create production environment config
- [ ] Document MySQL setup
- [ ] Create backup strategy
- [ ] Create migration rollback plan
- [ ] Test failover

**Estimated:** 2-3 days

---

#### 3.5.2 Monitoring & Alerting

**Goal:** Production observability  
**Priority:** 🟡 Medium

**Implement:**
- Response time monitoring
- Error rate tracking
- Database performance metrics
- Audit log analysis
- Alert thresholds

**Tools:** Datadog, New Relic, or self-hosted

**Tasks:**
- [ ] Add monitoring library
- [ ] Create dashboards
- [ ] Set up alerts
- [ ] Create runbooks for common issues

**Estimated:** 2-3 days

---

## 📈 Implementation Timeline

```
Week 1-2:  Database Migration (Abstraction + Route Updates)
├─ Day 1-2: Create abstraction layer
├─ Day 3-4: Migrate discovery endpoints
├─ Day 5-6: Migrate data endpoints
└─ Day 7-9: Migrate faults & operations

Week 2-3:  Visualization
├─ Day 1-2: Time-series charts
├─ Day 3-4: Fault/Log tables
└─ Day 5: Schema/data display

Week 3-4:  Admin UI
├─ Day 1-2: Permission management
├─ Day 3: User/audit management
├─ Day 4-5: Simulator console
└─ Day 6-7: Integration

Week 4-5:  Testing & Optimization
├─ Day 1-2: Integration tests
├─ Day 3: E2E tests
├─ Day 4: Performance tuning
└─ Day 5: Bug fixes

Week 5+:   Production Deployment
├─ Day 1-2: MySQL migration
├─ Day 3-4: Monitoring setup
└─ Ongoing: Support & maintenance
```

---

## 🎯 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **API Response Time (p95)** | < 100ms | Unknown |
| **Database Queries Indexed** | 100% | 0% |
| **Test Coverage** | 80%+ | ~20% |
| **SOVD Spec Compliance** | 100% | ~95% |
| **Permission Rules** | 50+ patterns | 5 hardcoded |
| **Data Retention** | Persistent | In-memory |
| **Uptime SLA** | 99.9% | N/A |
| **Documentation** | Complete | Partial |

---

## 🔧 Tech Stack & Dependencies

### Current
- Next.js 14
- React 18
- TypeScript 5.5
- Jose (JWT)
- Prisma 5.8 (added)

### To Add
- **Charting:** Recharts or Chart.js
- **Tables:** TanStack Table (React Table)
- **Testing:** Jest + Playwright
- **Monitoring:** Datadog or self-hosted
- **UI Components:** Shadcn/ui or custom

### Install Commands
```bash
npm install recharts
npm install @tanstack/react-table
npm install -D jest @testing-library/react playwright
npm install zustand # For state management (optional)
```

---

## 📝 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Database migration breaks existing data | 🔴 High | Keep in-memory as fallback, migrate gradually |
| Performance regression | 🔴 High | Profile early, add indexes, benchmark |
| Complexity of admin UI | 🟡 Medium | Break into smaller components, reuse patterns |
| Testing delays | 🟡 Medium | Start tests early, use fixtures |
| Production MySQL issues | 🔴 High | Test on staging, create rollback plan |

---

## ✅ Completion Checklist

### Code Changes
- [ ] Database abstraction layer (5 files)
- [ ] Route handler migrations (12+ files)
- [ ] Schema enhancements (indexes, new models)
- [ ] Chart components (2+ components)
- [ ] Table components (2+ components)
- [ ] Admin pages (3 pages)
- [ ] API endpoints (10+ routes)

### Testing
- [ ] Unit tests for abstractions
- [ ] Integration tests (CRUD operations)
- [ ] E2E tests (user flows)
- [ ] Performance tests (benchmarks)
- [ ] RBAC tests (permissions)

### Documentation
- [ ] Updated README.md
- [ ] Database migration guide
- [ ] Admin UI user guide
- [ ] API documentation updates
- [ ] Deployment guide

### DevOps
- [ ] GitHub Actions CI/CD
- [ ] Staging environment
- [ ] Production environment
- [ ] Database backup strategy
- [ ] Monitoring dashboards

---

## 🎉 Deliverables

### By End of Phase 3
1. ✅ Persistent database (SQLite dev, MySQL prod)
2. ✅ Database abstraction layer
3. ✅ All endpoints migrated to database
4. ✅ Time-series visualization
5. ✅ Fault/event tables
6. ✅ Admin permission management UI
7. ✅ Audit trail system
8. ✅ Comprehensive tests
9. ✅ Production deployment guide
10. ✅ Monitoring & alerting

### Production Ready
- [x] Code quality (lint, type-check)
- [x] Performance optimized (indexed queries)
- [x] Secure (RBAC, audit logs)
- [x] Tested (80%+ coverage)
- [x] Documented (guides + API docs)
- [x] Monitored (dashboards + alerts)
- [x] Scalable (database connection pooling)

---

## 📞 Questions & Decisions Needed

1. **Charting Library:** Recharts (simple) vs. Chart.js (powerful)?
2. **Table Library:** TanStack Table (headless) vs. Material Table (batteries included)?
3. **Testing Framework:** Jest + React Testing Library vs. Vitest?
4. **Monitoring:** Self-hosted (Prometheus) vs. SaaS (Datadog)?
5. **API Rate Limiting:** Implement in Phase 3?
6. **WebSocket Support:** For real-time updates or polling only?
7. **Database Replication:** For HA or single instance?
8. **Data Retention Policy:** How long to keep historical data?

---

**Next Steps:**
1. Review and approve this plan
2. Prioritize components (critical path)
3. Assign team members
4. Start database abstraction layer
5. Set up CI/CD pipeline
6. Begin Phase 3.1 implementation

