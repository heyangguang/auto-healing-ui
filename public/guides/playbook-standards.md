# Playbook 编写规范

了解 Ansible Playbook 最佳实践和变量管理。

## 目录结构规范

标准的 Playbook 仓库应遵循以下目录结构：

```
repository/
├── playbooks/           # 顶层 Playbook 入口文件
│   ├── deploy_app.yml
│   └── log_rotation.yml
├── roles/               # 角色目录
│   ├── common/          # 通用角色
│   │   ├── tasks/main.yml
│   │   ├── handlers/main.yml
│   │   └── defaults/main.yml
│   └── app_deploy/
│       ├── tasks/main.yml
│       ├── templates/
│       └── vars/main.yml
├── inventory/           # 主机清单（可选，推荐使用平台 CMDB）
├── group_vars/          # 组变量
└── host_vars/           # 主机变量
```

平台在同步仓库时，会自动扫描 `playbooks/` 和根目录下的 `.yml` 文件并注册为可用剧本。

## 变量管理最佳实践

**变量来源优先级**（从低到高）：

1. `defaults/main.yml` — Role 默认变量，最容易被覆盖
2. `group_vars/` — 主机组变量
3. `host_vars/` — 主机级变量
4. 任务模板 Extra Vars — 平台运行时传入

**命名规范**：

- 使用 `snake_case` 命名，如 `app_port`、`log_retention_days`
- 添加角色前缀避免冲突，如 `nginx_worker_processes`
- 敏感变量使用平台密钥管理，不要硬编码到仓库中

**平台变量扫描**：

导入 Playbook 后，平台会自动扫描所有 `{{ variable }}` 引用，在任务模板中展示变量列表和默认值，支持运行时动态填充。

## 编写注意事项

- **幂等性** — 确保 Playbook 可重复执行不会产生副作用，使用 `state: present` 而非命令式写法
- **错误处理** — 关键任务添加 `rescue` 块，使用 `failed_when` 自定义失败条件
- **超时控制** — 为耗时任务设置 `async` + `poll` 或 `timeout` 参数
- **日志输出** — 使用 `debug` 模块输出关键变量值，便于在平台日志中排查问题
- **标签管理** — 为任务添加 `tags`，支持在任务模板中选择性执行特定步骤
