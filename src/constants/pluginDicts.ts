/**
 * 插件（Plugin）相关字典值集中管理
 *
 * 包含：插件状态的标签、颜色、Badge 映射。
 * StatusPlugins / ChartPluginHealth 等 Dashboard 组件统一引用。
 */

/* ========== 插件状态 → 色值（图表专用） ========== */

export const PLUGIN_STATUS_COLORS: Record<string, string> = {
    active: '#52c41a',
    inactive: '#d9d9d9',
    error: '#ff4d4f',
};

/* ========== 插件状态 → 中文标签 ========== */

export const PLUGIN_STATUS_LABELS: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    error: '异常',
};

/* ========== 插件状态 → antd Badge 配置（列表组件用） ========== */

export const PLUGIN_STATUS_MAP: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '活跃' },
    inactive: { color: 'default', text: '停用' },
    error: { color: 'error', text: '异常' },
};
