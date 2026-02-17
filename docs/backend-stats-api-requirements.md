# 后端统计聚合接口需求

> 前端审计发现所有统计数字都在前端用 `.filter().length` 计算，受限于 `page_size` 截断，导致统计数据不准确。
> 需要后端提供以下聚合接口，前端改为直接调用。

---

## 1. `GET /api/v1/playbooks/stats`

**用途**: Playbook 管理页顶部统计栏

**返回格式**:
```json
{
  "total": 150,
  "by_status": {
    "ready": 120,
    "pending": 10,
    "scanned": 8,
    "error": 7,
    "invalid": 5
  }
}
```

---

## 2. `GET /api/v1/secrets-sources/stats`

**用途**: 密钥源管理页顶部统计栏

**返回格式**:
```json
{
  "total": 50,
  "by_status": {
    "active": 35,
    "inactive": 10,
    "error": 5
  },
  "by_type": {
    "file": 20,
    "vault": 15,
    "webhook": 10,
    "env": 5
  }
}
```

---

## 3. `GET /api/v1/git-repos/stats`

**用途**: Git 仓库管理页顶部统计栏

**返回格式**:
```json
{
  "total": 80,
  "by_status": {
    "ready": 60,
    "pending": 12,
    "error": 8
  }
}
```

---

## 4. `GET /api/v1/execution-schedules/stats`

**用途**: 定时调度页顶部统计栏

**返回格式**:
```json
{
  "total": 200,
  "enabled": 150,
  "disabled": 50,
  "by_schedule_type": {
    "cron": 120,
    "once": 80
  }
}
```

---

## 5. `GET /api/v1/notifications/stats`

**用途**: 通知记录页顶部统计栏

**返回格式**:
```json
{
  "total": 5000,
  "by_status": {
    "sent": 4500,
    "failed": 300,
    "pending": 200
  }
}
```

---

## 6. `GET /api/v1/healing/flows/stats`

**用途**: Dashboard 活跃流程数 widget

**返回格式**:
```json
{
  "total": 30,
  "active": 22,
  "inactive": 8
}
```

---

## 7. `GET /api/v1/healing/rules/stats`

**用途**: Dashboard 活跃规则数 widget

**返回格式**:
```json
{
  "total": 45,
  "active": 38,
  "inactive": 7
}
```

---

## 8. `GET /api/v1/healing/instances/stats`

**用途**: Dashboard 实例状态饼图

**返回格式**:
```json
{
  "total": 1200,
  "by_status": {
    "running": 5,
    "success": 900,
    "failed": 200,
    "pending": 50,
    "skipped": 45
  }
}
```

---

## 实现说明

- 全部是 **SELECT COUNT(*) ... GROUP BY** 查询，不需要返回具体数据行
- 不需要分页参数
- 返回 JSON 即可，无需复杂结构
- 已有参考实现：`GET /api/v1/cmdb/stats`（CMDB 统计）和 `GET /api/v1/execution-runs/stats`（执行统计）
- 优先级：1-5 是 P0（页面统计栏直接用），6-8 是 P1（Dashboard 用）
