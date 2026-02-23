/**
 * 执行管理相关字典值集中管理
 *
 * 包含：执行器类型（local / docker / ssh）的标签和颜色。
 * icon 由使用方在组件内自行组装。
 */

export interface ExecutorTypeConfig {
    label: string;
    color: string;
}

export const EXECUTOR_TYPE_CONFIG: Record<string, ExecutorTypeConfig> = {
    local: { label: '本地', color: '#52c41a' },
    docker: { label: 'Docker', color: '#1677ff' },
    ssh: { label: 'SSH', color: '#722ed1' },
};

/**
 * 获取执行器类型配置（带后备值）
 */
export function getExecutorConfig(type: string): ExecutorTypeConfig {
    return EXECUTOR_TYPE_CONFIG[type] || { label: type || '未知', color: '#8c8c8c' };
}

/* ========== 执行运行状态 → 色值（图表专用） ========== */

export const RUN_STATUS_COLORS: Record<string, string> = {
    success: '#52c41a',
    failed: '#ff4d4f',
    running: '#1677ff',
    partial: '#faad14',
    cancelled: '#d9d9d9',
};

/* ========== 执行运行状态 → 中文标签 ========== */

export const RUN_STATUS_LABELS: Record<string, string> = {
    success: '成功',
    failed: '失败',
    running: '运行中',
    partial: '部分成功',
    cancelled: '已取消',
};

/* ========== 执行运行状态 → antd Tag/Badge 配置（列表组件用） ========== */

export const RUN_STATUS_MAP: Record<string, { color: string; text: string }> = {
    success: { color: 'success', text: '成功' },
    failed: { color: 'error', text: '失败' },
    running: { color: 'processing', text: '运行中' },
    partial: { color: 'warning', text: '部分成功' },
    cancelled: { color: 'default', text: '取消' },
};
