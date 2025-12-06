# SOVD Explorer & Simulator 平台

## SOVD Explorer 产品文档 (v0.2)

## 1. 产品概述

**产品名称：** SOVD Explorer  
**产品定位：** 一款面向汽车软件开发、测试与诊断工程师的桌面/Web工具，用于**探索、调试和交互 ASAM SOVD 1.0 标准**定义的车辆诊断服务接口。  
**核心价值：**

*   **精准映射 SOVD 标准模型：** 完整支持并可视化 ASAM SOVD 定义的资源层级、关系与操作。
*   **标准化交互：** 严格遵循 SOVD 的 HTTP 方法语义与资源路径规范，确保交互行为合规。
*   **权限管控：** 在 SOVD 资源模型基础上，实现细粒度的访问控制（RBAC），满足企业安全合规。
*   **高效调试：** 提供直观的 UI 与详细的请求/响应日志，显著提升基于 SOVD 的开发与测试效率。

![img](https://cdn.vector.com/cms/content/know-how/SOVD/graphics/SOVD_tools/SOVD_Explorer_web.jpg)

## 2. ASAM SOVD 1.0 核心接口模型

> **说明：** 本部分依据 ASAM SOVD 1.0 规范整理，是产品功能设计的基础。

SOVD 定义了一套基于 **RESTful HTTP** 的车辆诊断服务接口。其核心是 **资源（Resources）** 层级模型，所有操作都通过标准的 HTTP 方法在这些资源上执行。

### 2.1 核心资源层级结构

SOVD 的 URI 路径结构具有严格的层次关系：

```
/{components|apps}/{identifier}/{resource-type}/{sub-resource}?
```

*   **`/components/{component-id}`**: 代表车辆中的一个**物理或逻辑组件**（Component）。
    *   `component-id`: 该组件的唯一标识符（如 `abs`, `engine-control-unit`）。
*   **`/apps/{app-id}`**: 代表运行在车辆上或外部的一个 **SOVD 应用**（Application）。
    *   `app-id`: 该应用的唯一标识符（如 `weather-app`, `diagnostic-tool-xyz`）。
*   **`{resource-type}`**: 组件或应用提供的**核心诊断资源类型**。SOVD 1.0 主要定义了以下几种：
    *   **`data`**: **单一数据点**（Single Data Point）。用于读取或更新一个具体的、可量化的值（如 `engine-rpm`, `outside-temperature`）。
    *   **`data-lists`**: **数据列表**（Data Lists）。用于批量读取一组相关的数据点（如 `all-sensor-readings`）。
    *   **`faults`**: **故障码**（Faults）。用于查询、确认或重置诊断故障码（DTC, Diagnostic Trouble Codes）。
    *   **`operations`**: **操作**（Operations）。用于触发车辆执行一个特定的动作或服务（如 `start-engine-diagnostic`, `clear-all-faults`）。
*   **`{sub-resource}`**: 资源类型下的**具体实例**。
    *   例如：`/apps/weather-app/data/outside-temperature`
    *   例如：`/components/engine-control-unit/faults/P0300`
    *   例如：`/apps/diagnostic-tool-xyz/operations/start-full-scan`

### 2.2 标准化 HTTP 操作语义

*   **GET**: 用于**读取** `data`, `data-lists`, `faults`, `operations` 的当前状态或元数据。
    *   `GET /apps/.../data/{data-id}`: 获取单个数据点的值。
    *   `GET /apps/.../faults`: 获取所有未确认的故障码列表。
*   **POST**: 用于**创建**、**触发**或**修改**。
    *   `POST /apps/.../faults/{fault-id}/confirm`: 确认一个故障码。
    *   `POST /apps/.../operations/{operation-id}`: 触发一个操作（请求体可能包含输入参数）。
    *   `POST /apps/.../data/{data-id}`: **修改**一个数据点的值（如果该数据点支持写入）。
*   **DELETE**: 用于**删除**或**重置**。
    *   `DELETE /apps/.../faults/{fault-id}`: 重置（清除）一个故障码。
    *   `DELETE /apps/.../faults`: 重置（清除）所有故障码。

### 2.3 标准查询参数与 Header

*   **`include-schema`**: 一个常见的查询参数。当在 `GET` 请求中加入 `?include-schema=true` 时，服务端除了返回数据本身，还会在响应体中包含该数据点的**JSON Schema**，描述其数据类型、单位、范围等元信息。
*   **`status[timestamp]`**: 用于指定读取某个历史时间点的状态（非所有实现都支持）。

## 3. 核心功能模块 (更新以映射 SOVD 模型)

### 3.1 用户认证与权限管理 (Auth & RBAC)
*   **功能不变**，但权限模型将直接绑定到 **2.1 节定义的资源层级路径**上。
*   **权限示例：**
    *   `Viewer`: 仅对所有 `/apps/**/data` 和 `/components/**/data` 资源拥有 `READ` 权限。
    *   `Developer`: 对 `/apps/weather-app/**` 下所有资源拥有 `READ` 和 `WRITE` 权限，但对 `/components/**/faults` 仅有 `READ` 权限。
    *   `Admin`: 拥有所有资源的 `READ`, `WRITE`, `DELETE` 权限。

### 3.2 SOVD 服务资源浏览器 (Explorer)
*   **资源树动态构建：** 资源树将严格遵循 SOVD 的 `components/apps -> identifier -> resource-type -> sub-resource` 四层结构。
*   **节点类型识别：** 系统能够根据路径自动识别节点是 `Component`、`App`、`Data`、`Data-List`、`Fault` 还是 `Operation`，并使用不同的图标和标签进行区分。
*   **方法按钮智能显示：**
    *   对于 `data` 节点：显示 `GET` (读) 和 `POST` (写) 按钮。
    *   对于 `faults` 节点（集合）：显示 `GET` (查所有) 和 `DELETE` (清所有) 按钮。
    *   对于 `faults/{fault-id}` 节点：显示 `GET` (查单个), `POST` (确认), `DELETE` (清除) 按钮。
    *   对于 `operations` 节点：显示 `POST` (触发) 按钮。

### 3.3 请求控制台 (Console)
*   **请求构建器：**
    *   **路径栏：** 显示符合 SOVD 规范的完整路径。
    *   **方法选择器：** 根据所选资源节点的类型，**动态限定**可选的 HTTP 方法（如对 `data` 节点，只显示 `GET/POST`）。
    *   **参数面板：** 提供一个专门的输入框用于 `include-schema` 等**标准查询参数**。同时提供一个通用的 K-V 表格用于输入其他自定义或标准参数。
*   **响应查看器：**
    *   当响应包含 `include-schema` 信息时，UI 应能**分离并高亮显示** Schema 部分与数据值部分，方便用户理解数据结构。

## 4. 用户界面 (UI) 设计要点 (更新)

*   **资源树标签：** 在树节点旁清晰标注其类型（如 `[Data]`, `[Fault: P0300]`, `[Operation]`）。
*   **操作语义化：** 将生硬的 `POST` 按钮，在 `faults` 节点上显示为「确认」，在 `operations` 节点上显示为「执行」，提升可读性。

---

通过以上更新，SOVD Explorer 的产品定义现在与 **ASAM SOVD 1.0 标准**实现了精确对齐。这确保了产品不仅是一个通用的 REST 客户端，而是一个**深度理解并服务于 SOVD 特定领域**的专业工具。

系统设计文档中的数据模型和权限检查逻辑也应随之调整，将权限粒度精确到 SOVD 的资源路径上，例如 `/apps/weather-app/data/outside-temperature`。



## 系统设计文档

> **目标**：构建一个集 **SOVD 接口模拟器 (Simulator)** 与 **SOVD 资源浏览器 (Explorer)** 于一体的全栈平台，严格遵循 ASAM SOVD 1.0 标准，并集成企业级权限管控。

---

## 1. 技术栈（不变）

- **框架**：Next.js 14+ (App Router)
- **数据库**：PostgreSQL + Prisma ORM（支持复杂关系与索引）
- **认证**：`next-auth` + 自研 RBAC 中间件
- **前端库**：`shadcn/ui`, `react-hook-form`, `zod`, `react-json-view`, `rc-tree`
- **部署**：Docker + Vercel / 自建 Node 服务器

---

## 2. ASAM SOVD 1.0 全量标准接口列表

> 注：以下接口基于 ASAM MCD-3 SOVD 1.0 Draft 规范整理，为 **Simulator 实现**与 **Explorer 权限/交互设计**提供权威依据。

### 2.1 资源模型与标准路径

| 资源层级                  | 路径模式                                                     | 资源说明                                                     |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **根路径**                | `/`                                                          | 返回可用的 `components` 和 `apps` 列表                       |
| **组件 (Components)**     | `/components`                                                | 返回所有组件的 ID 列表                                       |
|                           | `/components/{component-id}`                                 | 单个组件的元信息                                             |
| **应用 (Applications)**   | `/apps`                                                      | 返回所有应用的 ID 列表                                       |
|                           | `/apps/{app-id}`                                             | 单个应用的元信息                                             |
| **数据点 (Data)**         | `/components/{cid}/data`<br>`/apps/{aid}/data`               | 返回该组件/应用下所有数据点 ID                               |
|                           | `/components/{cid}/data/{data-id}`<br>`/apps/{aid}/data/{data-id}` | **读取**或**写入**单个数据点的值                             |
| **数据列表 (Data Lists)** | `/components/{cid}/data-lists`<br>`/apps/{aid}/data-lists`   | 返回所有数据列表 ID                                          |
|                           | `/components/{cid}/data-lists/{list-id}`<br>`/apps/{aid}/data-lists/{list-id}` | **读取**整个数据列表                                         |
| **故障码 (Faults)**       | `/components/{cid}/faults`<br>`/apps/{aid}/faults`           | **GET**: 获取所有未确认故障码<br>**DELETE**: 清除所有故障码  |
|                           | `/components/{cid}/faults/{fault-id}`<br>`/apps/{aid}/faults/{fault-id}` | **GET**: 获取单个故障详情<br>**POST**: 确认故障 (`/confirm`)<br>**DELETE**: 清除故障 |
| **操作 (Operations)**     | `/components/{cid}/operations`<br>`/apps/{aid}/operations`   | 返回所有可执行操作 ID                                        |
|                           | `/components/{cid}/operations/{op-id}`<br>`/apps/{aid}/operations/{op-id}` | **POST**: 触发操作（请求体可含输入参数）                     |

### 2.2 标准查询参数

| 参数                | 适用方法       | 说明                                       |
| ------------------- | -------------- | ------------------------------------------ |
| `include-schema`    | `GET`          | 若为 `true`，响应中包含 JSON Schema 元数据 |
| `status[timestamp]` | `GET`          | 请求指定时间戳的状态（历史数据）           |
| `confirm`           | `POST` (Fault) | 确认故障（部分实现通过路径 `/confirm`）    |

### 2.3 标准 HTTP 方法语义

| 资源类型               | GET          | POST         | DELETE           |
| ---------------------- | ------------ | ------------ | ---------------- |
| **`/data/{id}`**       | 读取值       | **写入值**   | —                |
| **`/data-lists/{id}`** | 读取列表     | —            | —                |
| **`/faults`**          | 查询所有 DTC | —            | **清除所有 DTC** |
| **`/faults/{id}`**     | 查询单个 DTC | **确认 DTC** | **清除单个 DTC** |
| **`/operations/{id}`** | 获取操作描述 | **执行操作** | —                |

> ⚠️ **重要**：`PUT` 在 SOVD 1.0 中 **未被使用**，所有写操作均通过 `POST` 实现。

---

## 3. 系统模块设计（深度适配 SOVD）

### 3.1 元数据模型（Prisma Schema）

平台需同时管理 **用户权限** 与 **SOVD 资源元数据**（用于 Simulator 和 Explorer 渲染）。

```prisma
// ========================
// 用户与权限模型
// ========================
model User {
  id       String @id @default(cuid())
  email    String @unique
  role     Role   @default(VIEWER)
  // ... 其他字段
}

enum Role { ADMIN DEVELOPER VIEWER }

// ========================
// SOVD 资源元数据模型 (Simulator核心)
// ========================
model SOVDApp {
  id          String   @id @default(cuid())
  appId       String   @unique // e.g., "weather-app"
  name        String
  description String?
  dataPoints  SOVDDataPoint[]
  dataLists   SOVDDataList[]
  faults      SOVDFault[]
  operations  SOVDOperation[]
}

model SOVDComponent {
  id          String   @id @default(cuid())
  compId      String   @unique // e.g., "abs"
  name        String
  description String?
  dataPoints  SOVDDataPoint[]
  dataLists   SOVDDataList[]
  faults      SOVDFault[]
  operations  SOVDOperation[]
}

// 数据点
model SOVDDataPoint {
  id        String @id @default(cuid())
  dataId    String // e.g., "outside-temperature"
  appId     String? @unique([appId, dataId])
  compId    String? @unique([compId, dataId])
  dataType  String // "number", "boolean", "string"
  unit      String?
  schema    Json?  // JSON Schema for include-schema
  writable  Boolean @default(false)
  app       SOVDApp?   @relation(fields: [appId], references: [id])
  comp      SOVDComponent? @relation(fields: [compId], references: [id])
}

// 故障码
model SOVDFault {
  id        String @id @default(cuid())
  faultId   String // e.g., "P0300"
  appId     String? @unique([appId, faultId])
  compId    String? @unique([compId, faultId])
  active    Boolean @default(true)
  timestamp DateTime @default(now())
  app       SOVDApp?   @relation(fields: [appId], references: [id])
  comp      SOVDComponent? @relation(fields: [compId], references: [id])
}

// 操作
model SOVDOperation {
  id          String @id @default(cuid())
  opId        String
  appId       String? @unique([appId, opId])
  compId      String? @unique([compId, opId])
  inputs      Json?  // JSON Schema for input parameters
  app         SOVDApp?   @relation(fields: [appId], references: [id])
  comp        SOVDComponent? @relation(fields: [compId], references: [id])
}

// ========================
// 权限模型 (RBAC)
// ========================
model SOVDResource {
  id     String @id @default(cuid())
  path   String @unique // 标准 SOVD 路径，如 "/apps/weather-app/data/*"
  // 绑定到 App 或 Component (可选)
  appId  String?
  compId String?
  app    SOVDApp?       @relation(fields: [appId], references: [id])
  comp   SOVDComponent? @relation(fields: [compId], references: [id])
}

model Permission {
  id         String @id @default(cuid())
  roleId     Role
  resourceId String
  resource   SOVDResource @relation(fields: [resourceId], references: [id])
  canRead    Boolean @default(true)
  canWrite   Boolean @default(false) // 对应 POST
  canDelete  Boolean @default(false)
  @@unique([roleId, resourceId])
}
```

---

## 4. 核心服务设计

### 4.1 SOVD Simulator 服务 (`/api/sim`)

> 提供一个**可配置**的、**标准兼容**的 SOVD 接口模拟器。

- **路由**：`/api/sim/{components|apps}/...` — 完全映射 **2.1 节接口列表**
- **功能**：
  - 从 `SOVDApp` / `SOVDComponent` 表加载元数据。
  - 根据请求路径和方法，动态返回模拟数据或执行模拟逻辑。
  - 支持 `include-schema` 参数，返回预定义的 JSON Schema。
  - 对 `POST /faults/{id}/confirm` 更新 `SOVDFault.active = false`。
  - 对 `DELETE` 操作清除故障码。
- **示例路由处理**：
  ```ts
  // GET /api/sim/apps/{aid}/data/{data-id}
  export async function GET(req: Request, { params }) {
    const { aid, 'data-id': dataId } = params;
    const dp = await prisma.sOVDDataPoint.findFirst({ 
      where: { appId: aid, dataId } 
    });
    if (!dp) return notFound();
    
    const includeSchema = req.nextUrl.searchParams.get('include-schema') === 'true';
    return Response.json({
      value: simulateValue(dp), // 模拟一个值
      ...(includeSchema && { schema: dp.schema })
    });
  }
  
  // POST /api/sim/apps/{aid}/faults/{fault-id}/confirm
  export async function POST(req: Request, { params }) {
    const { aid, 'fault-id': faultId } = params;
    await prisma.sOVDFault.updateMany({
      where: { appId: aid, faultId },
      data: { active: false }
    });
    return new Response(null, { status: 204 });
  }
  ```

### 4.2 SOVD Explorer 服务 (`/api/explore`)

> 作为 **Explorer 前端** 与 **任意 SOVD 服务（包括 Simulator 或真实车辆）** 之间的代理层，并执行权限检查。

- **路由**：`POST /api/explore/proxy`
- **请求体**：
  ```json
  {
    "targetUrl": "http://localhost:3000/api/sim", // 目标 SOVD 服务根地址
    "method": "GET",
    "path": "/apps/weather-app/data/outside-temperature",
    "params": { "include-schema": "true" },
    "headers": { ... }
  }
  ```
- **处理流程**：
  1. **权限校验**：根据 `path` 匹配 `SOVDResource`，检查当前用户角色是否有 `canRead/canWrite/canDelete`。
  2. **请求拼接**：`fullUrl = targetUrl + path + '?' + stringify(params)`
  3. **代理转发**：使用 `axios` 或 `fetch` 转发请求。
  4. **响应透传**：将原始响应（含状态码、头、体）返回给 Explorer 前端。

### 4.3 权限中间件（关键）

- **实现位置**：Next.js Middleware + API Route Guard
- **逻辑**：
  ```ts
  // middleware.ts
  export { default } from "next-auth/middleware";
  
  export const config = { matcher: ["/api/explore/:path*", "/admin/:path*"] };
  
  // 在 /api/explore/proxy 路由中
  const { user } = await getServerSession(authOptions);
  const resource = await prisma.sOVDResource.findFirst({
    where: {
      path: { 
        // 使用 Prisma 的模式匹配，如 "/apps/weather-app/data/*"
        startsWith: normalizePathToPermissionPattern(path) 
      }
    }
  });
  if (!hasPermission(user.role, resource, method)) {
    return new Response("Forbidden", { status: 403 });
  }
  ```

---

## 5. 平台架构图

```
+--------------------------------------------------+
|                 SOVD EXPLORER (Frontend)         |
| (Resource Tree, Request Console, Auth UI)        |
+--------------------------+-----------------------+
                           |
                           | (1. 发送请求)
                           v
+--------------------------+-----------------------+
|                 NEXT.JS APP ROUTER               |
|                                                  |
|  +--------------------+     +------------------+  |
|  | /api/explore/proxy |<--->| Auth & RBAC      |  |
|  +--------------------+     | Permission Check |  |
|                             +------------------+  |
|                                                  |
|  +--------------------+                           |
|  | /api/sim/...       |<-- SOVD Simulator Service |
|  +--------------------+    (标准接口实现)        |
+--------------------------+-----------------------+
                           |
                           | (2. 代理请求)
                           v
+--------------------------+-----------------------+
|        EXTERNAL SOVD SERVICE (可选)              |
| (Real Vehicle, 3rd-party Simulator)              |
+--------------------------------------------------+

+--------------------------+
|        DATABASE          |
| - Users, Roles           |
| - SOVD Apps/Components   |
| - SOVD Resource Metadata |
| - Permissions            |
+--------------------------+
```

---

## 6. 后续开发路线图建议

1.  **Phase 1: Simulator Core**
    - 实现 `SOVDApp` / `SOVDComponent` 管理界面（CRUD）。
    - 开发 `/api/sim` 路由，支持 `data`, `faults`, `operations` 的模拟。
    - 实现 `include-schema` 支持。

2.  **Phase 2: Explorer Core**
    - 开发资源树，动态加载 `/`、`/apps`、`/components`。
    - 实现请求控制台 + 代理接口 `/api/explore/proxy`。
    - 集成权限中间件。

3.  **Phase 3: 权限与管理**
    - 开发角色与权限配置界面。
    - 实现连接管理（保存多个 SOVD 服务地址）。

4.  **Phase 4: 高级功能**
    - 请求历史追踪。
    - 项目导入/导出（SOVD App 配置）。
    - WebSocket 实时数据推送（非 SOVD 标准，但实用）。

