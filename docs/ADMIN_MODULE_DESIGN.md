# Admin Module - User & Permission Management

## 📋 Overview
Create an admin interface for managing users, roles, and permissions in the SOVD Simulation system.

---

## 🎯 Goals
1. **User Management**: Create, view, update, delete users
2. **Role Management**: Assign and manage user roles (Viewer, Developer, Admin)
3. **Permission Management**: Configure fine-grained access control per role
4. **Audit Trail**: Track changes to users and permissions

---

## 📊 Current Database Schema

### User Model
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      String   @default("Viewer")  // Viewer | Developer | Admin
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Permission Model
```prisma
model Permission {
  id          String   @id @default(cuid())
  role        String   // Viewer | Developer | Admin
  pathPattern String   // e.g., "/v1/App/*/data/*"
  method      String   // GET | POST | PUT | DELETE
  access      String   // { allowed: boolean, reason?: string }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([role, pathPattern, method])
}
```

---

## 🎨 UI Design

### 1. Admin Dashboard (`/admin`)
**Layout**: Tabbed interface with three main sections

```
┌─────────────────────────────────────────────────────┐
│  🔐 Admin Panel                        [User: admin] │
├─────────────────────────────────────────────────────┤
│  [Users] [Roles] [Permissions]                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Content Area (Active Tab)                          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 2. Users Tab
**Features**:
- User list table with search/filter
- Add new user button
- Edit/Delete actions per user

```
┌─────────────────────────────────────────────────────────────┐
│ Users                                    [+ Add User]        │
├─────────────────────────────────────────────────────────────┤
│ Search: [____________]  Filter: [All Roles ▼]              │
├─────────────────────────────────────────────────────────────┤
│ EMAIL              │ ROLE      │ CREATED    │ ACTIONS       │
├────────────────────┼───────────┼────────────┼───────────────┤
│ admin@sovd.com     │ Admin     │ 2025-12-01 │ [Edit][Delete]│
│ dev@sovd.com       │ Developer │ 2025-12-02 │ [Edit][Delete]│
│ viewer@sovd.com    │ Viewer    │ 2025-12-03 │ [Edit][Delete]│
└─────────────────────────────────────────────────────────────┘
```

### 3. Roles Tab
**Features**:
- Display three built-in roles
- Show permission summary per role
- Link to edit permissions

```
┌─────────────────────────────────────────────────────────────┐
│ Roles & Capabilities                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 👑 Admin                                   [Edit Permissions]│
│    • Full system access                                     │
│    • Can manage users and permissions                       │
│    • All CRUD operations allowed                            │
│                                                              │
│ 🔧 Developer                                [Edit Permissions]│
│    • Read/Write access to SOVD resources                    │
│    • Cannot delete or manage users                          │
│    • Can view diagnostics and logs                          │
│                                                              │
│ 👁️ Viewer                                   [Edit Permissions]│
│    • Read-only access                                       │
│    • Can view data but cannot modify                        │
│    • No access to admin features                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4. Permissions Tab
**Features**:
- Permission matrix view
- Bulk edit capabilities
- Permission templates

```
┌─────────────────────────────────────────────────────────────┐
│ Permissions                    Role: [Admin ▼]   [+ Add]    │
├─────────────────────────────────────────────────────────────┤
│ PATH PATTERN         │ METHOD │ ACCESS │ ACTIONS            │
├──────────────────────┼────────┼────────┼────────────────────┤
│ /v1/*                │ GET    │ ✓ Allow│ [Edit] [Delete]    │
│ /v1/*                │ POST   │ ✓ Allow│ [Edit] [Delete]    │
│ /v1/*                │ PUT    │ ✓ Allow│ [Edit] [Delete]    │
│ /v1/*                │ DELETE │ ✓ Allow│ [Edit] [Delete]    │
│ /v1/admin/*          │ *      │ ✓ Allow│ [Edit] [Delete]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technical Implementation

### File Structure
```
app/
├── admin/
│   ├── page.tsx                 # Main admin dashboard
│   ├── layout.tsx               # Admin layout with auth check
│   ├── _components/
│   │   ├── UsersTab.tsx         # User management UI
│   │   ├── RolesTab.tsx         # Role overview UI
│   │   ├── PermissionsTab.tsx   # Permission management UI
│   │   ├── UserModal.tsx        # Add/Edit user dialog
│   │   └── PermissionModal.tsx  # Add/Edit permission dialog
│   └── _lib/
│       └── permissions.ts       # Permission check utilities
lib/
└── admin.ts                     # Admin API utilities
app/api/admin/
├── users/
│   ├── route.ts                 # GET, POST users
│   └── [id]/
│       └── route.ts             # GET, PUT, DELETE user
└── permissions/
    ├── route.ts                 # GET, POST permissions
    └── [id]/
        └── route.ts             # GET, PUT, DELETE permission
```

### API Endpoints

#### Users
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

#### Permissions
- `GET /api/admin/permissions` - List all permissions (with role filter)
- `POST /api/admin/permissions` - Create new permission
- `GET /api/admin/permissions/:id` - Get permission details
- `PUT /api/admin/permissions/:id` - Update permission
- `DELETE /api/admin/permissions/:id` - Delete permission

---

## 🔒 Security Features

1. **Route Protection**
   - Middleware to check if user is Admin
   - Redirect non-admin users to explorer

2. **Password Hashing**
   - Use bcrypt for password storage
   - Never expose passwords in API responses

3. **Audit Logging**
   - Log all admin actions (create, update, delete)
   - Track who made changes and when

4. **Input Validation**
   - Validate email format
   - Ensure role is one of: Viewer, Developer, Admin
   - Validate permission patterns

---

## 🎯 Key Features

### User Management
- ✅ Create users with email/password/role
- ✅ Edit user details (email, role)
- ✅ Delete users (with confirmation)
- ✅ Reset user passwords
- ✅ Search and filter users

### Permission Management
- ✅ Create custom permissions per role
- ✅ Path pattern matching (wildcards supported)
- ✅ Method-specific permissions (GET, POST, PUT, DELETE)
- ✅ Bulk permission templates
- ✅ Permission testing tool

### Role Management
- ✅ View role capabilities
- ✅ See permission summary per role
- ✅ Quick edit permissions for a role

---

## 📱 Responsive Design
- Desktop-first design
- Table layouts with horizontal scroll on mobile
- Modal dialogs for forms
- Toast notifications for success/error messages

---

## 🎨 UI Components Needed

1. **Tables**: User list, Permission list
2. **Modals**: User form, Permission form, Confirmation dialogs
3. **Forms**: Input validation, role selector, method selector
4. **Badges**: Role badges, status indicators
5. **Buttons**: Primary (Add), Secondary (Edit), Danger (Delete)
6. **Search/Filter**: Input with live search, dropdown filters

---

## 📋 Implementation Phases

### Phase 1: Foundation (Core Structure)
- [ ] Create admin route structure
- [ ] Add admin middleware for auth check
- [ ] Create basic layout with tabs
- [ ] Set up API routes

### Phase 2: User Management
- [ ] Build UsersTab component
- [ ] Implement user CRUD operations
- [ ] Add UserModal for create/edit
- [ ] Add password hashing
- [ ] Add search and filter

### Phase 3: Permission Management
- [ ] Build PermissionsTab component
- [ ] Implement permission CRUD operations
- [ ] Add PermissionModal for create/edit
- [ ] Add permission validation
- [ ] Add bulk operations

### Phase 4: Polish
- [ ] Add RolesTab overview
- [ ] Implement audit logging
- [ ] Add toast notifications
- [ ] Error handling and validation
- [ ] Responsive design improvements

---

## 🧪 Testing Checklist

- [ ] Admin can create users
- [ ] Admin can edit user roles
- [ ] Admin can delete users
- [ ] Non-admin cannot access /admin route
- [ ] Permissions are enforced in explorer
- [ ] Permission wildcards work correctly
- [ ] Audit log tracks all changes
- [ ] Form validation works
- [ ] Search and filter work properly

---

## 🎯 Success Metrics

1. **Completeness**: All CRUD operations for users and permissions
2. **Security**: Only admins can access admin panel
3. **Usability**: Intuitive UI with clear actions
4. **Performance**: Fast loading and searching
5. **Reliability**: Proper error handling and validation

---

**Ready to implement?** Please review and approve this plan, or suggest any changes!
