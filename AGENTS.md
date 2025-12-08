# SOVD Explorer & Simulator Platform

## Project Overview

This is an ASAM SOVD (Service-Oriented Vehicle Diagnostics) Explorer & Simulator Platform built with Next.js and TypeScript. The platform provides a comprehensive solution for automotive software development, testing, and diagnostics with two main components:

- **SOVD Explorer (Client)**: Interactive debugging interface for SOVD services
- **SOVD Simulator (Server)**: SOVD component simulation following ASAM SOVD V1.0 specification

The platform implements enterprise-grade Role-Based Access Control (RBAC) with permissions mapped directly to SOVD resource paths, ensuring secure and compliant interactions with vehicle diagnostic services.

## Technology Stack

### Core Technologies
- **Frontend**: React 18 with Next.js 14 App Router, Tailwind CSS
- **Backend**: Node.js/TypeScript with Next.js API Routes
- **Database**: SQLite (development) / MySQL (production) with Prisma ORM
- **Authentication**: JWT-based with role claims (Viewer | Developer | Admin)
- **API Standards**: RESTful HTTP following ASAM SOVD V1.0 specification

### Key Dependencies
- `@prisma/client` - Database ORM
- `@tanstack/react-table` - Data table components
- `jose` - JWT token handling
- `recharts` - Data visualization
- `openapi-typescript` - Type generation from OpenAPI specs

## Project Structure

```
app/                          # Next.js App Router
├── api/                      # API routes
│   ├── admin/               # Admin management APIs
│   ├── auth/                # Authentication endpoints
│   └── v1/                  # SOVD V1.0 specification APIs
├── explorer/                # SOVD Explorer UI components
├── admin/                   # Admin interface
└── login/                   # Authentication UI

lib/                         # Shared utilities
├── auth.ts                  # JWT token handling
├── rbac.ts                  # Role-based access control
├── entities.ts              # SOVD entity management
├── data.ts                  # Data value operations
├── faults.ts                # Fault management
└── operations.ts            # Operation execution

prisma/                      # Database schema and migrations
├── schema.prisma            # Prisma schema definition
└── seed.js                  # Database seeding

tests/                       # Test suites
├── integration/             # Integration tests
└── setup.ts                 # Test configuration

src/generated/               # Generated TypeScript types
└── sovd.d.ts               # OpenAPI-generated types
```

## Build and Development Commands

### Development
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:api         # Run API smoke tests
```

### Database
```bash
npm run db:push          # Push schema changes to database
npm run db:migrate:dev   # Create and apply migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with initial data
```

### Code Quality
```bash
npm run typecheck        # Run TypeScript type checking
npm run generate:types   # Generate types from OpenAPI specification
```

## Architecture Details

### API Routing Structure
The platform implements ASAM SOVD V1.0 specification with hierarchical resource paths:

```
/{entity-collection}/{entity-id}/{resource-type}/{sub-resource}
```

Entity collections: `areas`, `components`, `apps`, `functions`

Resource types: `data`, `data-lists`, `faults`, `operations`, `locks`, `modes`, `configurations`, `logs`, `updates`

### Authentication Flow
1. User authenticates via `/api/auth/login` or `/v1/authorize`
2. System issues JWT token with role claim (Viewer | Developer | Admin)
3. All API requests include JWT in Authorization header
4. Middleware validates token and enforces RBAC permissions

### RBAC Permission Matrix

| Role | GET | POST | PUT | DELETE |
|------|-----|------|-----|--------|
| Viewer | ✅ All | ❌ None | ❌ None | ❌ None |
| Developer | ✅ All | ✅ Non-destructive | ✅ All | ✅ Faults only |
| Admin | ✅ All | ✅ All | ✅ All | ✅ All |

Special restrictions:
- Developers cannot access `/locks` endpoints (except GET)
- Only Admins can perform destructive DELETE operations (except fault clearing)

### Data Flow
1. **Discovery**: Explorer fetches available entities via `/v1/{entity-collection}`
2. **Resource Navigation**: Tree structure built from entity capabilities
3. **Request Construction**: Dynamic UI builds SOVD-compliant requests
4. **Permission Check**: Middleware validates JWT and RBAC rules
5. **Response Processing**: Data visualization with schema/data separation

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Path aliases configured (`@/*` maps to root directory)
- React functional components with TypeScript
- Consistent error handling with structured responses

### API Response Format
All API responses follow SOVD V1.0 specification with consistent error handling:

```typescript
// Success response
{
  "data": any,
  "schema"?: any, // when include-schema=true
  "timestamp": string
}

// Error response
{
  "error": string,
  "details"?: any,
  "timestamp": string
}
```

### Database Schema
Key entities managed through Prisma ORM:
- **User**: Authentication and role management
- **SOVDEntity**: Components, apps, areas, functions
- **DataValue**: Dynamic/static data points with timestamps
- **Fault**: Diagnostic trouble codes with status tracking
- **Operation**: Executable operations with parameter schemas
- **Permission**: RBAC configuration with path patterns

## Testing Strategy

### Test Coverage Requirements
- Minimum 70% coverage for branches, functions, lines, and statements
- Integration tests for all API endpoints
- RBAC permission testing for all role combinations
- End-to-end flows for discovery and data operations

### Test Structure
- **Unit Tests**: Individual utility functions and helpers
- **Integration Tests**: API endpoint testing with database
- **E2E Tests**: Complete user workflows

## Security Considerations

### Authentication
- JWT tokens with configurable expiration (default 1 hour)
- Role-based access control enforced at API gateway
- Token validation on every protected request

### Data Protection
- Database connection strings in environment variables
- JWT secret key configuration required for production
- Input validation on all API endpoints
- SQL injection prevention through Prisma ORM

### Deployment Security
- Environment-specific configuration files
- Database migrations for schema changes
- Audit logging for compliance tracking

## Environment Configuration

### Required Environment Variables
```bash
DATABASE_URL="file:./prisma/dev.db"  # SQLite for development
# DATABASE_URL="mysql://user:pass@localhost:3306/sovd_simulation"  # MySQL for production
JWT_SECRET="your-secure-jwt-secret-key"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

### Development Setup
1. Copy `.env.example` to `.env.local`
2. Configure database connection
3. Set secure JWT secret
4. Run `npm install` to install dependencies
5. Run `npm run db:push` to initialize database
6. Run `npm run db:seed` to populate initial data

## API Documentation

The platform implements the complete ASAM SOVD V1.0 specification including:

- **Discovery**: Entity enumeration and capability descriptions
- **Data Operations**: Read/write single values and data lists
- **Fault Management**: DTC querying, confirmation, and clearing
- **Operations**: Parameterized operation execution
- **Locks**: Resource locking for atomic operations
- **Software Updates**: Package management and execution
- **Logging**: Structured log entries and configuration

OpenAPI specification available at `docs/api-specs/sovd-api.yaml` with TypeScript types generated to `src/generated/sovd.d.ts`.