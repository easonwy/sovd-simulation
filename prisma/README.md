# Prisma Database Setup Guide

This guide explains how to set up and use Prisma with SQLite for the SOVD Simulation Platform.

## Phase 3 Persistence Setup

Starting with **Phase 3**, the application uses Prisma ORM with SQLite for local development and MySQL for production deployment.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root with database configuration:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="dev-secret-key-12345"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

For MySQL connection:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/sovd_simulation"
```

### 3. Create Database and Run Migrations

```bash
# Push schema to database (SQLite)
npm run db:push

# Or run migrations (with migration history)
npm run db:migrate:dev -- init
```

### 4. Seed Initial Data

```bash
npm run db:seed
```

This will populate the database with:
- Sample SOVD entities (Areas, Components, Apps)
- Test users (Admin, Developer, Viewer)
- Initial permissions (RBAC rules)
- Sample data values, faults, and operations

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Database Management Commands

### View Database in Prisma Studio

```bash
npm run db:studio
```

Opens a web interface to browse and edit database records.

### Create New Migration

```bash
npm run db:migrate:dev -- add_your_migration_name
```

### Reset Database (Development Only)

```bash
npx prisma db push --force-reset
npm run db:seed
```

## Database Schema

The database includes the following main tables:

- **users**: User accounts with roles (Viewer, Developer, Admin)
- **sovd_entities**: SOVD resources (Components, Areas, Apps, Functions)
- **data_values**: Configuration and status data
- **faults**: Diagnostic trouble codes (DTC)
- **operations**: Available operations on entities
- **operation_executions**: Execution history and status
- **modes**: Entity modes (e.g., test mode)
- **locks**: Resource locks for atomic operations
- **log_entries**: Audit and diagnostic logs
- **configurations**: Entity configurations
- **permissions**: RBAC rules mapping roles to resource patterns and methods
- **update_packages**: Software update tracking

## Phase 3 Transition

### Phase 1-2 (In-Memory)
- Data stored in TypeScript Map objects
- State lives in `lib/state.ts`
- Perfect for development and testing

### Phase 3 (Persistent)
- Data persists in SQLite (development) or MySQL (production)
- Uses Prisma for type-safe database access
- Schema defined in `prisma/schema.prisma`

## Migration from In-Memory to Persistent

To transition from Phase 2 to Phase 3:

1. Keep `lib/state.ts` as fallback for features not yet migrated to database
2. Gradually migrate state functions to use Prisma
3. Update route handlers to use `prisma` client from `lib/prisma.ts`
4. Add database transactions where needed for complex operations

## Example: Using Prisma in Route Handlers

```typescript
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Find all faults for an entity
  const entity = await prisma.sOVDEntity.findUnique({
    where: { id: entityId },
    include: { faults: true }
  })

  return NextResponse.json(entity.faults)
}
```

## Production Deployment

### MySQL Setup

1. Update `.env` for production:

```env
DATABASE_URL="mysql://user:password@host:3306/sovd_simulation"
```

2. Run migrations:

```bash
npx prisma migrate deploy
```

3. Seed production data (if needed):

```bash
npm run db:seed
```

### Deploy Steps

1. Push code changes
2. Run `npm install` on server
3. Run `npx prisma migrate deploy`
4. Restart application

## Troubleshooting

### Database file locked (SQLite)

If you see "database is locked" errors:

```bash
# Close all connections and reset
npx prisma db push --force-reset
npm run db:seed
```

### Prisma Client not generated

```bash
npx prisma generate
```

### Type errors with generated types

```bash
# Regenerate Prisma Client
npx prisma generate

# Clear cache
rm -rf node_modules/.prisma
npm install
```

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [SQLite with Prisma](https://www.prisma.io/docs/reference/database-reference/supported-databases)
- [MySQL with Prisma](https://www.prisma.io/docs/reference/database-reference/supported-databases)
- [SOVD API Specification](./docs/api-specs/sovd-api.yaml)
