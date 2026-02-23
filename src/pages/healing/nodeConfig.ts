/**
 * 节点类型统一配置（Single Source of Truth）
 *
 * 所有涉及节点类型颜色、标签的组件都应该从这里导入，
 * 修改此文件即可全局生效。
 */

// ==================== 节点类型颜色 ====================
// 每种节点类型对应唯一的颜色值
export const NODE_TYPE_COLORS: Record<string, string> = {
    start: '#52c41a',
    end: '#ff4d4f',
    host_extractor: '#1890ff',
    cmdb_validator: '#13c2c2',
    execution: '#8B5A2B',
    approval: '#faad14',
    notification: '#52c41a',
    condition: '#722ed1',
    set_variable: '#eb2f96',
    compute: '#2f54eb',
    trigger: '#722ed1',
};

// ==================== 节点类型标签 ====================
// 完整中文标签（用于实例详情等）
export const NODE_TYPE_LABELS: Record<string, string> = {
    start: '开始',
    end: '结束',
    execution: '执行',
    approval: '审批',
    condition: '条件分支',
    notification: '通知',
    host_extractor: '主机提取',
    cmdb_validator: 'CMDB 校验',
    set_variable: '变量设置',
    compute: '计算',
    trigger: '触发器',
    custom: '自定义',
};

// ==================== 编辑器侧边栏标签 ====================
// 编辑器侧边栏用的完整标签（通常比 NODE_TYPE_LABELS 更详细）
export const NODE_TYPE_FULL_LABELS: Record<string, string> = {
    start: '开始节点',
    end: '结束节点',
    host_extractor: '主机提取',
    cmdb_validator: 'CMDB验证',
    execution: '任务执行',
    approval: '人工审批',
    notification: '发送通知',
    condition: '条件分支',
    set_variable: '设置变量',
    compute: '计算节点',
};

// ==================== 组合配置 ====================
// nodeTypeConfig: 颜色 + 标签组合（用于 NodeDetailPanel、flows/index 等）
export const NODE_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
    start: { color: NODE_TYPE_COLORS.start, label: NODE_TYPE_FULL_LABELS.start },
    end: { color: NODE_TYPE_COLORS.end, label: NODE_TYPE_FULL_LABELS.end },
    host_extractor: { color: NODE_TYPE_COLORS.host_extractor, label: NODE_TYPE_FULL_LABELS.host_extractor },
    cmdb_validator: { color: NODE_TYPE_COLORS.cmdb_validator, label: NODE_TYPE_FULL_LABELS.cmdb_validator },
    execution: { color: NODE_TYPE_COLORS.execution, label: NODE_TYPE_FULL_LABELS.execution },
    approval: { color: NODE_TYPE_COLORS.approval, label: NODE_TYPE_FULL_LABELS.approval },
    notification: { color: NODE_TYPE_COLORS.notification, label: NODE_TYPE_FULL_LABELS.notification },
    condition: { color: NODE_TYPE_COLORS.condition, label: NODE_TYPE_FULL_LABELS.condition },
    set_variable: { color: NODE_TYPE_COLORS.set_variable, label: NODE_TYPE_FULL_LABELS.set_variable },
    compute: { color: NODE_TYPE_COLORS.compute, label: NODE_TYPE_FULL_LABELS.compute },
};

/**
 * 获取节点类型颜色（带默认值）
 */
export function getNodeTypeColor(type: string): string {
    return NODE_TYPE_COLORS[type] || '#8c8c8c';
}

/**
 * 获取节点类型标签（带默认值）
 */
export function getNodeTypeLabel(type: string): string {
    return NODE_TYPE_LABELS[type] || type;
}
