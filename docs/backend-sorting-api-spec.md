# 后端 API 排序 + 搜索增强需求

> 前端表格需要后端支持排序（`sort_by` / `sort_order`）和搜索（`search`），涉及 **Incidents** 和 **Plugins** 两个模块。Secrets 模块数据量小，前端已自行处理，暂不需要后端改动。

---

## 一、参考样板

项目中已有标准实现，请参照 `internal/repository/audit_log.go:140-156`：

```go
sortBy := "created_at"
sortOrder := "DESC"
allowedSortFields := map[string]bool{
    "created_at": true,
    "name":       true,
}
if opts.SortBy != "" && allowedSortFields[opts.SortBy] {
    sortBy = opts.SortBy
}
if opts.SortOrder == "asc" || opts.SortOrder == "ASC" {
    sortOrder = "ASC"
}
query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))
```

**核心要求：** 用 `allowedSortFields` 白名单校验，防止 SQL 注入。

---

## 二、Incidents（工单）— 优先级高

### 2.1 新增 Query 参数

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `sort_by` | string | 排序字段，默认 `created_at` | `sort_by=severity` |
| `sort_order` | string | `asc` 或 `desc`，默认 `desc` | `sort_order=asc` |

### 2.2 允许的 sort_by 字段

```
title, severity, status, healing_status, category, assignee, external_id, source_plugin_name, created_at, updated_at
```

### 2.3 需要改的文件

#### Handler — `internal/handler/plugin_handler.go` → `ListIncidents`

解析两个新参数，传给 service：

```go
// 在 search := c.Query("search") 之后添加
sortBy := c.Query("sort_by")
sortOrder := c.Query("sort_order")
```

调用签名加两个参数：

```go
// 原来
h.incidentSvc.ListIncidents(ctx, page, pageSize, pluginID, status, healingStatus, severity, sourcePluginName, search, hasPlugin)
// 改为
h.incidentSvc.ListIncidents(ctx, page, pageSize, pluginID, status, healingStatus, severity, sourcePluginName, search, hasPlugin, sortBy, sortOrder)
```

#### Service — `internal/service/plugin/service.go` → `IncidentService.ListIncidents`

签名加 `sortBy, sortOrder string`，透传给 repo。

#### Repository — `internal/repository/plugin.go` → `IncidentRepository.List`

签名加 `sortBy, sortOrder string`，替换原来的硬编码排序：

```go
// 把原来的
query.Preload("Plugin").Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&incidents)

// 替换为
sortField := "created_at"
order := "DESC"
allowedSortFields := map[string]bool{
    "title": true, "severity": true, "status": true,
    "healing_status": true, "category": true, "assignee": true,
    "external_id": true, "source_plugin_name": true,
    "created_at": true, "updated_at": true,
}
if sortBy != "" && allowedSortFields[sortBy] {
    sortField = sortBy
}
if sortOrder == "asc" || sortOrder == "ASC" {
    order = "ASC"
}
query.Preload("Plugin").Offset(offset).Limit(pageSize).Order(fmt.Sprintf("%s %s", sortField, order)).Find(&incidents)
```

### 2.4 测试

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | jq -r '.access_token')

# 升序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/incidents?page=1&page_size=5&sort_by=created_at&sort_order=asc" \
  | jq '.data[].created_at'

# 降序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/incidents?page=1&page_size=5&sort_by=created_at&sort_order=desc" \
  | jq '.data[].created_at'

# 按严重性排序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/incidents?page=1&page_size=5&sort_by=severity&sort_order=asc" \
  | jq '.data[].severity'
```

**验证标准：** `asc` 和 `desc` 返回结果顺序不同。

---

## 三、Plugins（插件）— 优先级中

### 3.1 新增 Query 参数

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `search` | string | 模糊搜索 name 和 description | `search=servicenow` |
| `sort_by` | string | 排序字段，默认 `created_at` | `sort_by=name` |
| `sort_order` | string | `asc` 或 `desc`，默认 `desc` | `sort_order=asc` |

### 3.2 允许的 sort_by 字段

```
name, type, status, last_sync_at, created_at, updated_at
```

### 3.3 需要改的文件

#### Handler — `internal/handler/plugin_handler.go` → `ListPlugins`

```go
// 原来只有 type 和 status，添加三个新参数
search := c.Query("search")
sortBy := c.Query("sort_by")
sortOrder := c.Query("sort_order")
```

调用签名加三个参数。

#### Service — `internal/service/plugin/service.go` → `Service.ListPlugins`

签名加 `search, sortBy, sortOrder string`，透传。

#### Repository — `internal/repository/plugin.go` → `PluginRepository.List`

签名加 `search, sortBy, sortOrder string`，在 Count 之前加搜索，在 Find 之前加排序：

```go
// 搜索
if search != "" {
    query = query.Where("name ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
}

// 排序（同上面 Incidents 的模式）
sortField := "created_at"
order := "DESC"
allowedSortFields := map[string]bool{
    "name": true, "type": true, "status": true,
    "last_sync_at": true, "created_at": true, "updated_at": true,
}
if sortBy != "" && allowedSortFields[sortBy] {
    sortField = sortBy
}
if sortOrder == "asc" || sortOrder == "ASC" {
    order = "ASC"
}
query.Offset(offset).Limit(pageSize).Order(fmt.Sprintf("%s %s", sortField, order)).Find(&plugins)
```

### 3.4 测试

```bash
# 搜索
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/plugins?search=servicenow" | jq '.data[].name'

# 排序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/plugins?sort_by=name&sort_order=asc" | jq '.data[].name'

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/plugins?sort_by=name&sort_order=desc" | jq '.data[].name'
```

---

## 四、改动量总结

| 模块 | Handler | Service | Repository | 预计工时 |
|---|---|---|---|---|
| Incidents | +2行 + 改签名 | 改签名 | +15行排序逻辑 | 15分钟 |
| Plugins | +3行 + 改签名 | 改签名 | +20行搜索+排序 | 20分钟 |

## 五、注意事项

1. `fmt` 包需要在 repository 文件中导入（如尚未导入）
2. 不传 `sort_by` 时默认按 `created_at DESC`，保持向后兼容
3. 不传 `search` 时不加搜索条件，保持向后兼容
4. `allowedSortFields` 白名单必须有，防 SQL 注入
