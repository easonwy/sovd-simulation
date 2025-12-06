# SOVD Simulation - Implementation Plan

Based on the review of the current code state and the roadmap, this document outlines the concrete steps to complete Phase 3.

## 🟢 1. Visualization Integration (Phase 3.2 Completion)

**Status**: Partial. Components exist but are not fully integrated.

**Tasks**:
- [ ] **DataChart Integration**: Update `app/explorer/visualization/page.tsx` to replace placeholder divs with the actual `<DataChart />` component.
- [ ] **Component Verification**: Ensure `DataChart`, `FaultsTable`, `LogsTable` work correctly with both sample data and real API data.
- [ ] **Explorer Page Update**: Update `app/explorer/page.tsx` to link to the visualization page or embed components as needed.

## 🔴 2. Admin UI Development (Phase 3.3)

**Status**: Not Started. `app/admin` directory is missing.

**Tasks**:
- [ ] **Admin Layout**: Create `app/admin/layout.tsx` for admin-specific navigation (Sidebar).
- [ ] **Dashboard**: Create `app/admin/page.tsx` showing system overview.
- [ ] **Permissions Management**:
    - Create `app/admin/permissions/page.tsx`.
    - Implement components to manage RBAC roles and permissions (using `lib/permissions.ts`).
- [ ] **User Management**: Create `app/admin/users/page.tsx` (can be a stub initially).
- [ ] **Audit Log**: Create `app/admin/audit/page.tsx` showing `LogEntries`.

## 🟡 3. Testing & Quality (Phase 3.4)

**Status**: Integration tests exist. E2E tests missing.

**Tasks**:
- [ ] **E2E Setup**: Install Playwright and configure `playwright.config.ts`.
- [ ] **E2E Tests**: Write basic scenarios:
    - Discovery Flow (browse entities).
    - Data Flow (read/write data).
    - Visualization Flow (check if charts render).

## 🔵 4. Production Readiness

**Status**: Pending.

**Tasks**:
- [ ] **Documentation**: Update README with new Admin and Visualization features.
- [ ] **Migration**: Ensure all DB migrations are applied and documented.

---

**Recommendation for Next Step**:
Start with **Visualization Integration** to complete the work laid out in Phase 3.2, specifically integrating the `DataChart` into the visualization showcase.
