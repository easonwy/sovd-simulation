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
- `commander` - CLI tools
- `bcryptjs` - Password hashing

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
├── enhanced-jwt.ts          # JWT token handling (Edge Runtime compatible)
├── rbac.ts                  # Role-based access control
├── entities.ts              # SOVD entity management
├── data.ts                  # Data value operations
├── faults.ts                # Fault management
├── operations.ts            # Operation execution
├── permissions-util.ts      # Permission checking utilities
├── audit-logger.ts          # Audit logging
└── browser-token-utils.ts   # Browser token management

prisma/                      # Database schema and migrations
├── schema.prisma            # Prisma schema definition
└── seed.ts                  # Database seeding

tests/                       # Test suites
├── integration/             # Integration tests
└── setup.ts                 # Test configuration

scripts/                     # Utility scripts
├── token-cli.cjs            # JWT token management CLI
├── generate-keys.js         # Key generation utilities
└── api-smoke.mjs            # API smoke tests

docs/                        # Documentation
├── api-specs/               # OpenAPI specifications
└── asam/                    # ASAM SOVD specification documents
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
npm run test:coverage    # Run tests with coverage report (minimum 70%)
npm run test:api         # Run API smoke tests
```

### Database
```bash
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and apply migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with initial data
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
```

### Utility Scripts
```bash
npm run generate-keys    # Generate JWT keys
npm run token            # JWT token management CLI
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

### Enhanced JWT Implementation
- **Edge Runtime Compatible**: Uses `jose` library with PEM strings
- **Multi-tenant Support**: Includes organization ID (oid) and permissions
- **Security Features**: JWT ID (jti) for replay attack prevention
- **Flexible Claims**: Supports custom fields and extended metadata

### RBAC Permission Matrix

| Role | GET | POST | PUT | DELETE |
|------|-----|------|-----|--------|
| Viewer | ✅ All | ❌ None | ❌ None | ❌ None |
| Developer | ✅ All | ✅ Non-destructive | ✅ All | ✅ Faults only |
| Admin | ✅ All | ✅ All | ✅ All | ✅ All |

Special restrictions:
- Developers cannot access `/locks` endpoints (except GET)
- Only Admins can perform destructive DELETE operations (except fault clearing)

### Middleware Configuration
- **Path Matching**: `/v1/:path*`, `/api/admin/:path*`, `/sovd/v1/:path*`
- **Permission Checking**: Uses token-based permissions (no DB calls in middleware)
- **Header Injection**: Adds user context to request headers
- **Edge Runtime**: Fully compatible with Vercel Edge Runtime

## Database Schema

### Core Entities
- **User**: Authentication and role management
- **SOVDEntity**: Components, apps, areas, functions
- **DataValue**: Dynamic/static data points with timestamps
- **Fault**: Diagnostic trouble codes with status tracking
- **Operation**: Executable operations with parameter schemas
- **Permission**: RBAC configuration with path patterns
- **AuditLog**: Security and compliance tracking
- **DataSnapshot**: Time-series data for visualization

### Key Features
- **Cascading Deletes**: Maintains referential integrity
- **Unique Constraints**: Prevents duplicate entries
- **Indexing**: Optimized for common query patterns
- **JSON Storage**: Flexible metadata and configuration storage

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

### Test Configuration
- **Jest**: TypeScript support with ts-jest
- **Database**: Clean state between tests
- **Timeout**: 10 seconds for integration tests
- **Coverage**: Enforced minimum thresholds

## Security Considerations

### Authentication
- JWT tokens with configurable expiration (default 24 hours)
- Role-based access control enforced at API gateway
- Token validation on every protected request
- Support for multi-tenant scenarios

### Data Protection
- Database connection strings in environment variables
- JWT secret key configuration required for production
- Input validation on all API endpoints
- SQL injection prevention through Prisma ORM

### Key Management
- Development and production key pairs included
- RSA-256 algorithm for JWT signing
- Automatic environment detection
- Key rotation support

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

OpenAPI specification available at `docs/api-specs/sovd-api.yaml` with comprehensive examples for all endpoints.

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

### Error Handling
- Structured error responses with codes
- Detailed error messages for debugging
- Proper HTTP status codes
- Consistent timestamp formatting

## Deployment Considerations

### Production Requirements
- MySQL database (SQLite for development only)
- Secure JWT secret key
- Environment-specific configuration
- Database migrations for schema changes
- Audit logging for compliance tracking

### Performance Optimization
- Database indexing for common queries
- Middleware caching where appropriate
- Efficient permission checking
- Optimized Prisma queries

This platform provides a robust, secure, and compliant solution for SOVD-based vehicle diagnostics and testing, with enterprise-grade features suitable for automotive software development workflows.