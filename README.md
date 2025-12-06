# ASAM SOVD Explorer & Simulator 平台设计文档 

## 1. 产品概述与核心价值

**产品名称：** SOVD Explorer & Simulator Platform **产品定位：** 一款面向汽车软件开发、测试与诊断工程师的专业平台。它包含一个 **SOVD Explorer（客户端）** 用于交互调试，以及一个 **SOVD Simulator（服务端）** 用于模拟 SOVD 组件。 **核心价值：**

- **SOVD 标准模型精准映射：** 完整支持并可视化 ASAM SOVD V1.0 定义的资源层级、关系与操作。
- **企业级权限管控 (RBAC)：** 实现细粒度的访问控制，将权限直接绑定到 SOVD 资源路径上。
- **高效调试能力：** 提供直观的 UI、动态请求构建、SOVD 特定参数支持以及详细的请求/响应日志。
- **标准化交互：** 严格遵循 SOVD 的 HTTP 方法语义与资源路径规范，确保交互行为合规。

## 2. ASAM SOVD 1.0 核心接口与资源模型

SOVD 定义了一套基于 **RESTful HTTP** 的车辆诊断服务接口。所有操作都通过标准的 HTTP 方法在严格层次结构的资源上执行。

### 2.1 核心资源层级结构 (URI 路径)

SOVD 的 URI 路径结构具有严格的层次关系：`/{components|apps}/{identifier}/{resource-type}/{sub-resource}?`

| **资源层级**    | **路径模式**                    | **资源说明**                                             |
| --------------- | ------------------------------- | -------------------------------------------------------- |
| **Component**   | `/components/{component-id}`    | 物理或逻辑组件（如 `abs`, `ecu`）。                      |
| **Application** | `/apps/{app-id}`                | 运行在车辆上或外部的 SOVD 应用（如 `diagnostic-tool`）。 |
| **Data**        | `.../{id}/data/{data-id}`       | 读取或写入单个数据点的值。                               |
| **Data Lists**  | `.../{id}/data-lists/{list-id}` | 批量读取一组相关的数据点。                               |
| **Faults**      | `.../{id}/faults`               | 查询、确认或重置诊断故障码 (DTC)。                       |
| **Operations**  | `.../{id}/operations/{op-id}`   | 触发车辆执行一个特定的动作或服务。                       |
| **Locks**       | `.../{id}/locks`                | 用于组件锁定的原子操作。                                 |

### 2.2 标准 HTTP 操作语义

| **资源类型**              | **GET**       | **POST**                                | **DELETE**       |
| ------------------------- | ------------- | --------------------------------------- | ---------------- |
| **`/data/{id}`**          | 读取值/元数据 | **写入值**                              | —                |
| **`/data-lists/{id}`**    | 读取列表      | —                                       | —                |
| **`/faults` (集合)**      | 查询所有 DTC  | —                                       | **清除所有 DTC** |
| **`/faults/{id}` (单个)** | 查询单个 DTC  | **确认 DTC** (`/confirm` 子路径或 Body) | **清除单个 DTC** |
| **`/operations/{id}`**    | 获取操作描述  | **执行操作**                            | —                |

**SOVD 查询参数与 Header：**

- **`include-schema` (GET):** 请求响应中包含数据的 JSON Schema 元信息（描述数据类型、单位、范围等）。
- **`status[key]` (GET, 仅 /faults):** 按故障状态属性过滤，支持多值 OR 组合。支持的键由实体的能力描述定义。

## 3. 系统架构与统一技术栈

### 3.1 架构概览

平台采用 Node.js 作为统一的后端运行时，将代理、认证和模拟器功能集成到单个服务中，实现全栈 TypeScript 开发。

| **模块**                   | **技术栈**                              | **职责 (SOVD 关联)**                                         |
| -------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| **前端 (Explorer)**        | React (JSX) + Tailwind CSS              | **Discovery 接口发起者**，UI 渲染，数据可视化。              |
| **后端 (Proxy/Simulator)** | **Node.js/TypeScript (NestJS/Express)** | **SOVD Server/Component 模拟**，权限/数据格式校验，请求代理。 |
| **认证 (AuthN)**           | Firebase Auth/JWT                       | 颁发带有 `SOVD Role` 声明 (Claim) 的 JWT。                   |
| **数据/模型**              | **MySQL** + Prisma ORM                  | 存储用户、权限、以及 SOVD 组件的元数据和模拟状态。           |

### 3.2 服务路由设计

| **服务**               | **路由前缀**              | **功能描述**                                         |
| ---------------------- | ------------------------- | ---------------------------------------------------- |
| **SOVD Simulator API** | `/api/sim`                | 完全遵循 SOVD V1.0 路径的模拟接口，用于测试。        |
| **Explorer Proxy**     | `POST /api/explore/proxy` | 客户端到 SOVD 服务的转发代理，**强制执行权限检查**。 |
| **Auth API**           | `/api/auth`               | 登录、注册、JWT 颁发。                               |

## 4. 核心功能模块 (Explorer 客户端) 详细设计

### 4.1 结构化导航 (SOVD Tree)

- **资源树动态构建：** 严格遵循 `components/apps -> identifier -> resource-type -> sub-resource` 四层结构。通过调用 Discovery 接口 (`/components`, `/apps`) 动态加载。
- **节点类型识别与标签：** 系统能够根据路径自动识别节点类型 (`Component`, `App`, `Data`, `Fault` 等)，并使用不同的图标和标签进行区分。
- **方法按钮智能显示：**
    - 方法按钮（GET/POST/DELETE）根据所选资源的 SOVD 标准操作语义**动态限定**并显示。
    - **语义化操作：** 将生硬的 `POST` 按钮，在 `faults` 节点上显示为「确认」，在 `operations` 节点上显示为「执行」，提升可读性。
- **权限过滤 (AuthZ):** 根据用户角色，前端隐藏或禁用无权执行操作的方法按钮，例如 `Viewer` 无法看到任何 `POST/DELETE` 按钮。
- **状态指示 (SOVD V1.0):** 在树节点旁显示故障状态、资源锁定状态等。

### 4.2 API 请求控制台

- **请求构建器：**
    - **路径栏：** 显示符合 SOVD 规范的完整路径，支持手动编辑。
    - **方法选择器：** 根据所选资源类型动态限定可选的 HTTP 方法。
    - **动态参数面板：** 提供专门输入框用于 **SOVD 标准查询参数** (`include-schema`, `timerange` 等) 及通用的 K-V 表格。
    - **Body 编辑器：** 对于 `POST` 请求，提供 JSON/YAML 格式编辑器，或根据 Schema 自动生成结构化输入表单。

### 4.3 API 响应展示与分析

- **响应状态与性能：** 突出显示 HTTP 状态码，并显示响应时间 (Duration) 和内容大小。
- **SOVD 状态解析：** 突出显示响应体中 SOVD 特定的错误代码或状态对象。
- **数据分析视图：**
    - **结构化表格：** 针对 `/faults`, `/events` 响应，提供表格视图。
    - **Schema 高亮：** 当 `include-schema=true` 时，UI 应能**分离并高亮显示** Schema 部分与数据值部分。

### 4.4 Simulator 控制台功能

此功能用于对 Simulator 状态进行配置和测试。

| **功能**          | **路径/方法**        | **权限**        | **描述**                                     |
| ----------------- | -------------------- | --------------- | -------------------------------------------- |
| **故障注入**      | `POST .../faults`    | Developer/Admin | 允许模拟器产生特定的故障码。                 |
| **故障清除**      | `DELETE .../faults`  | Developer/Admin | 一键清除所有或单个故障码。                   |
| **资源锁定/解锁** | `POST/DELETE /locks` | Admin           | 允许管理员锁定组件，以确保配置修改的原子性。 |

## 5. 权限管理 (Authorization) - 基于资源路径的 RBAC 细化

权限粒度精确到 SOVD 的资源路径和 HTTP 方法上。

### 5.1 角色定义

| **角色 (Role)**        | **描述 (SOVD 语境)**                                 | **权限等级** | **允许的 SOVD 操作**                                         |
| ---------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| **Viewer** (观察者)    | 仅可浏览数据和状态。                                 | Read-Only    | **GET** (所有数据、状态、故障路径)                           |
| **Developer** (开发者) | 可读写配置、管理故障、执行非破坏性操作。             | Read/Write   | **GET, POST** (写入数据, 故障注入, 执行操作), **DELETE** (清除故障) |
| **Admin** (管理员)     | 完全控制，包括组件锁定、Simulator 管理和破坏性操作。 | Full Control | 所有 HTTP 方法 (包括 `/admin/*`, `/locks`, 涉及破坏性操作的 DELETE) |

### 5.2 权限校验流程 (服务端)

1. **JWT 解析：** 后端服务解析用户 JWT，获取 `Role` (如 `VIEWER`)。
2. **路径匹配：** 将请求路径 (`/apps/weather-app/data/temp`) 与 `SOVDResource` 路径模式 (`/apps/*/data/*`) 进行匹配。
3. **权限检查：** 检查用户 `Role` 在匹配到的 `SOVDResource` 上是否拥有执行对应 `HTTP Method` 的权限：
    - `GET` 必须有 `canRead=true`。
    - `POST/PUT` 必须有 `canWrite=true`。
    - `DELETE` 必须有 `canDelete=true`。
4. **授权决策：** 若无权限，返回 `HTTP 403 Forbidden` 并终止请求处理。

## 6. 后续开发路线图建议 (细化)

该路线图将平台开发划分为三个主要阶段，每个阶段都交付可用的核心功能。

| **阶段**            | **里程碑目标**                                               | **核心任务列表 (Key Tasks)**                                 |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Phase 1**         | **核心 SOVD Simulator 与认证就绪**                           | **Backend (Node.js/TS)**                                     |
| **(基础架构)**      | 建立平台基础架构，实现用户认证，并完成 SOVD 元数据和基本 `/data` 模拟。 | 1. 数据库模型 (Prisma) 初始化：User, Role, Permission, SOVDComponent/App。 |
|                     |                                                              | 2. Auth API 实现：登录/注册，JWT 颁发（包含 Role Claim）。   |
|                     |                                                              | 3. Simulator 核心：`/api/sim/components` 和 `/api/sim/apps` Discovery 接口实现。 |
|                     |                                                              | 4. 基础数据接口：实现 `/api/sim/.../data/{id}` 的 **GET/POST** 模拟。 |
| **Phase 2**         | **SOVD Explorer 核心交互与 RBAC 集成**                       | **Frontend (React) & Proxy (Node.js)**                       |
| **(核心 Explorer)** | 实现客户端的主体 UI，完成资源树动态加载、请求发送和权限验证。 | 1. 客户端 Auth 流程：接入 Firebase/JWT，管理用户状态。       |
|                     |                                                              | 2. 资源树组件：实现树形结构动态渲染 Discovery 数据，并基于 Role 进行 UI 过滤。 |
|                     |                                                              | 3. Explorer Proxy：实现 `POST /api/explore/proxy`，完成请求转发和 JWT Token 注入。 |
|                     |                                                              | 4. **RBAC 中间件集成：** 在 Proxy 层实现 5.2 节定义的权限校验流程。 |
|                     |                                                              | 5. 请求/响应控制台：实现基础的路径选择、参数构建和格式化响应展示。 |
| **Phase 3**         | **高级 SOVD 功能、可视化与管理**                             | **Full Stack (Enhancement)**                                 |
| **(高级功能)**      | 完善所有 SOVD 资源类型支持，并提供强大的可视化调试工具。     | 1. 完整 Simulator 接口：实现 `/faults`, `/operations`, `/locks` 的模拟逻辑。 |
|                     |                                                              | 2. 数据可视化：实现 `/data` 的**时序数据折线图**和实时更新（Polling/WebSocket 模拟）。 |
|                     |                                                              | 3. 故障/事件视图：实现 `/faults` 和 `/events` 响应的结构化表格展示。 |
|                     |                                                              | 4. 管理界面：开发**角色与权限配置界面** (Admin UI)，支持路径模式的权限分配。 |
|                     |                                                              | 5. 调试增强：实现对 `include-schema=true` 响应的 Schema/Data 分离高亮显示。 |


# 7. 注意事项

### 数据库连接信息

```bash
mysql: localhost:3306  
database: sovd_simulation
user: root
password: 123456
```