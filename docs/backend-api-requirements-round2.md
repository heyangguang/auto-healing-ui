# 后端 API 需求（第二轮）— 前端反模式改造

> 前端审计发现以下反模式需要后端配合改造。按优先级排列。

---

## 一、搜索接口增强（P1 — 4 个接口）

以下接口已有分页，但前端搜索靠 `.filter()` 过滤当前页数据，**结果不准确**。需要后端添加 `search` 查询参数。

### 1. `GET /api/v1/healing/flows` — 添加 `search` 参数

```
新增参数：
  search: string  — 模糊搜索 name, description 字段（ILIKE '%search%'）
```

### 2. `GET /api/v1/healing/rules` — 添加 `search` 参数

```
新增参数：
  search: string  — 模糊搜索 name, description 字段
```

### 3. `GET /api/v1/notification/channels` — 添加 `search` 参数

```
新增参数：
  search: string  — 模糊搜索 name, description 字段
```

### 4. `GET /api/v1/healing/instances` — 添加 `search` 参数

```
新增参数：
  search: string  — 模糊搜索以下关联字段：
    - instance.id（前缀匹配）
    - flow.name（ILIKE）
    - rule.name（ILIKE）
    - incident.title（ILIKE）
  需要 LEFT JOIN flows, rules, incidents 表
```

---

## 二、全选优化（P0 — 1 个接口）

### 5. `GET /api/v1/cmdb/items/ids` — 新建：仅返回 ID 列表

当前前端"全选所有"功能调用 `getCMDBItems({ page_size: 9999 })` 加载全部资产完整数据。

```
请求：GET /api/v1/cmdb/items/ids
参数：与 /api/v1/cmdb/items 共享相同的筛选参数（status, search 等）
响应：
{
  "code": 0,
  "data": {
    "ids": ["uuid1", "uuid2", ...],
    "total": 1234
  }
}
```

> 只返回 ID + 基础字段（id, hostname, ip, status），不返回 tags、metadata 等大字段。

---

## 三、定时任务关联优化（P0 — 后端 JOIN）

### 6. `GET /api/v1/execution-tasks` — 响应增加 `schedule_count` 字段

当前前端为了在任务模板列表显示关联的定时任务数量，会 `getExecutionSchedules({ page_size: 500 })` 全量加载定时任务后在前端计算。

```
在 execution-tasks 列表响应的每个 task 对象中，新增：
{
  ...task,
  "schedule_count": 3  // 关联的定时任务数量（后端 COUNT subquery）
}
```

> 这样前端不再需要加载全部 schedules 来计算关联数量。

---

## 总结

| # | 接口 | 改动类型 | 工作量 |
|---|------|----------|--------|
| 1 | `GET /api/v1/healing/flows` | 添加 `search` 参数 | 小 |
| 2 | `GET /api/v1/healing/rules` | 添加 `search` 参数 | 小 |
| 3 | `GET /api/v1/notification/channels` | 添加 `search` 参数 | 小 |
| 4 | `GET /api/v1/healing/instances` | 添加 `search`（需 JOIN） | 中 |
| 5 | `GET /api/v1/cmdb/items/ids` | 新建轻量 ID 列表接口 | 小 |
| 6 | `GET /api/v1/execution-tasks` | 响应增加 `schedule_count` | 中 |

后端开发完以上 6 项后通知我，我一次性把前端全部改完。
