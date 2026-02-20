# 站内信 API 文档

**路径前缀**: `/api/v1/site-messages`  
**权限**: 已登录用户

---

## 1. 获取未读消息数

**GET** `/api/v1/site-messages/unread-count`

**权限**: 无特殊要求（已登录即可）

### 响应

```json
{
  "code": 0,
  "data": {
    "unread_count": 5
  }
}
```

---

## 2. 获取消息分类列表

**GET** `/api/v1/site-messages/categories`

**权限**: 无特殊要求

返回所有可用的消息分类枚举值。

---

## 3. 获取消息接收设置

**GET** `/api/v1/site-messages/settings`

**权限**: 无特殊要求

### 响应

```json
{
  "code": 0,
  "data": {
    "retention_days": 90,
    "updated_at": "2026-02-18T10:00:00Z"
  }
}
```

---

## 4. 更新消息接收设置

**PUT** `/api/v1/site-messages/settings`

**权限**: `site-message:create`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `retention_days` | int | ✅ | 消息保留天数（1-3650） |

---

## 5. 标记消息为已读

**PUT** `/api/v1/site-messages/read`

**权限**: 无特殊要求

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | []uuid | ✅ | 消息 ID 列表 |

---

## 6. 标记所有消息为已读

**PUT** `/api/v1/site-messages/read-all`

**权限**: 无特殊要求

---

## 7. 获取消息列表

**GET** `/api/v1/site-messages`

**权限**: 无特殊要求

### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | int | ❌ | 页码，默认 1 |
| `page_size` | int | ❌ | 每页数量，默认 10，最大 100 |
| `keyword` | string | ❌ | 模糊搜索（标题、内容） |
| `category` | string | ❌ | 消息分类（见分类枚举） |

### 响应

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "执行任务成功",
        "content": "任务「磁盘清理」执行成功",
        "category": "execution",
        "is_read": false,
        "link": "/execution-runs/uuid",
        "created_at": "2026-02-18T09:00:00Z"
      }
    ],
    "total": 10,
    "page": 1,
    "page_size": 20
  }
}
```

---

## 8. 创建消息（管理员）

**POST** `/api/v1/site-messages`

**权限**: `site-message:create`

### 请求体

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | ✅ | 分类（见分类枚举） |
| `title` | string | ✅ | 消息标题 |
| `content` | string | ✅ | 消息内容（支持 HTML 富文本） |
| `target_tenant_ids` | []string | ❌ | 目标租户 ID 列表。为空或不传 = 全部租户广播 |

### 响应

同单条消息结构。指定多个租户时返回创建数量：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "created_count": 3
  }
}
```

---

## 消息分类枚举

| 分类 | 说明 |
|------|------|
| `system_update` | 系统更新 |
| `fault_alert` | 故障通知 |
| `service_notice` | 服务消息 |
| `product_news` | 产品消息 |
| `activity` | 活动通知 |
| `security` | 安全公告 |

---

## 🔧 后端待改需求：支持发送目标租户选择

### 现状分析

- **Model 层**：`SiteMessage` 已有 `TargetTenantID *uuid.UUID` 字段（NULL = 全局广播）✅
- **Repository 层**：`List` / `GetUnreadCount` 查询已正确按 `target_tenant_id` 过滤 ✅
- **Handler 层**：`createSiteMessageRequest` **缺少** `target_tenant_ids` 字段 ❌
- **Handler 层**：`CreateMessage` 创建消息时**未设置** `TargetTenantID` ❌

### 需要修改的文件

#### 1. `internal/handler/site_message_handler.go`

**修改 `createSiteMessageRequest`** — 增加可选字段：

```go
type createSiteMessageRequest struct {
    Category        string   `json:"category" binding:"required"`
    Title           string   `json:"title" binding:"required"`
    Content         string   `json:"content" binding:"required"`
    TargetTenantIDs []string `json:"target_tenant_ids"` // 可选，为空=全局广播
}
```

**修改 `CreateMessage` 方法** — 逻辑如下：

```
if target_tenant_ids 为空:
    创建 1 条消息，target_tenant_id = NULL（全局广播，现有行为不变）
else:
    验证每个 tenant_id 是 valid UUID
    为每个 tenant_id 创建 1 条消息，target_tenant_id = 对应值
    建议在同一个事务中批量创建
    返回 { "created_count": N }
```

#### 2. 关键提示

- 每条消息仍然是一行记录，一个 `target_tenant_id`，不是数组字段
- 发给 3 个租户 = 插入 3 条记录（相同 title/content/category，不同 target_tenant_id）
- 全局广播 = 1 条记录，`target_tenant_id = NULL`
- 建议验证传入的 tenant_id 是否真实存在（可选）
