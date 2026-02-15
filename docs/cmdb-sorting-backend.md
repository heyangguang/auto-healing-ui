# CMDB API 排序功能后端需求

## 现状

前端已实现排序 UI，点击表头会传递 `sort_by` 和 `sort_order` 参数，但后端 `GET /api/v1/cmdb` 当前忽略这些参数。

## 需要后端支持的参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `sort_by` | string | 排序字段名，可选值：`name`, `type`, `status`, `environment`, `os`, `owner`, `department`, `source_plugin_name`, `updated_at` |
| `sort_order` | string | 排序方向，`asc`（升序）或 `desc`（降序），默认 `desc` |

## 前端请求示例

```
GET /api/v1/cmdb?page=1&page_size=20&sort_by=name&sort_order=asc
GET /api/v1/cmdb?page=1&page_size=20&sort_by=status&sort_order=desc
GET /api/v1/cmdb?page=1&page_size=20&sort_by=updated_at&sort_order=desc
```

## 后端实现建议

1. 在 CMDB 查询 Handler 中解析 `sort_by` 和 `sort_order` query 参数
2. 白名单校验 `sort_by` 字段名，防止 SQL 注入
3. 在 Repository 层的 SQL 查询中添加 `ORDER BY {sort_by} {sort_order}`
4. 默认排序：`updated_at DESC`（无 sort 参数时）
