# 后端 API 需求（第三轮）— 性能反模式彻底修复

> 前端代码审计发现以下问题，需要后端开发新接口/新字段来彻底解决。  
> **原则：能让后端做的，全部由后端来做，不在前端做任何 workaround。**

---

## 一、Git 仓库 — 关联 Playbook 数量（P1）

### 1. `GET /api/v1/git-repos` — 响应增加 `playbook_count` 字段

**当前问题**：前端为显示每个 Git 仓库关联的 Playbook 数量（表格 badge），需要一次性加载全部 Playbook，然后在前端用 `.filter(p => p.repository_id === repoId)` 计算。

**需求**：在 git-repos 列表响应的每个 repo 对象中，新增 `playbook_count` 字段：

```json
{
  ...repo,
  "playbook_count": 5  // 后端 COUNT subquery: SELECT COUNT(*) FROM playbooks WHERE repository_id = repo.id
}
```

> **注意**：删除保护（关联 Playbook 时禁止删除）后端已有实现，前端已改为直接展示后端错误。  
> 此需求仅为在列表展示中显示关联数量。

**工作量**：小（在 ListRepos 查询中增加一个 COUNT subquery 或 LEFT JOIN）

---

## 二、Git 仓库 — 详情关联 Playbook 列表（P2）

### 2. `GET /api/v1/playbooks?repository_id={id}` — 确认支持 repository_id 筛选

**当前问题**：Git 仓库详情 Drawer 中需要展示该仓库关联的 Playbook 列表（名称、路径等）。前端之前是从全量加载的 playbook 数组中 `.filter()` 过滤。

**需求**：确认 `GET /api/v1/playbooks` 接口支持 `repository_id` 查询参数：

```
GET /api/v1/playbooks?repository_id={uuid}&page_size=20
```

如果已支持，则只需前端改造。如果未支持，需后端添加此筛选参数。

**工作量**：小（可能已支持，需确认）

---

## 三、定时调度 — 时间轴数据接口（P1）

### 3. `GET /api/v1/execution-schedules/timeline` — 新建：时间轴可视化数据

**当前问题**：定时调度页面有一个 `ScheduleTimeline`（时间轴）可视化组件，当前为了画时间轴，需要 `getExecutionSchedules({ page_size: 100 })` 加载全部调度数据到前端。

**问题**：
1. 当调度超过 100 条时，时间轴数据不完整
2. 加载完整的调度对象（含 cron 表达式、变量配置等）属于过度加载，时间轴只需要少量字段

**需求**：新增一个轻量的时间轴专用接口：

```
请求：GET /api/v1/execution-schedules/timeline
参数：
  hours: int (默认 24) — 查看未来多少小时的调度执行计划

响应：
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "调度名称",
      "task_name": "关联的任务模板名称",
      "schedule_type": "cron",
      "enabled": true,
      "next_run_at": "2025-02-16T03:00:00Z",
      "last_run_at": "2025-02-16T02:00:00Z"
    }
  ]
}
```

如果实现太复杂，**最简方案**也可以是：让现有 `GET /api/v1/execution-schedules` 的列表接口支持只返回时间轴必要字段（`fields=id,name,task_name,schedule_type,enabled,next_run_at,last_run_at`），同时提供一个不分页的 `page_size=0` 模式（返回全部记录但只含指定字段），这样前端可以直接用。

**工作量**：中

---

## 四、角色管理 — 用户列表后端搜索（P2）

### 4. `GET /api/v1/users` — 支持搜索和大量用户场景

**当前问题**：角色编辑页面（`RoleForm.tsx`）的用户穿梭框（Transfer）需要展示所有用户，当前使用 `getUsers({ page_size: 1000 })` 加载。

**问题**：
1. 如果用户超过 1000 人，会丢失数据
2. 加载 1000 条用户对象浪费带宽

**需求**（满足其一即可）：

**方案 A**（推荐）：新增 `GET /api/v1/users/simple` 轻量用户列表接口
```json
{
  "data": [
    { "id": "uuid", "username": "admin", "display_name": "管理员" }
  ],
  "total": 50
}
```
> 只返回 id、username、display_name（和当前 roles），不返回其他字段。不分页，返回全部用户。

**方案 B**：在现有 `GET /api/v1/users` 接口支持 `page_size=0` 表示返回全部记录（适合用户少的情况）。

**工作量**：小

---

## 总结

| # | 接口 | 改动类型 | 优先级 | 工作量 |
|---|------|----------|--------|--------|
| 1 | `GET /api/v1/git-repos` | 响应增加 `playbook_count` | P1 | 小 |
| 2 | `GET /api/v1/playbooks` | 确认支持 `repository_id` 筛选 | P2 | 小 |
| 3 | `GET /api/v1/execution-schedules/timeline` | 新建时间轴专用接口 | P1 | 中 |
| 4 | `GET /api/v1/users/simple` | 新建轻量用户列表 | P2 | 小 |

后端开发完成后通知我，我会一次性完成前端对接。
