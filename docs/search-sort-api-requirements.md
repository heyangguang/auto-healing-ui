# 搜索/排序/筛选 API 需求文档

> 前端对 **任务模板** 和 **定时任务** 接口的搜索、排序、高级筛选需求。

---

## 一、任务模板 `GET /api/v1/execution-tasks`

> ✅ **后端已全部支持，无需改动。**

| 参数 | 类型 | 说明 | 验证状态 |
|------|------|------|----------|
| `search` | string | 模糊搜索（name / description / playbook.name） | ✅ 已验证 |
| `executor_type` | string | `local` / `docker` | ✅ 已验证 |
| `needs_review` | bool | 是否需要审核 | ✅ 已验证 |
| `playbook_id` | uuid | Playbook ID 精确匹配 | ✅ 已验证 |
| `playbook_name` | string | Playbook 名称模糊匹配 | ✅ 已验证 |
| `repository_name` | string | Git 仓库名称模糊匹配 | ✅ 已验证 |
| `target_hosts` | string | 目标主机模糊匹配 | ✅ 已验证 |
| `created_from` | RFC3339 | 创建时间起始 | ✅ 已验证 |
| `created_to` | RFC3339 | 创建时间结束 | ✅ 已验证 |
| `sort_by` | string | 排序字段：`name` / `created_at` / `updated_at` | ✅ 已验证 |
| `sort_order` | string | 排序方向：`asc` / `desc` | ✅ 已验证 |
| `has_runs` | bool | 是否有执行记录 | ✅ 已验证 |
| `min_run_count` | int | 最小执行次数 | ✅ 已验证 |
| `last_run_status` | string | 最后执行状态筛选 | ✅ 已验证 |

---

## 二、定时任务 `GET /api/v1/execution-schedules`

### 已支持的参数

| 参数 | 类型 | 说明 | 验证状态 |
|------|------|------|----------|
| `search` | string | 模糊搜索（name / description） | ✅ 已验证 |
| `task_id` | uuid | 关联任务模板 ID | ✅ 已验证 |
| `enabled` | bool | 启用/禁用状态 | ✅ 已验证 |
| `schedule_type` | string | `cron` / `once` | ✅ 已验证 |
| `status` | string | 状态筛选 | ✅ 已验证 |

### ❌ 需要后端新增的参数

| # | 参数 | 类型 | 说明 |
|---|------|------|------|
| 1 | `sort_by` | string | 排序字段，需支持：`name` / `created_at` / `next_run_at` / `last_run_at` |
| 2 | `sort_order` | string | 排序方向：`asc` / `desc`（默认 `desc`） |
| 3 | `name` | string | 名称模糊匹配（ILIKE） |
| 4 | `created_from` | RFC3339 | 创建时间范围起始 |
| 5 | `created_to` | RFC3339 | 创建时间范围结束 |
| 6 | `skip_notification` | bool | 是否跳过通知 |
| 7 | `has_overrides` | bool | 是否有执行覆盖参数（主机/变量/密钥源任一不为空） |

### 期望行为说明

- **排序**：当前排序硬编码为 `created_at DESC`，需改为可通过 `sort_by` + `sort_order` 参数控制
- **name**：与 `search` 不同，`name` 只匹配调度名称，`search` 同时匹配名称和描述
- **has_overrides=true**：返回 `target_hosts_override` 非空 **或** `extra_vars_override` 非空 **或** `secrets_source_ids` 非空的记录
- **has_overrides=false**：返回以上三个字段全部为空的记录
