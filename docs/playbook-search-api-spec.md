# Playbook 列表 API — 搜索、过滤、排序增强需求

> 当前 `GET /api/v1/playbooks` 仅支持 `repository_id`、`status`、`page`、`page_size` 四个参数。
> 前端需要完整的搜索/过滤/排序能力，以提供高密度筛选体验。
> 请参照 `internal/repository/git.go` 中 `GitRepoListOptions` + `ListWithOptions` 的标准实现。

---

## 一、参考样板

项目中已有标准实现：`internal/repository/git.go:62-166`（`GitRepoListOptions` + `ListWithOptions`）。

**核心模式：**
1. 定义 `Options` 结构体，包含所有查询参数
2. Handler 解析 Query 参数 → 填充 Options → 调用 Service → 调用 Repository
3. 用 `allowedSortFields` 白名单校验排序字段，防止 SQL 注入
4. 不传参数时保持向后兼容（默认行为不变）

---

## 二、新增 Query 参数

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| `search` | string | 全文模糊搜索（匹配 name + description + file_path） | `search=deploy` |
| `name` | string | 按名称模糊搜索 | `name=测试` |
| `file_path` | string | 按入口文件路径模糊搜索 | `file_path=site.yml` |
| `repository_id` | uuid | 按仓库 ID 精确过滤（已有） | `repository_id=85215b9a-...` |
| `status` | string | 按状态精确过滤（已有） | `status=ready` |
| `config_mode` | string | 按扫描模式过滤: `auto` / `enhanced` | `config_mode=enhanced` |
| `has_variables` | bool | 是否包含变量（`true` = 变量数 > 0） | `has_variables=true` |
| `min_variables` | int | 最小变量数量（≥） | `min_variables=10` |
| `max_variables` | int | 最大变量数量（≤） | `max_variables=5` |
| `has_required_vars` | bool | 是否包含必填变量 | `has_required_vars=true` |
| `sort_by` | string | 排序字段，默认 `created_at` | `sort_by=name` |
| `sort_order` | string | `asc` 或 `desc`，默认 `desc` | `sort_order=asc` |
| `created_from` | string | 创建时间起始（ISO 8601） | `created_from=2026-01-01T00:00:00Z` |
| `created_to` | string | 创建时间结束（ISO 8601） | `created_to=2026-02-01T00:00:00Z` |

### 允许的 sort_by 字段

```
name, status, config_mode, file_path, created_at, updated_at, last_scanned_at
```

---

## 三、需要改的文件

### 3.1 Repository — `internal/repository/playbook.go`

#### 新增 Options 结构体

```go
// PlaybookListOptions Playbook 列表查询选项
type PlaybookListOptions struct {
    // 分页
    Page     int
    PageSize int

    // 搜索
    Search   string // 全文搜索（匹配 name + description + file_path）
    Name     string // 按名称模糊搜索
    FilePath string // 按文件路径模糊搜索

    // 过滤
    RepositoryID *uuid.UUID // 按仓库 ID 精确过滤
    Status       string     // ready / pending / scanned / error
    ConfigMode   string     // auto / enhanced

    // 变量过滤（基于 JSONB 的 variables 字段）
    HasVariables    *bool // 是否包含变量
    MinVariables    *int  // 最小变量数量
    MaxVariables    *int  // 最大变量数量
    HasRequiredVars *bool // 是否包含必填变量

    // 排序
    SortField string // name / status / config_mode / file_path / created_at / updated_at / last_scanned_at
    SortOrder string // asc / desc

    // 时间范围
    CreatedFrom *time.Time
    CreatedTo   *time.Time
}
```

#### 新增 `ListWithOptions` 方法

```go
// ListWithOptions 获取 Playbook 列表（支持完整查询参数）
func (r *PlaybookRepository) ListWithOptions(ctx context.Context, opts *PlaybookListOptions) ([]model.Playbook, int64, error) {
    var playbooks []model.Playbook
    var total int64

    query := database.DB.WithContext(ctx).Model(&model.Playbook{})

    // 全文搜索（name + description + file_path）
    if opts.Search != "" {
        search := "%" + strings.ToLower(opts.Search) + "%"
        query = query.Where("LOWER(name) LIKE ? OR LOWER(COALESCE(description,'')) LIKE ? OR LOWER(file_path) LIKE ?", search, search, search)
    }

    // 按名称模糊搜索
    if opts.Name != "" {
        query = query.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(opts.Name)+"%")
    }

    // 按文件路径模糊搜索
    if opts.FilePath != "" {
        query = query.Where("LOWER(file_path) LIKE ?", "%"+strings.ToLower(opts.FilePath)+"%")
    }

    // 仓库 ID 过滤
    if opts.RepositoryID != nil {
        query = query.Where("repository_id = ?", *opts.RepositoryID)
    }

    // 状态过滤
    if opts.Status != "" {
        query = query.Where("status = ?", opts.Status)
    }

    // 扫描模式过滤
    if opts.ConfigMode != "" {
        query = query.Where("config_mode = ?", opts.ConfigMode)
    }

    // 变量过滤（JSONB）
    // PostgreSQL: jsonb_array_length(variables) 获取 JSONB 数组长度
    if opts.HasVariables != nil {
        if *opts.HasVariables {
            query = query.Where("jsonb_array_length(COALESCE(variables, '[]'::jsonb)) > 0")
        } else {
            query = query.Where("jsonb_array_length(COALESCE(variables, '[]'::jsonb)) = 0")
        }
    }
    if opts.MinVariables != nil {
        query = query.Where("jsonb_array_length(COALESCE(variables, '[]'::jsonb)) >= ?", *opts.MinVariables)
    }
    if opts.MaxVariables != nil {
        query = query.Where("jsonb_array_length(COALESCE(variables, '[]'::jsonb)) <= ?", *opts.MaxVariables)
    }

    // 必填变量过滤
    // PostgreSQL: 检查 JSONB 数组中是否存在 required=true 的元素
    if opts.HasRequiredVars != nil {
        if *opts.HasRequiredVars {
            query = query.Where("EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(variables, '[]'::jsonb)) elem WHERE (elem->>'required')::boolean = true)")
        } else {
            query = query.Where("NOT EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(variables, '[]'::jsonb)) elem WHERE (elem->>'required')::boolean = true)")
        }
    }

    // 时间范围
    if opts.CreatedFrom != nil {
        query = query.Where("created_at >= ?", *opts.CreatedFrom)
    }
    if opts.CreatedTo != nil {
        query = query.Where("created_at <= ?", *opts.CreatedTo)
    }

    // 计数
    query.Count(&total)

    // 排序
    allowedSortFields := map[string]bool{
        "name": true, "status": true, "config_mode": true,
        "file_path": true, "created_at": true, "updated_at": true,
        "last_scanned_at": true,
    }
    if opts.SortField != "" && allowedSortFields[opts.SortField] {
        order := "ASC"
        if strings.ToLower(opts.SortOrder) == "desc" {
            order = "DESC"
        }
        query = query.Order(fmt.Sprintf("%s %s", opts.SortField, order))
    } else {
        query = query.Order("created_at DESC")
    }

    // 分页
    if opts.Page > 0 && opts.PageSize > 0 {
        query = query.Offset((opts.Page - 1) * opts.PageSize).Limit(opts.PageSize)
    }

    err := query.Preload("Repository").Find(&playbooks).Error
    return playbooks, total, err
}
```

> **注意：** 需要在文件头部 import 中添加 `"fmt"` 和 `"strings"`。

#### 修改原有 `List` 方法（向后兼容）

```go
// List 列出 Playbooks（向后兼容）
func (r *PlaybookRepository) List(ctx context.Context, repositoryID *uuid.UUID, status string, page, pageSize int) ([]model.Playbook, int64, error) {
    return r.ListWithOptions(ctx, &PlaybookListOptions{
        RepositoryID: repositoryID,
        Status:       status,
        Page:         page,
        PageSize:     pageSize,
    })
}
```

---

### 3.2 Service — `internal/service/playbook/service.go`

在 Service 层新增方法（或改造现有 `List` 方法签名）：

```go
// ListWithOptions 获取 Playbook 列表（完整查询参数）
func (s *Service) ListWithOptions(ctx context.Context, opts *repository.PlaybookListOptions) ([]model.Playbook, int64, error) {
    return s.repo.ListWithOptions(ctx, opts)
}
```

---

### 3.3 Handler — `internal/handler/playbook_handler.go`

修改 `List` 方法，解析所有新参数：

```go
// List 列出 Playbooks
func (h *PlaybookHandler) List(c *gin.Context) {
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

    opts := &repository.PlaybookListOptions{
        Page:     page,
        PageSize: pageSize,

        // 搜索
        Search:   c.Query("search"),
        Name:     c.Query("name"),
        FilePath: c.Query("file_path"),

        // 过滤
        Status:     c.Query("status"),
        ConfigMode: c.Query("config_mode"),

        // 排序
        SortField: c.Query("sort_by"),
        SortOrder: c.Query("sort_order"),
    }

    // 仓库 ID
    if repoIDStr := c.Query("repository_id"); repoIDStr != "" {
        if id, err := uuid.Parse(repoIDStr); err == nil {
            opts.RepositoryID = &id
        }
    }

    // 布尔参数
    if v := c.Query("has_variables"); v != "" {
        b := v == "true"
        opts.HasVariables = &b
    }
    if v := c.Query("has_required_vars"); v != "" {
        b := v == "true"
        opts.HasRequiredVars = &b
    }

    // 数值参数
    if v := c.Query("min_variables"); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            opts.MinVariables = &n
        }
    }
    if v := c.Query("max_variables"); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            opts.MaxVariables = &n
        }
    }

    // 时间范围
    if v := c.Query("created_from"); v != "" {
        if t, err := time.Parse(time.RFC3339, v); err == nil {
            opts.CreatedFrom = &t
        }
    }
    if v := c.Query("created_to"); v != "" {
        if t, err := time.Parse(time.RFC3339, v); err == nil {
            opts.CreatedTo = &t
        }
    }

    playbooks, total, err := h.svc.ListWithOptions(c.Request.Context(), opts)
    if err != nil {
        response.InternalError(c, err.Error())
        return
    }

    response.List(c, playbooks, total, page, pageSize)
}
```

> **注意：** Handler 中需要 import `"time"`。

---

## 四、改动量总结

| 层级 | 文件 | 改动 | 预计工时 |
|---|---|---|---|
| Repository | `internal/repository/playbook.go` | +PlaybookListOptions 结构体 + ListWithOptions 方法 (~80行) + 改造 List 向后兼容 | 25分钟 |
| Service | `internal/service/playbook/service.go` | +ListWithOptions 方法透传 (~3行) | 5分钟 |
| Handler | `internal/handler/playbook_handler.go` | 重写 List 方法解析所有参数 (~50行) | 15分钟 |
| **总计** | | | **~45分钟** |

---

## 五、测试命令

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}' | jq -r '.access_token')

# 1. 全文搜索
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?search=测试" | jq '{total, names: [.data[].name]}'

# 2. 按名称搜索
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?name=deploy" | jq '{total, names: [.data[].name]}'

# 3. 按状态过滤
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?status=ready" | jq '{total, names: [.data[].name]}'

# 4. 按扫描模式过滤
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?config_mode=enhanced" | jq '{total, names: [.data[].name]}'

# 5. 有变量的 Playbook
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?has_variables=true" | jq '{total, names: [.data[].name]}'

# 6. 变量数 >= 10
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?min_variables=10" | jq '{total, names: [.data[].name]}'

# 7. 变量数 <= 5
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?max_variables=5" | jq '{total, names: [.data[].name]}'

# 8. 有必填变量的
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?has_required_vars=true" | jq '{total, names: [.data[].name]}'

# 9. 排序 - 按名称升序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?sort_by=name&sort_order=asc" | jq '[.data[].name]'

# 10. 排序 - 按名称降序
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?sort_by=name&sort_order=desc" | jq '[.data[].name]'

# 11. 组合查询 - 有变量的 + 按变量数排序（暂不支持按变量数排序，需额外加 sort field）
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?has_variables=true&status=ready&sort_by=name&sort_order=asc" | jq '{total, names: [.data[].name]}'

# 12. 时间范围
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/playbooks?created_from=2026-01-08T00:00:00Z&created_to=2026-01-09T00:00:00Z" | jq '{total, names: [.data[].name]}'
```

**验证标准：**
1. `search=不存在的关键字` 应返回 `total: 0`
2. `status=pending` 与 `status=ready` 返回不同结果
3. `sort_order=asc` 和 `sort_order=desc` 返回顺序相反
4. `min_variables=10` 应只返回变量数 ≥10 的 Playbook
5. 不传任何新参数时行为与当前完全一致

---

## 六、注意事项

1. `fmt` 和 `strings` 包需要在 `playbook.go` 中导入（如尚未导入）
2. `time` 包需要在 `playbook_handler.go` 中导入
3. 所有新参数都是可选的，不传时保持默认行为（向后兼容）
4. `allowedSortFields` 白名单**必须有**，防 SQL 注入
5. JSONB 查询使用 `jsonb_array_length` 和 `jsonb_array_elements` 是 PostgreSQL 内置函数，无需额外插件
6. `COALESCE(variables, '[]'::jsonb)` 处理 variables 为 NULL 的情况
7. `has_required_vars` 使用 `EXISTS` 子查询，性能上对于小数据量完全没问题；如果数据量大可以考虑加 GIN 索引
