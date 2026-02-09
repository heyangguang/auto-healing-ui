# CMDB 维护模式功能更新日志

**日期**: 2026-01-07  
**版本**: v1.5.0

---

## 概述

简化 CMDB 状态管理，引入维护模式功能，支持定时自动恢复和维护日志记录。

---

## 状态字段变更

### 删除的字段
| 字段 | 说明 |
|------|------|
| `manual_disabled` | 已删除 |
| `manual_disabled_reason` | 已删除 |
| `manual_disabled_at` | 已删除 |

### 新增的字段
| 字段 | 类型 | 说明 |
|------|------|------|
| `maintenance_reason` | string | 维护原因 |
| `maintenance_start_at` | datetime | 维护开始时间 |
| `maintenance_end_at` | datetime | 维护结束时间（到期自动恢复） |

### 状态值变更
| 旧状态 | 新状态 | 说明 |
|--------|--------|------|
| `active` | `active` | ✅ 保留 |
| `inactive` | ❌ 已删除 | 不再使用 |
| `maintenance` | `maintenance` | ✅ 保留 |
| - | `offline` | 🆕 新增（来自 CMDB 同步） |

---

## API 变更

### 删除的接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/cmdb/{id}/disable` | 已删除 |
| POST | `/cmdb/{id}/enable` | 已删除 |
| POST | `/cmdb/batch-disable` | 已删除 |
| POST | `/cmdb/batch-enable` | 已删除 |

### 新增的接口

#### 进入维护模式
```
POST /api/v1/cmdb/{id}/maintenance
```
**请求体**：
```json
{
  "reason": "系统升级",
  "end_at": "2026-01-08T18:00:00+08:00"
}
```

#### 退出维护模式
```
POST /api/v1/cmdb/{id}/resume
```

#### 获取维护日志
```
GET /api/v1/cmdb/{id}/maintenance-logs?page=1&page_size=20
```
**响应**：
```json
{
  "data": [
    {
      "id": "uuid",
      "cmdb_item_id": "uuid",
      "cmdb_item_name": "server-001",
      "action": "enter",
      "reason": "系统升级",
      "scheduled_end_at": "2026-01-08T18:00:00+08:00",
      "actual_end_at": null,
      "exit_type": null,
      "operator": "admin",
      "created_at": "2026-01-07T10:00:00+08:00"
    }
  ],
  "total": 1
}
```

#### 批量进入维护
```
POST /api/v1/cmdb/batch/maintenance
```
**请求体**：
```json
{
  "ids": ["uuid1", "uuid2"],
  "reason": "批量维护",
  "end_at": "2026-01-08T18:00:00+08:00"
}
```

#### 批量退出维护
```
POST /api/v1/cmdb/batch/resume
```
**请求体**：
```json
{
  "ids": ["uuid1", "uuid2"]
}
```

---

## 统计接口变更

### `GET /api/v1/cmdb/stats` 响应变更

| 旧字段 | 新字段 |
|--------|--------|
| `manual_disabled_count` | `maintenance_count` |

---

## 前端需要的改动

1. **状态下拉框**：移除 `inactive`，只保留 `active`, `offline`, `maintenance`
2. **操作按钮**：
   - "禁用" → "进入维护"
   - "启用" → "恢复正常"
3. **维护模式表单**：需要填写 `reason`（原因）和 `end_at`（结束时间）
4. **维护日志页面**：新增查看维护历史记录功能
5. **统计卡片**：`manual_disabled_count` → `maintenance_count`

---

## 数据库迁移

迁移文件：`migrations/013_cmdb_maintenance_mode.up.sql`

迁移内容：
- 删除 `manual_disabled` 相关字段
- 添加 `maintenance_*` 字段
- 创建 `cmdb_maintenance_logs` 表
