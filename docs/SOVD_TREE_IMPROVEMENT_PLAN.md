# SOVD Tree Improvement Plan

Based on ASAM SOVD Standards v1.0 and the reference UI provided.

## 🎯 Issues Identified

### 1. Tree Collection Ordering ❌
**Current**: `['Area', 'Component', 'App', 'Function']`
**Required**: `['Component', 'App', 'Function', 'Area']`

### 2. Tree Entry API Mapping ❌
**Current**: Generic RESOURCES array applied to all entities
**Required**: Each resource type should map to specific endpoints per ASAM SOVD spec:
- **Components**: 
  - GET `/v1/Component` (list)
  - GET `/v1/Component/{component-id}` (single)
  - Sub-resources: `configurations`, `bulk-data`, `data`, `data-lists`, `faults`, `operations`, `updates`, `modes`, `locks`, `logs`, `subareas`, `subcomponents`
  
- **Apps**:
  - GET `/v1/App` (list)
  - GET `/v1/App/{app-id}` (single)
  - Sub-resources: `configurations`, `bulk-data`, `data`, `data-lists`, `faults`, `operations`, `updates`, `modes`, `locks`, `logs`
  
- **Functions**:
  - GET `/v1/Function` (list)
  - GET `/v1/Function/{function-id}` (single)
  - Sub-resources: Same as Apps
  
- **Areas**:
  - GET `/v1/Area` (list)
  - GET `/v1/Area/{area-id}` (single)
  - Sub-resources: `configurations`, `bulk-data`, `data`, `data-lists`, `faults`, `operations`, `updates`, `modes`, `locks`, `logs`, `subareas`, `subcomponents`

### 3. Default Request Parameters ❌
**Current**: Empty parameters except `include-schema: false`
**Required**: Pre-populate parameters based on API spec for each endpoint:

**Standard Query Parameters (per ASAM SOVD)**:
- `include-schema`: boolean (default: false)
- `status[timestamp]`: ISO 8601 timestamp
- `status[responseCode]`: HTTP status code filter
- `status[responseMessage]`: message filter
- `status[stationInfo]`: station identifier
- `severity`: fault severity filter
- `scopeParameter`: operation scope filter

### 4. Sample Data Quality Issues 🔴

**Current Problems**:
1. **Incomplete entity hierarchies**: Missing proper Component→Area relationships
2. **Insufficient data diversity**: Limited fault codes, status variations
3. **Timestamps**: Not following ISO 8601 strictly
4. **Missing SOVD-specific fields**:
   - Component/Area `type` field (should be more descriptive)
   - Fault `severity` levels (per SOVD: `critical`, `major`, `minor`, `informational`)
   - Operation `scopeParameter` values
   - Log `stationInfo` metadata

## 📋 Improvement Plan

### Phase 1: Fix Tree Structure (Immediate)
**File**: `app/explorer/_components/Tree.tsx`

1. **Update collection order**:
   ```typescript
   const COLLECTIONS = ['Component', 'App', 'Function', 'Area']
   ```

2. **Define resource mappings per collection type**:
   ```typescript
   const RESOURCE_MAP: Record<string, { name: string; methods: string[] }[]> = {
     Component: [
       { name: 'configurations', methods: ['GET'] },
       { name: 'bulk-data', methods: ['GET'] },
       { name: 'data', methods: ['GET', 'POST'] },
       { name: 'data-lists', methods: ['GET', 'POST'] },
       { name: 'faults', methods: ['GET', 'DELETE'] },
       { name: 'operations', methods: ['GET', 'POST'] },
       { name: 'updates', methods: ['GET', 'POST'] },
       { name: 'modes', methods: ['GET'] },
       { name: 'locks', methods: ['GET', 'POST'] },
       { name: 'logs', methods: ['GET'] },
       { name: 'subareas', methods: ['GET'] },
       { name: 'subcomponents', methods: ['GET'] }
     ],
     App: [
       { name: 'configurations', methods: ['GET'] },
       { name: 'bulk-data', methods: ['GET'] },
       { name: 'data', methods: ['GET', 'POST'] },
       { name: 'data-lists', methods: ['GET', 'POST'] },
       { name: 'faults', methods: ['GET', 'DELETE'] },
       { name: 'operations', methods: ['GET', 'POST'] },
       { name: 'updates', methods: ['GET', 'POST'] },
       { name: 'modes', methods: ['GET'] },
       { name: 'locks', methods: ['GET', 'POST'] },
       { name: 'logs', methods: ['GET'] }
     ],
     Function: [
       // Same as App
     ],
     Area: [
       // Same as Component
     ]
   }
   ```

3. **Render resources dynamically**:
   - Loop through `RESOURCE_MAP[col]` instead of static `RESOURCES`
   - Display all available methods for each resource

### Phase 2: Add Default Parameters (High Priority)
**File**: `app/explorer/_components/RequestConsole.tsx`

Create parameter presets based on endpoint type:

```typescript
const PARAMETER_PRESETS: Record<string, Array<{ key: string; value: string }>> = {
  faults: [
    { key: 'include-schema', value: 'false' },
    { key: 'status[timestamp]', value: '' },
    { key: 'status[responseCode]', value: '' },
    { key: 'severity', value: '' },
    { key: 'scopeParameter', value: '' }
  ],
  logs: [
    { key: 'include-schema', value: 'false' },
    { key: 'status[timestamp]', value: '' },
    { key: 'status[stationInfo]', value: '' }
  ],
  operations: [
    { key: 'include-schema', value: 'false' },
    { key: 'scopeParameter', value: '' }
  ],
  data: [
    { key: 'include-schema', value: 'false' }
  ],
  // ... other resource types
}
```

**Implementation**:
- Detect resource type from `initialPath` prop
- Auto-populate `queryParams` state with matching preset
- Keep existing dynamic row addition logic

### Phase 3: Enhance Sample Data (Critical)

**Files to Update**:
- `prisma/seed.ts`
- Database schema if needed

**Improvements**:

1. **Component/Area Hierarchies**:
   ```typescript
   // Add proper Component → SubComponent relationships
   // Add proper Area → SubArea relationships
   // Example: "Powertrain" Component with "Engine", "Transmission" subcomponents
   ```

2. **Realistic Entity Mix**:
   - **Components**: 5-8 automotive components (e.g., Powertrain, Chassis, ADAS, Infotainment)
   - **Apps**: 10-15 apps (e.g., Navigation, Climate Control, Driver Assistance)
   - **Functions**: 8-12 functions (e.g., Anti-lock Braking, Cruise Control)
   - **Areas**: 4-6 areas (e.g., Front-left, Rear, Central)

3. **DataValue Enhancements**:
   ```typescript
   // Add more realistic automotive data:
   {
     dataId: 'vehicle-speed',
     value: { current: 75, unit: 'km/h', history: [...] },
     timestamp: '2025-12-06T13:00:00+08:00'
   },
   {
     dataId: 'engine-temp',
     value: { current: 92, unit: '°C', threshold: 105 },
     timestamp: '2025-12-06T13:00:00+08:00'
   }
   ```

4. **Fault Data**:
   ```typescript
   {
     code: 'P0301',
     fault_name: 'Cylinder 1 Misfire Detected',
     status: {
       timestamp: '2025-12-06T12:45:23+08:00',
       responseCode: 200,
       stationInfo: 'ECU-01'
     },
     severity: 'major'  // critical | major | minor | informational
   }
   ```

5. **Operation Data**:
   ```typescript
   {
     operation: 'reset-dtc',
     scopeParameter: 'all',  // all | powertrain | chassis
     status: {
       timestamp: '2025-12-06T12:50:15+08:00',
       responseCode: 200,
       responseMessage: 'Operation completed successfully'
     }
   }
   ```

6. **Log Entries**:
   ```typescript
   {
     timestamp: '2025-12-06T13:00:00+08:00',
     level: 'info',
     message: 'Vehicle started',
     stationInfo: { id: 'BCM-01', location: 'Central Gateway' }
   }
   ```

### Phase 4: Update API Routes (If Needed)

Ensure API endpoints return data matching ASAM SOVD structure:
- `app/v1/[entity-collection]/[entity-id]/[resource]/route.ts`
- Add query parameter validation
- Return proper SOVD response structure with `status` metadata

## 📊 Expected Outcomes

✅ Tree menu displays in correct order
✅ Each entity type shows only its valid resources
✅ HTTP methods correctly mapped per resource
✅ Request parameters auto-populated based on endpoint
✅ Sample data follows ASAM SOVD v1.0 specification
✅ Realistic automotive use cases demonstrated

## 🔧 Implementation Order

1. **Fix Tree Ordering** (5 min) ✅
2. **Update Resource Mapping** (30 min)
3. **Add Parameter Presets** (45 min)
4. **Enhance Seed Data** (2-3 hours)
5. **Test & Validate** (1 hour)

---

**Total Estimated Time**: ~5 hours of development work

**Priority**: High - Core functionality and data quality improvement
