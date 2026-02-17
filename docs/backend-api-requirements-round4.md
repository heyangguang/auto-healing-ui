# 第四轮后端 API 需求：修复 Timeline API 过滤

## 问题

`GET /api/v1/execution-schedules/timeline` 当前实现 **没有任何时间范围过滤**，直接返回所有调度记录。

当前 SQL 等价于：
```sql
SELECT s.id, s.name, ... FROM execution_schedules AS s
LEFT JOIN execution_tasks t ON t.id = s.task_id
ORDER BY s.next_run_at ASC NULLS LAST
```

如果有 1 万条调度，就返回 1 万条。前端时间轴只展示今天的数据，其余全部浪费。

---

## 需求：加时间范围过滤

### 1. 新增参数 `date`（可选，默认今天）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `date` | string (YYYY-MM-DD) | 当天日期 | 要查看的日期 |
| `enabled` | bool | 不限 | 保留原有参数 |
| `schedule_type` | string | 不限 | 保留原有参数 |

### 2. 过滤逻辑

只返回在指定 `date` 当天有执行点的调度，SQL 条件如下：

```sql
WHERE (
    -- next_run_at 在当天
    (s.next_run_at >= '2026-02-16 00:00:00' AND s.next_run_at < '2026-02-17 00:00:00')
    OR
    -- last_run_at 在当天
    (s.last_run_at >= '2026-02-16 00:00:00' AND s.last_run_at < '2026-02-17 00:00:00')
)
```

### 3. 需要修改的文件

- `internal/handler/schedule_handler.go` → `GetTimeline`：解析 `date` 参数，默认 `time.Now()`，传给 service
- `internal/service/schedule/service.go` → `ListTimeline`：透传
- `internal/repository/schedule.go` → `ListTimeline`：加 WHERE 时间范围条件

### 4. 对于 Cron 任务的补充

> Cron 任务一天可能执行多次（如 `*/30 * * * *` 每 30 分钟一次），但数据库只存一个 `next_run_at`。
> 
> **后端只需要返回 `next_run_at` 或 `last_run_at` 在当天的记录就够了**，多次执行点的推算由前端根据 `schedule_expr` 完成。

### 5. 预期响应（不变）

```json
{
  "code": 0,
  "data": [
    {
      "id": "xxx",
      "name": "性能监控采集",
      "schedule_type": "cron",
      "schedule_expr": "30 * * * *",
      "status": "running",
      "enabled": true,
      "next_run_at": "2026-02-16T02:30:00+08:00",
      "last_run_at": "2026-02-16T01:30:17+08:00",
      "task_id": "xxx",
      "task_name": "预发布环境-配置更新-任务98"
    }
  ]
}
```

### 6. 验证命令

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | jq -r '.access_token')

# 默认查今天
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/execution-schedules/timeline" | jq '.data | length'

# 指定日期
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/execution-schedules/timeline?date=2026-02-16" | jq '.data | length'

# 应该只返回 next_run_at 或 last_run_at 在该日期的记录
# 而不是返回所有 11 条
```
