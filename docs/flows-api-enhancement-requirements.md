# 后端需求：Flow 节点名称数据完整性

## 问题总结

Flow 节点中有两类关联实体仅存了 ID，没存名称：
1. **execution 节点**：仅 2 条早期脏数据缺 `task_template_name`，编辑器已修复
2. **notification 节点**：**所有**都只存了 `channel_id` + `template_id`，没存名称

## 后端需要做的事

### 1. 删除 2 条脏数据流程（可选）

这两条是早期测试流程，execution 节点缺 `task_template_name`：

| 流程名 | flow_id |
|--------|---------|
| 任务模板测试流程 | `5864a04e-6a04-4c5a-86d5-88362dc5b457` |
| 任务模板测试流程 | `5266f84c-9cfb-4cc4-89a3-d85c9c684c8d` |

如果不想删，也可以不管——前端会 fallback 显示截断 ID。

### 2. ListFlows / GetFlow 返回时填充通知节点名称

当返回 flow 数据时，对 nodes JSONB 中 `type == "notification"` 的节点，在 config 里填充：

- **`channel_names`**：`map[string]string`，key 为 `channel_id`，value 为渠道名称
  - 来源：根据 config 中的 `channel_ids` 或 `notification_configs[].channel_id`，查 `notification_channels` 表
- **`template_name`**：`string`，通知模板名称
  - 来源：根据 config 中的 `template_id` 或 `notification_configs[].template_id`，查 `notification_templates` 表

> **目的**：前端列表页的详情抽屉需要显示通知渠道和模板的名称。目前前端只能显示 UUID，用户体验差。
>
> **已有的 Repository 方法**：
> - `NotificationRepository.GetChannelsByIDs(ids []uuid.UUID)` — 批量查渠道
> - `NotificationRepository.GetTemplateByID(id uuid.UUID)` — 单个查模板

### 3. 前端会自行修复的部分（不需要后端参与）

- 编辑器保存通知节点时，前端会改为同时保存 `channel_name` 和 `template_name`
- 删除前端列表页中的 `useEffect` workaround（execution 节点名称查询）
- 使用后端返回的名称直接显示
