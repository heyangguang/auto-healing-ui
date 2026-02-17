# 自愈实例列表 API 增强需求


经过实际 curl 测试，当前后端 GET /api/v1/healing/instances 只支持：

page / page_size — 分页
search — 模糊搜索（流程名/规则名）
status — 状态过滤

## 当前已支持参数

| 参数 | 类型 | 说明 | 状态 |
|------|------|------|------|
| `page` | int | 页码 | ✅ |
| `page_size` | int | 每页条数 | ✅ |
| `search` | string | 模糊搜索(流程名/规则名/事件标题) | ✅ |
| `status` | string | 状态过滤 | ✅ |

## 需要后端新增的参数

### 1. 排序支持

| 参数 | 类型 | 说明 |
|------|------|------|
| `sort_by` | string | 排序字段，支持值：`created_at`, `started_at`, `completed_at`, `status`, `flow_name`, `rule_name` |
| `sort_order` | string | `asc` / `desc`，默认 `desc` |

### 2. 精确过滤

| 参数 | 类型 | 说明 |
|------|------|------|
| `flow_id` | string(uuid) | 按流程 ID 精确筛选 |
| `flow_name` | string | 按流程名称模糊搜索 |
| `rule_id` | string(uuid) | 按规则 ID 精确筛选 |
| `rule_name` | string | 按规则名称模糊搜索 |
| `incident_id` | string | 按工单 ID 精确筛选 |
| `incident_title` | string | 按工单标题模糊搜索 |
| `current_node_id` | string | 按当前节点 ID 筛选 |
| `error_message` | string | 按错误信息模糊搜索 |
| `has_error` | bool | 是否有错误信息（`error_message IS NOT NULL AND error_message != ''`） |

### 3. 时间范围过滤

| 参数 | 类型 | 说明 |
|------|------|------|
| `created_from` | string(ISO8601) | 创建时间起始 |
| `created_to` | string(ISO8601) | 创建时间截止 |
| `started_from` | string(ISO8601) | 开始执行时间起始 |
| `started_to` | string(ISO8601) | 开始执行时间截止 |
| `completed_from` | string(ISO8601) | 完成时间起始 |
| `completed_to` | string(ISO8601) | 完成时间截止 |

### 4. 数量范围过滤

| 参数 | 类型 | 说明 |
|------|------|------|
| `min_nodes` | int | 节点总数下限 |
| `max_nodes` | int | 节点总数上限 |
| `min_failed_nodes` | int | 失败节点数下限 |
| `max_failed_nodes` | int | 失败节点数上限 |

## 响应格式（保持不变）

```json
{
  "code": 0,
  "message": "success",
  "data": [...],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

## 前端搜索字段规划

### 快速搜索栏（searchFields）
1. **搜索** — `search` 全文模糊搜索
2. **状态** — `status` 下拉选项
3. **流程名称** — `flow_name` 精确搜索
4. **规则名称** — `rule_name` 精确搜索
5. **有异常** — `has_error` 快速筛选

### 高级搜索面板（advancedSearchFields）
1. **流程名称** — text（模糊搜索）
2. **规则名称** — text（模糊搜索）
3. **工单标题** — text（模糊搜索）
4. **错误信息** — text（模糊搜索）
5. **创建时间** — dateRange
6. **开始时间** — dateRange
7. **完成时间** — dateRange
8. **节点数量** — select（少量/中等/大量）
9. **失败节点数** — select（无/少量/大量）

### 排序选项（SortToolbar）
1. 创建时间（默认）
2. 开始时间
3. 完成时间
4. 流程名称
5. 规则名称
