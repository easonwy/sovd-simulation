# SOVD Simulation - Phase 3 Implementation Kickoff Guide

> **Status:** 🟢 Ready to Execute  
> **Date:** December 6, 2025  
> **Phase 1-2:** 95% Complete (all API endpoints working)  
> **Phase 3:** Starting Now

---

## 📋 Executive Summary

The SOVD Simulation platform is 95% feature-complete with all SOVD v1.0 API endpoints implemented. Phase 3 focuses on three critical areas:

1. **Data Persistence** (Week 1-2) - Migrate from in-memory to database
2. **Advanced UI** (Week 2-3) - Add charts, tables, and visualization
3. **Admin Control** (Week 3-4) - Permission management and simulator console

This document provides the actionable implementation plan to execute Phase 3 over 4-5 weeks.

---

## 🎯 Phase 3 Objectives & Success Criteria

### Primary Goals
```
✅ Goal 1: Persistent Storage
   - All data in SQLite (dev) / MySQL (prod)
   - Zero data loss on restart
   - Transactions for complex operations
   - Target: 100% of endpoints using database

✅ Goal 2: Visualization & UX
   - Time-series data charts (Recharts)
   - Searchable fault/log tables (TanStack Table)
   - Schema/data separation
   - Target: All data viewable in structured formats

✅ Goal 3: Admin Features
   - Permission management UI
   - User & audit trail
   - Simulator control console
   - Target: Full CRUD via admin interface

✅ Goal 4: Production Ready
   - MySQL migration tested
   - 80%+ test coverage
   - Response time < 100ms (p95)
   - Audit logging for all changes
```

### Success Metrics
| Metric | Target | How to Verify |
|--------|--------|---------------|
| Endpoints using database | 100% | All route handlers query db, not state.ts |
| Test coverage | 80%+ | `jest --coverage` |
| Response time p95 | < 100ms | Performance benchmark script |
| Data persistence | Forever | Data survives server restart |
| RBAC compliance | 100% | Permission tests pass |
| Admin UI functional | ✅ | All CRUD operations work |

---

## 📁 Current Codebase State

### What's Working ✅

**Backend (95% Complete):**
```
app/v1/
├── authorize/route.ts          ✅ JWT token generation
├── token/route.ts              ✅ Token exchange
├── [entity-collection]/
│   ├── route.ts                ✅ List entities
│   ├── [entity-id]/
│   │   ├── route.ts            ✅ Get entity capabilities
│   │   ├── data/               ✅ Data read/write
│   │   ├── data-lists/         ✅ Batch data lists
│   │   ├── faults/             ✅ Fault management
│   │   ├── faults/{id}/        ✅ Single fault ops
│   │   ├── operations/         ✅ Operation listing
│   │   ├── locks/              ✅ Lock management
│   │   ├── logs/               ✅ Log entries
│   │   ├── modes/              ✅ Mode support
│   │   └── updates/            ✅ Update tracking
│   └── areas/, components/     ✅ Discovery
└── updates/                    ✅ Update registration
```

**Frontend (Partial):**
```
app/explorer/
├── page.tsx                    ✅ Main explorer
├── _components/
│   ├── Tree.tsx               ✅ Entity browser
│   ├── RequestConsole.tsx     ✅ Request builder
│   └── TokenBar.tsx           ✅ Auth management
└── request/page.tsx           ✅ Request history
```

**Security:**
```
middleware.ts                   ✅ JWT auth + RBAC
lib/auth.ts                    ✅ JWT generation/verification
lib/rbac.ts                    ✅ Role-based permission checks
```

### What's Missing ❌

**Data Persistence:**
```
lib/state.ts                   ❌ In-memory only
                                  (will be replaced by database layer)
```

**Visualization:**
```
Charts, tables, structured displays  ❌ Not implemented
```

**Admin Features:**
```
Permission management UI        ❌ Not implemented
User management UI              ❌ Not implemented
Audit trail                      ❌ Not implemented
Simulator control console        ❌ Not implemented
```

---

## 🚀 Phase 3 Execution Plan

### Phase 3.1: Database Migration (Weeks 1-2)

#### Step 1.1: Create Database Abstraction Layer

**Objective:** Encapsulate all data access logic in clean, testable functions

**New Files to Create (5 files, ~800 LOC):**

```typescript
// lib/entities.ts - Entity operations
export async function getEntity(collection: string, id: string)
export async function listEntities(collection: string)
export async function createEntity(collection: string, data: EntityData)
export async function updateEntity(collection: string, id: string, data: Partial<EntityData>)
export async function deleteEntity(collection: string, id: string)

// lib/data.ts - Data value operations
export async function readDataValue(entityId: string, dataId: string)
export async function writeDataValue(entityId: string, dataId: string, value: unknown)
export async function listDataValues(entityId: string, filters?: DataFilters)
export async function createDataList(entityId: string, dataIds: string[])
export async function getDataList(entityId: string, listId: string)

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
export async function trackExecution(executionId: string)
export async function getExecutionStatus(executionId: string)

// lib/permissions.ts - RBAC operations
export async function checkPermission(role: string, method: string, path: string)
export async function listPermissions(role?: string)
export async function createPermission(role: string, pathPattern: string, method: string, access: Access)
export async function updatePermission(id: string, access: Partial<Access>)
export async function deletePermission(id: string)
```

**Implementation Template:**
```typescript
// Example: lib/entities.ts
import { prisma } from './prisma'

export async function getEntity(collection: string, id: string) {
  try {
    const entity = await prisma.sOVDEntity.findUnique({
      where: { entityId_collection: { entityId: id, collection } },
      include: { dataValues: true, faults: true }
    })
    return entity
  } catch (error) {
    console.error('Failed to get entity:', error)
    throw new Error('Entity lookup failed')
  }
}
```

**Tasks (Est. 2-3 days):**
- [ ] Create lib/entities.ts (150 LOC)
- [ ] Create lib/data.ts (160 LOC)
- [ ] Create lib/faults.ts (140 LOC)
- [ ] Create lib/operations.ts (150 LOC)
- [ ] Create lib/permissions.ts (120 LOC)
- [ ] Add error handling to each
- [ ] Write unit tests for each module
- [ ] Integration tests with test database

**Verification:**
```bash
# All functions should have tests
npm test -- lib/

# Coverage should be > 80%
npm test -- --coverage lib/
```

---

#### Step 1.2: Migrate All Route Handlers

**Objective:** Update all 20+ route files to use new database abstraction layer

**Migration Priority (dependency order):**

**Tier 1 - Discovery (Simplest, 2 files):**
```typescript
// app/v1/[entity-collection]/route.ts
// Before: import { listEntities } from '@/lib/state'
// After:  import { listEntities } from '@/lib/entities'

export async function GET(req: NextRequest, { params }) {
  const items = await listEntities(params['entity-collection'])
  return NextResponse.json({ items })
}

// app/v1/[entity-collection]/[entity-id]/route.ts
// Similar pattern: import from lib/entities instead of lib/state
```

**Tier 2 - Data Endpoints (Medium, 5 files):**
```typescript
// app/v1/.../data/route.ts
// app/v1/.../data/[data-id]/route.ts
// app/v1/.../data-lists/route.ts
// app/v1/.../data-lists/[data-list-id]/route.ts
// Similar migration pattern

export async function GET(req: NextRequest) {
  const data = await readDataValue(...)  // from lib/data
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await writeDataValue(...)  // from lib/data
  return NextResponse.json(result)
}
```

**Tier 3 - Faults (Medium, 2 files):**
```typescript
// app/v1/.../faults/route.ts
// app/v1/.../faults/[fault-code]/route.ts

export async function GET(req: NextRequest) {
  const faults = await listFaults(...)  // from lib/faults
  return NextResponse.json({ items: faults })
}

export async function DELETE(req: NextRequest) {
  await clearFault(...)  // from lib/faults
  return NextResponse.json({ ok: true })
}
```

**Tier 4 - Complex Operations (Hard, 3 files):**
```typescript
// app/v1/.../operations/route.ts
// app/v1/.../operations/[operation-id]/route.ts
// app/v1/.../operations/[operation-id]/executions/route.ts

export async function POST(req: NextRequest) {
  const execution = await executeOperation(...)  // from lib/operations
  return NextResponse.json(execution, { status: 202 })
}
```

**Tasks (Est. 3-4 days):**
- [ ] Migrate Tier 1 - Discovery (2 files)
- [ ] Test Tier 1 endpoints
- [ ] Migrate Tier 2 - Data (5 files)
- [ ] Test Tier 2 endpoints
- [ ] Migrate Tier 3 - Faults (2 files)
- [ ] Test Tier 3 endpoints
- [ ] Migrate Tier 4 - Operations (3 files)
- [ ] Test all endpoints end-to-end
- [ ] Verify no breaking API changes

**Verification:**
```bash
# Run API smoke tests
npm run test:api

# Test each endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/v1/App/WindowControl/data

# Verify data persists
npm run dev
# Make requests
# Restart server (Ctrl+C)
npm run dev
# Data should still be there!
```

---

#### Step 1.3: Database Schema Optimization

**Objective:** Add performance indexes and new tables for Phase 3 features

**Current Schema:** 12 models in `prisma/schema.prisma`

**Add Performance Indexes:**
```typescript
// In prisma/schema.prisma

model SOVDEntity {
  // ... existing fields ...
  @@index([collection])
  @@index([collection, createdAt])
}

model DataValue {
  // ... existing fields ...
  @@index([category])
  @@index([dataId])
  @@index([entityId, dataId])  // Composite for lookups
}

model Fault {
  // ... existing fields ...
  @@index([status])
  @@index([entityId, status])  // For filtered queries
  @@index([createdAt])         // For time-range queries
}

model LogEntry {
  // ... existing fields ...
  @@index([severity])
  @@index([entityId, timestamp])  // For time-series
}
```

**Add New Tables:**
```typescript
// For time-series visualization
model DataSnapshot {
  id         String   @id @default(cuid())
  dataId     String
  entityId   String
  timestamp  DateTime @default(now())
  value      String   // JSON
  
  @@index([dataId, timestamp])
  @@map("data_snapshots")
}

// For audit logging
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // 'CREATE', 'UPDATE', 'DELETE'
  resource  String   // Path or entity type
  result    String   // 'success' or 'error'
  details   String?  // JSON metadata
  timestamp DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([resource, timestamp])
  @@map("audit_logs")
}
```

**Tasks (Est. 1-2 days):**
- [ ] Add indexes to existing models
- [ ] Create DataSnapshot model
- [ ] Create AuditLog model
- [ ] Create migration: `npm run db:migrate:dev -- add_indexes`
- [ ] Test performance with indexes
- [ ] Verify query plans improved

**Verification:**
```bash
# Apply migration
npm run db:push

# Check schema
npm run db:studio

# Verify indexes
sqlite> .schema
```

---

### Phase 3.2: Advanced Visualization (Weeks 2-3)

#### Step 2.1: Time-Series Data Charts

**Objective:** Visualize data trends over time with interactive charts

**Component to Create:** `app/explorer/_components/DataChart.tsx`

```typescript
// lib/data.ts - Add history function
export async function getDataHistory(
  entityId: string,
  dataId: string,
  options?: {
    timeRange?: '1h' | '6h' | '24h' | '7d' | '30d'
    bucketSize?: 'minute' | 'hour' | 'day'
  }
) {
  // Query DataSnapshot table with time aggregation
  // Return: { timestamp, value, min, max, avg }[]
}

// app/explorer/_components/DataChart.tsx
import { Recharts } from 'recharts'

export function DataChart({ entityId, dataId }) {
  const [timeRange, setTimeRange] = useState('24h')
  const [data, setData] = useState([])
  
  useEffect(() => {
    // Fetch history from API
    fetch(`/v1/.../data/${dataId}/history?timeRange=${timeRange}`)
      .then(r => r.json())
      .then(setData)
  }, [timeRange])
  
  return (
    <div>
      <select value={timeRange} onChange={e => setTimeRange(e.target.value)}>
        <option value="1h">Last 1 Hour</option>
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
      </select>
      
      <LineChart data={data} width={800} height={400}>
        <CartesianGrid />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </div>
  )
}
```

**New API Endpoint:**
```typescript
// app/v1/[entity-collection]/[entity-id]/data/[data-id]/history/route.ts

export async function GET(req: NextRequest, { params }) {
  const { searchParams } = new URL(req.url)
  const timeRange = searchParams.get('timeRange') || '24h'
  
  const history = await getDataHistory(
    params['entity-id'],
    params['data-id'],
    { timeRange }
  )
  
  return NextResponse.json({ items: history })
}
```

**Tasks (Est. 2-3 days):**
- [ ] Install Recharts: `npm install recharts`
- [ ] Create DataChart component
- [ ] Implement getDataHistory() function
- [ ] Create /history API endpoint
- [ ] Add time-range selector UI
- [ ] Test with sample data
- [ ] Add to explorer UI

**Verification:**
```bash
# Start dev server
npm run dev

# Open http://localhost:3000/explorer
# Navigate to a data point
# Should see chart with historical data
```

---

#### Step 2.2: Structured Tables for Faults & Logs

**Objective:** Display faults and logs in searchable, sortable tables

**Components to Create:**
- `app/explorer/_components/FaultsTable.tsx`
- `app/explorer/_components/LogsTable.tsx`

```typescript
// app/explorer/_components/FaultsTable.tsx
import { Table } from '@tanstack/react-table'

interface FaultsTableProps {
  entityId: string
  faults: Fault[]
}

export function FaultsTable({ entityId, faults }: FaultsTableProps) {
  const [sorting, setSorting] = useState([])
  const [filters, setFilters] = useState<FaultFilters>({})
  
  const columns = [
    { accessorKey: 'code', header: 'Fault Code' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'severity', header: 'Severity' },
    { accessorKey: 'createdAt', header: 'Created' },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <>
          <button onClick={() => confirmFault(row.original.code)}>Confirm</button>
          <button onClick={() => clearFault(row.original.code)}>Clear</button>
        </>
      )
    }
  ]
  
  const table = useReactTable({ data: faults, columns, state: { sorting }, onSortingChange: setSorting })
  
  return (
    <div>
      <input
        placeholder="Filter by status..."
        onChange={e => setFilters({ ...filters, status: e.target.value })}
      />
      <table>
        {/* Standard table rendering */}
      </table>
    </div>
  )
}
```

**Tasks (Est. 2-3 days):**
- [ ] Install TanStack Table: `npm install @tanstack/react-table`
- [ ] Create FaultsTable component
- [ ] Create LogsTable component
- [ ] Add sorting/filtering
- [ ] Add bulk operations
- [ ] Add pagination
- [ ] Integrate into explorer UI
- [ ] Test with sample data

**Verification:**
```bash
# Should see structured table instead of JSON
# Should be able to sort columns
# Should be able to filter by status
```

---

#### Step 2.3: Schema/Data Display Separation

**Objective:** When `include-schema=true`, show schema and data separately

**Update RequestConsole:**
```typescript
// app/explorer/_components/RequestConsole.tsx

interface ResponseWithSchema {
  schema?: JSONSchema7
  data: unknown
}

export function ResponseDisplay({ response }: { response: ResponseWithSchema }) {
  const [view, setView] = useState<'data' | 'schema' | 'both'>('data')
  
  return (
    <div>
      <select value={view} onChange={e => setView(e.target.value as any)}>
        <option value="data">Data Only</option>
        <option value="schema">Schema Only</option>
        <option value="both">Both</option>
      </select>
      
      {(view === 'data' || view === 'both') && (
        <div style={{ flex: 1 }}>
          <h3>Data</h3>
          <JsonDisplay value={response.data} />
        </div>
      )}
      
      {(view === 'schema' || view === 'both') && response.schema && (
        <div style={{ flex: 1 }}>
          <h3>Schema</h3>
          <JsonDisplay value={response.schema} highlight="schema" />
        </div>
      )}
    </div>
  )
}
```

**Tasks (Est. 1 day):**
- [ ] Update RequestConsole component
- [ ] Add view selector
- [ ] Add schema detection
- [ ] Test with include-schema=true requests

---

### Phase 3.3: Admin UI Development (Weeks 3-4)

#### Step 3.1: Permission Management UI

**Objective:** Allow admins to configure role-based access rules

**New Route:** `/admin/permissions`

```typescript
// app/admin/permissions/page.tsx

export default function PermissionsPage() {
  const [role, setRole] = useState<'Viewer' | 'Developer' | 'Admin'>('Developer')
  const [permissions, setPermissions] = useState<Permission[]>([])
  
  useEffect(() => {
    // Fetch permissions for selected role
    fetch(`/admin/api/permissions?role=${role}`)
      .then(r => r.json())
      .then(setPermissions)
  }, [role])
  
  return (
    <div>
      <h1>Manage Permissions</h1>
      
      <select value={role} onChange={e => setRole(e.target.value as any)}>
        <option value="Viewer">Viewer</option>
        <option value="Developer">Developer</option>
        <option value="Admin">Admin</option>
      </select>
      
      <PermissionMatrix role={role} permissions={permissions} onUpdate={updatePermissions} />
      
      <AddPermissionDialog role={role} onAdd={addPermission} />
    </div>
  )
}

// app/admin/api/permissions/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  
  const permissions = await listPermissions(role)
  return NextResponse.json({ items: permissions })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const permission = await createPermission(body)
  return NextResponse.json(permission, { status: 201 })
}
```

**Permission Matrix Component:**
```typescript
// app/admin/_components/PermissionMatrix.tsx

interface PermissionMatrixProps {
  role: string
  permissions: Permission[]
  onUpdate: (id: string, access: Access) => Promise<void>
}

export function PermissionMatrix({ role, permissions, onUpdate }: PermissionMatrixProps) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE']
  
  return (
    <table>
      <thead>
        <tr>
          <th>Path Pattern</th>
          {methods.map(m => <th key={m}>{m}</th>)}
        </tr>
      </thead>
      <tbody>
        {permissions.map(perm => (
          <tr key={perm.id}>
            <td>{perm.pathPattern}</td>
            {methods.map(method => (
              <td key={method}>
                <checkbox
                  checked={perm.method === method}
                  onChange={e => updatePermission(perm.id, { method })}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

**Tasks (Est. 3-4 days):**
- [ ] Create `/admin` layout
- [ ] Create `/admin/permissions` page
- [ ] Create PermissionMatrix component
- [ ] Create PathPatternBuilder component
- [ ] Implement admin API endpoints (GET, POST, PUT, DELETE)
- [ ] Add validation for patterns
- [ ] Add audit logging for permission changes
- [ ] Test with multiple roles

**Verification:**
```bash
# Open http://localhost:3000/admin/permissions
# Should see role selector
# Should see permission matrix
# Should be able to add/edit/delete permissions
```

---

#### Step 3.2: User & Audit Management

**Objective:** Manage users and view audit trail

**New Routes:**
- `/admin/users` - User listing and role assignment
- `/admin/audit` - Audit log viewer

```typescript
// app/admin/users/page.tsx
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  
  useEffect(() => {
    fetch('/admin/api/users')
      .then(r => r.json())
      .then(data => setUsers(data.items))
  }, [])
  
  return (
    <div>
      <h1>User Management</h1>
      <UserTable users={users} onRoleChange={updateUserRole} />
    </div>
  )
}

// app/admin/audit/page.tsx
export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState({})
  
  useEffect(() => {
    const query = new URLSearchParams(filters)
    fetch(`/admin/api/audit?${query}`)
      .then(r => r.json())
      .then(data => setLogs(data.items))
  }, [filters])
  
  return (
    <div>
      <h1>Audit Trail</h1>
      <AuditFilters onFilter={setFilters} />
      <AuditTable logs={logs} />
    </div>
  )
}
```

**Tasks (Est. 2-3 days):**
- [ ] Create `/admin/users` page
- [ ] Create `/admin/audit` page
- [ ] Create UserTable component
- [ ] Create AuditTable component
- [ ] Implement user API endpoints
- [ ] Implement audit API endpoints
- [ ] Add real-time updates (optional)
- [ ] Test filtering and export

---

#### Step 3.3: Simulator Control Console

**Objective:** Configure simulator behavior and test scenarios

**New Route:** `/admin/simulator`

```typescript
// app/admin/simulator/page.tsx
export default function SimulatorPage() {
  return (
    <div>
      <h1>Simulator Control</h1>
      
      <EntityEditor />
      <FaultInjector />
      <DataSeeder />
      <PerformanceSettings />
    </div>
  )
}

// Subcomponents
function EntityEditor() {
  // Create/edit/delete test entities
}

function FaultInjector() {
  // Define fault scenarios
}

function DataSeeder() {
  // Reset to initial state
  // Populate with random data
}

function PerformanceSettings() {
  // Response delays
  // Batch sizes
  // Data generation rates
}
```

**Tasks (Est. 2-3 days):**
- [ ] Create `/admin/simulator` page
- [ ] Create EntityEditor component
- [ ] Create FaultInjector component
- [ ] Create DataSeeder component
- [ ] Create PerformanceSettings component
- [ ] Implement simulator API endpoints
- [ ] Add preset scenarios

---

### Phase 3.4: Testing & Validation (Week 4)

#### Step 4.1: Integration Tests

**Objective:** Test database layer with real data

```bash
# Create test structure
mkdir -p tests/integration tests/e2e

# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
```

**Sample Tests:**
```typescript
// tests/integration/entities.test.ts
describe('Entity Operations', () => {
  beforeEach(async () => {
    await prisma.$reset() // Clear test DB
    await seed() // Populate test data
  })
  
  test('should list entities by collection', async () => {
    const entities = await listEntities('App')
    expect(entities).toHaveLength(1)
    expect(entities[0].id).toBe('WindowControl')
  })
  
  test('should create custom entity', async () => {
    const entity = await createEntity('App', {
      id: 'TestApp',
      name: 'Test Application'
    })
    expect(entity.id).toBe('TestApp')
  })
})

// tests/integration/faults.test.ts
describe('Fault Management', () => {
  test('should list faults with status filter', async () => {
    const faults = await listFaults('WindowControl', { status: 'active' })
    expect(faults).toHaveLength(1)
  })
  
  test('should confirm fault', async () => {
    await confirmFault('WindowControl', 'DTC-001')
    const fault = await readFault('WindowControl', 'DTC-001')
    expect(fault.status).toBe('confirmed')
  })
})

// tests/integration/rbac.test.ts
describe('RBAC Enforcement', () => {
  test('Viewer can only GET', async () => {
    const allowed = await checkPermission('Viewer', 'GET', '/v1/App/*/data')
    expect(allowed).toBe(true)
    
    const denied = await checkPermission('Viewer', 'POST', '/v1/App/*/data')
    expect(denied).toBe(false)
  })
})
```

**Tasks (Est. 2-3 days):**
- [ ] Set up Jest configuration
- [ ] Create test database fixtures
- [ ] Write entity tests (10+ tests)
- [ ] Write data operation tests (10+ tests)
- [ ] Write fault management tests (10+ tests)
- [ ] Write RBAC tests (10+ tests)
- [ ] Achieve 80%+ coverage

**Verification:**
```bash
# Run tests
npm test

# Check coverage
npm test -- --coverage

# Should see 80%+ lines covered
```

---

#### Step 4.2: E2E Testing

**Objective:** Test full user flows from UI to database

```bash
npm install -D playwright
npx playwright install
```

**Sample Tests:**
```typescript
// tests/e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test'

test('User can authenticate and browse entities', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000')
  await page.fill('input[placeholder="Token"]', 'valid-token')
  await page.click('button:has-text("Login")')
  
  // Browse entities
  await page.click('button:has-text("App")')
  await expect(page).toContainText('WindowControl')
  
  // Execute operation
  await page.click('text=WindowControl')
  await page.fill('input[placeholder="Path"]', '/v1/App/WindowControl/faults')
  await page.click('button:has-text("Send")')
  
  // Verify response
  await expect(page).toContainText('DTC-001')
})

test('Admin can manage permissions', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:3000/admin/permissions')
  
  // Select role
  await page.selectOption('select', 'Developer')
  
  // Edit permission
  await page.click('button:has-text("Edit")')
  await page.check('input[name="canPost"]')
  await page.click('button:has-text("Save")')
  
  // Verify change
  await expect(page).toContainText('Permission updated')
})
```

**Tasks (Est. 2-3 days):**
- [ ] Set up Playwright
- [ ] Create login flow test
- [ ] Create entity browsing test
- [ ] Create data operations test
- [ ] Create permission management test
- [ ] Create admin UI test
- [ ] Run full test suite

**Verification:**
```bash
# Run E2E tests
npm run test:e2e

# All tests should pass
```

---

#### Step 4.3: Performance Testing

**Objective:** Ensure endpoints meet performance targets

**Benchmarks:**
- Discovery: < 100ms
- Data read: < 50ms
- Fault listing (1000+): < 100ms
- Permission check: < 5ms

```typescript
// tests/performance/benchmarks.ts
import { performance } from 'perf_hooks'

async function benchmarkEndpoint(method: string, path: string, token: string) {
  const start = performance.now()
  
  const response = await fetch(`http://localhost:3000${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  })
  
  const end = performance.now()
  const duration = end - start
  
  console.log(`${method} ${path}: ${duration.toFixed(2)}ms`)
  
  if (duration > 100) {
    console.warn(`⚠️  Slow endpoint detected: ${duration}ms > 100ms`)
  }
  
  return { duration, status: response.status }
}

// Run benchmarks
async function main() {
  const token = await getAuthToken()
  
  await benchmarkEndpoint('GET', '/v1/App', token)
  await benchmarkEndpoint('GET', '/v1/App/WindowControl', token)
  await benchmarkEndpoint('GET', '/v1/App/WindowControl/data', token)
  // ... more endpoints
}
```

**Tasks (Est. 1-2 days):**
- [ ] Create benchmark script
- [ ] Profile slow queries
- [ ] Add missing database indexes
- [ ] Verify all targets met
- [ ] Document performance baseline

**Verification:**
```bash
# Run benchmarks
npm run test:perf

# Should see all endpoints under target times
```

---

### Phase 3.5: Production Deployment (Weeks 4-5)

#### Step 5.1: MySQL Migration

**Objective:** Enable production database deployment

```bash
# 1. Update .env for production
DATABASE_URL="mysql://user:password@prod-host:3306/sovd_production"

# 2. Run migrations
npx prisma migrate deploy

# 3. Verify schema
npx prisma db push

# 4. Seed production data (if needed)
npm run db:seed -- --production

# 5. Test connectivity
npm run test:api -- --env production
```

**Tasks:**
- [ ] Document MySQL setup
- [ ] Create production environment config
- [ ] Test MySQL connectivity
- [ ] Verify all migrations apply
- [ ] Create backup strategy

---

#### Step 5.2: Monitoring & Alerting

**Objective:** Production observability

**Implement:**
- Response time tracking
- Error rate monitoring
- Database performance metrics
- Audit log analysis
- Alert thresholds

**Tools Options:**
- Datadog (commercial)
- New Relic (commercial)
- Self-hosted: Prometheus + Grafana

**Minimum viable setup:**
```typescript
// middleware.ts - Add timing
export async function middleware(req: NextRequest) {
  const start = Date.now()
  
  const response = await NextResponse.next()
  
  const duration = Date.now() - start
  console.log(`${req.method} ${req.nextUrl.pathname}: ${duration}ms`)
  
  // Send to monitoring service
  if (duration > 100) {
    await logSlowRequest({
      method: req.method,
      path: req.nextUrl.pathname,
      duration
    })
  }
  
  return response
}
```

**Tasks:**
- [ ] Add performance middleware
- [ ] Create dashboards
- [ ] Set up alerts
- [ ] Create runbooks

---

## 📊 Work Breakdown & Timeline

### Week 1: Database Foundation
```
Day 1-2: Abstraction Layer
  ✅ Create 5 lib files (entities, data, faults, operations, permissions)
  ✅ Unit tests for each

Day 3-4: Migrate Discovery & Data
  ✅ Update 7 route files
  ✅ Integration tests

Day 5-6: Migrate Faults & Operations
  ✅ Update 5 route files
  ✅ End-to-end testing

Day 7: Schema Optimization
  ✅ Add indexes
  ✅ Create new tables
  ✅ Run migration
```

### Week 2: Visualization
```
Day 1-2: Charts
  ✅ Create DataChart component
  ✅ Implement /history API
  ✅ Time-range selector

Day 3-4: Tables
  ✅ Create FaultsTable component
  ✅ Create LogsTable component
  ✅ Add filtering/sorting

Day 5: Schema Display
  ✅ Update RequestConsole
  ✅ Separate schema and data
```

### Week 3: Admin UI
```
Day 1-2: Permissions Management
  ✅ Create /admin/permissions page
  ✅ Permission matrix UI
  ✅ API endpoints

Day 3: User & Audit
  ✅ Create /admin/users page
  ✅ Create /admin/audit page
  ✅ API endpoints

Day 4-5: Simulator Console
  ✅ Create /admin/simulator page
  ✅ Entity/Fault/Data editors
  ✅ Control API
```

### Week 4: Testing
```
Day 1-2: Integration Tests
  ✅ Entity tests
  ✅ Data tests
  ✅ Fault tests
  ✅ 80%+ coverage

Day 3: E2E Tests
  ✅ Create Playwright tests
  ✅ Full flow testing

Day 4-5: Performance & Optimization
  ✅ Benchmark endpoints
  ✅ Fix slow queries
  ✅ Verify targets met
```

### Week 5: Production (Ongoing)
```
Day 1-2: MySQL Migration
  ✅ Test production setup
  ✅ Create backup plan

Day 3-4: Monitoring
  ✅ Set up dashboards
  ✅ Create alerts
  ✅ Document runbooks

Day 5+: Deployment & Support
  ✅ Production deployment
  ✅ Issue triage
  ✅ Performance tuning
```

---

## 📁 File Structure After Phase 3

```
app/
├── v1/                          (API endpoints - migrated to DB)
│   ├── authorize/
│   ├── token/
│   ├── [entity-collection]/
│   │   ├── route.ts            (✅ Migrated to lib/entities)
│   │   └── [entity-id]/
│   │       ├── data/           (✅ Migrated to lib/data)
│   │       ├── data-lists/     (✅ Migrated to lib/data)
│   │       ├── faults/         (✅ Migrated to lib/faults)
│   │       ├── operations/     (✅ Migrated to lib/operations)
│   │       └── ...
│   └── updates/
│
├── explorer/
│   ├── page.tsx
│   ├── _components/
│   │   ├── Tree.tsx
│   │   ├── RequestConsole.tsx   (✅ Updated for charts/tables)
│   │   ├── TokenBar.tsx
│   │   ├── DataChart.tsx        (🆕 New component)
│   │   ├── FaultsTable.tsx      (🆕 New component)
│   │   └── LogsTable.tsx        (🆕 New component)
│   └── request/
│
└── admin/                       (🆕 New section)
    ├── page.tsx                 (Dashboard)
    ├── permissions/
    │   ├── page.tsx             (Permission management UI)
    │   └── _components/
    │       ├── PermissionMatrix.tsx
    │       └── PathPatternBuilder.tsx
    ├── users/
    │   ├── page.tsx             (User management UI)
    │   └── _components/
    │       └── UserTable.tsx
    ├── audit/
    │   ├── page.tsx             (Audit trail viewer)
    │   └── _components/
    │       ├── AuditTable.tsx
    │       └── AuditFilters.tsx
    ├── simulator/
    │   ├── page.tsx             (Simulator control)
    │   └── _components/
    │       ├── EntityEditor.tsx
    │       ├── FaultInjector.tsx
    │       └── DataSeeder.tsx
    └── api/                     (🆕 Admin APIs)
        ├── permissions/
        ├── users/
        ├── audit/
        └── simulator/

lib/
├── prisma.ts                    (✅ Existing)
├── auth.ts                      (✅ Existing)
├── rbac.ts                      (✅ Existing)
├── entities.ts                  (🆕 New DB layer)
├── data.ts                      (🆕 New DB layer)
├── faults.ts                    (🆕 New DB layer)
├── operations.ts                (🆕 New DB layer)
└── permissions.ts               (🆕 New DB layer)

prisma/
├── schema.prisma                (✅ Updated with indexes & new tables)
├── seed.ts                      (✅ Existing)
└── migrations/                  (🆕 Migration files)

tests/
├── integration/                 (🆕 Integration tests)
│   ├── entities.test.ts
│   ├── data.test.ts
│   ├── faults.test.ts
│   ├── operations.test.ts
│   └── rbac.test.ts
├── e2e/                         (🆕 E2E tests)
│   ├── user-flow.spec.ts
│   └── admin-flow.spec.ts
└── performance/                 (🆕 Performance tests)
    └── benchmarks.ts
```

---

## ✅ Success Checklist

### Phase 3.1 - Database Migration
- [ ] All 5 abstraction layer files created (entities, data, faults, operations, permissions)
- [ ] All 20+ route handlers migrated to use database layer
- [ ] Database indexes added for performance
- [ ] DataSnapshot & AuditLog tables created
- [ ] Integration tests passing (80%+ coverage)
- [ ] All API endpoints respond < 100ms

### Phase 3.2 - Visualization
- [ ] DataChart component rendering time-series data
- [ ] FaultsTable component with sorting/filtering
- [ ] LogsTable component with time-range display
- [ ] Schema/data display separation working
- [ ] Charts visible in explorer UI

### Phase 3.3 - Admin UI
- [ ] /admin/permissions page complete
- [ ] /admin/users page complete
- [ ] /admin/audit page complete
- [ ] /admin/simulator page complete
- [ ] All admin APIs tested

### Phase 3.4 - Testing & Validation
- [ ] 80%+ test coverage
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met
- [ ] No breaking API changes

### Phase 3.5 - Production Ready
- [ ] MySQL migration tested
- [ ] Monitoring dashboards created
- [ ] Backup/recovery procedures documented
- [ ] Runbooks for common issues created
- [ ] Deployment checklist completed

---

## 🚀 Getting Started

### Prerequisites
```bash
# Ensure you have:
- Node.js 16+
- npm or yarn
- Git
- SQLite (usually pre-installed on macOS/Linux)
- MySQL (for production testing)
```

### Initial Setup
```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npm run db:push
npm run db:seed

# 3. Start development server
npm run dev

# 4. Verify setup
curl -H "Authorization: Bearer $(npm run get-token 2>/dev/null)" \
  http://localhost:3000/v1/App
```

### Start Phase 3 Development
```bash
# Week 1: Database Abstraction
# Begin with Step 1.1 above

# Create lib/entities.ts first
# Then integrate with routes

# Test incrementally as you go
npm test -- lib/entities.test.ts
npm run test:api
```

---

## 📞 Key Resources

### Documentation
- `README.md` - Architecture overview
- `prisma/README.md` - Database setup
- `docs/PHASE3_MIGRATION.md` - Migration guide
- This document - Execution plan

### External References
- [Prisma Docs](https://www.prisma.io/docs/)
- [Recharts Docs](https://recharts.org/)
- [TanStack Table](https://tanstack.com/table/)
- [Jest Testing](https://jestjs.io/)
- [Playwright](https://playwright.dev/)

---

## 🎯 Summary

**Current State:**
- ✅ 95% of SOVD API endpoints working
- ✅ Basic React UI with entity browser
- ✅ JWT auth + RBAC with 3 roles
- ❌ In-memory data (no persistence)
- ❌ No charts/tables
- ❌ No admin UI

**Phase 3 Will Deliver:**
- ✅ Persistent database (SQLite/MySQL)
- ✅ Advanced visualization (charts + tables)
- ✅ Admin control panel (permissions, users, audit)
- ✅ Production-ready deployment
- ✅ 80%+ test coverage
- ✅ < 100ms response times

**Timeline:** 4-5 weeks (with full-time team)

**Next Step:** Begin Week 1 - Database Abstraction Layer

---

**Status: 🟢 Ready to Execute**  
**Target Start:** Immediately  
**Expected Completion:** Early 2026

Let's build Phase 3! 🚀
