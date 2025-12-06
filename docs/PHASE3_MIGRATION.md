# SOVD Simulation - Phase 3 Migration Guide

## Overview

Phase 3 introduces persistent database storage using Prisma ORM with SQLite (development) and MySQL (production). This document outlines the migration strategy from in-memory state to database-backed persistence.

## Architecture Changes

### Phase 1-2: In-Memory State
```
Route Handler → lib/state.ts (Map objects) → Response
```

### Phase 3: Database-Backed
```
Route Handler → Prisma Client → SQLite/MySQL → Response
```

## Migration Strategy

### Step 1: Add Prisma Client (✅ Done)
- Initialize Prisma with SQLite schema
- Create migration system
- Seed initial data

### Step 2: Parallel Implementation (Next Steps)
Keep `lib/state.ts` for backward compatibility while:
1. Create database abstraction layer
2. Migrate endpoints incrementally
3. Maintain in-memory fallback for testing

### Step 3: Gradual Endpoint Migration
1. Authentication endpoints (User lookup, JWT validation)
2. Discovery endpoints (Entity listing)
3. Data endpoints (read/write operations)
4. Fault management endpoints
5. Operation tracking endpoints

## Example Migration: Faults Endpoint

### Before (Phase 2):
```typescript
// lib/state.ts
const faults = new Map<string, Fault[]>()

export function listFaults(collection: EntityCollection, entityId: string) {
  const arr = faults.get(`${collection}:${entityId}`) || []
  return { items: arr }
}
```

### After (Phase 3):
```typescript
// lib/faults.ts (new database layer)
import { prisma } from './prisma'

export async function listFaults(collection: string, entityId: string) {
  const entity = await prisma.sOVDEntity.findUnique({
    where: { id: entityId },
    include: { faults: true }
  })
  
  return { items: entity?.faults || [] }
}
```

### Updated Route Handler:
```typescript
// app/v1/[entity-collection]/[entity-id]/faults/route.ts
import { listFaults } from '../../../../../lib/faults'

export async function GET(req: NextRequest, { params }: { params: { 'entity-collection': string; 'entity-id': string } }) {
  const resp = await listFaults(params['entity-collection'], params['entity-id'])
  return NextResponse.json(resp, { status: 200 })
}
```

## Database Abstraction Layer

Create new files in `lib/` to encapsulate database operations:

### lib/entities.ts
```typescript
import { prisma } from './prisma'

export async function getEntityByIdAndCollection(id: string, collection: string) {
  return prisma.sOVDEntity.findUnique({
    where: { entityId_collection: { entityId: id, collection } }
  })
}

export async function listEntitiesByCollection(collection: string) {
  return prisma.sOVDEntity.findMany({
    where: { collection }
  })
}
```

### lib/data.ts
```typescript
import { prisma } from './prisma'

export async function readDataValue(entityId: string, dataId: string) {
  return prisma.dataValue.findUnique({
    where: { entityId_dataId: { entityId, dataId } }
  })
}

export async function writeDataValue(entityId: string, dataId: string, value: unknown) {
  return prisma.dataValue.upsert({
    where: { entityId_dataId: { entityId, dataId } },
    update: { value: JSON.stringify(value) },
    create: { entityId, dataId, value: JSON.stringify(value) }
  })
}
```

## Migration Checklist

- [ ] Run `npm install` to add Prisma and sqlite3
- [ ] Create `.env.local` with `DATABASE_URL`
- [ ] Run `npm run db:push` to create database schema
- [ ] Run `npm run db:seed` to populate initial data
- [ ] Create database abstraction layer in `lib/`
- [ ] Migrate authentication endpoints
- [ ] Migrate discovery endpoints
- [ ] Migrate data endpoints with `include-schema` support
- [ ] Migrate fault management endpoints
- [ ] Migrate operation tracking endpoints
- [ ] Add transaction support for complex operations
- [ ] Update tests to use seeded database
- [ ] Performance optimization and indexing
- [ ] Production MySQL migration guide

## Key Considerations

### Performance
- Add database indexes for frequently queried fields
- Use `select` to fetch only needed fields
- Consider caching for read-heavy operations

### Transactions
For atomic operations (e.g., lock + data update):
```typescript
const result = await prisma.$transaction(async (tx) => {
  const lock = await tx.lock.create({ data: { entityId } })
  const updated = await tx.dataValue.update({ ... })
  return { lock, updated }
})
```

### RBAC Integration
Store permission rules in database:
```typescript
export async function checkPermission(role: string, pathPattern: string, method: string) {
  return prisma.permission.findUnique({
    where: { role_pathPattern_method: { role, pathPattern, method } }
  })
}
```

### Backward Compatibility
Maintain `lib/state.ts` for development/testing:
```typescript
// Hybrid approach
export async function listFaults(collection, entityId) {
  if (process.env.USE_DATABASE === 'true') {
    return await listFaultsFromDb(collection, entityId)
  }
  return listFaultsFromMemory(collection, entityId)
}
```

## Testing Strategy

### Unit Tests
Mock Prisma Client:
```typescript
import { PrismaClient } from '@prisma/client'
import { mockDeep } from 'jest-mock-extended'

const prisma = mockDeep<PrismaClient>()
```

### Integration Tests
Use test database:
```bash
DATABASE_URL="file:./prisma/test.db" npm test
```

### Seed Test Data
```typescript
// tests/setup.ts
import { seed } from '../prisma/seed'

beforeAll(async () => {
  await seed()
})
```

## Production Deployment

### MySQL Migration
1. Create MySQL database
2. Update `.env` with MySQL URL
3. Run migrations: `npx prisma migrate deploy`
4. Verify data integrity

### Backup Strategy
- Regular database backups
- Migration rollback plan
- Data validation scripts

## Success Metrics

- [ ] All endpoints working with database
- [ ] Response times < 100ms (p95)
- [ ] Zero data loss during migration
- [ ] RBAC fully functional
- [ ] Unit test coverage > 80%
- [ ] Ready for production deployment

## References

- [Prisma Schema Design Best Practices](https://www.prisma.io/docs/guides/database/best-practices)
- [Schema Migration Strategies](https://www.prisma.io/docs/guides/schema/schema-migration)
- [Performance Optimization](https://www.prisma.io/docs/guides/performance-and-optimization)
