/**
 * 自愈实例（Healing Instance）相关字典值集中管理
 *
 * 包含：实例状态的标签、颜色、Badge 映射。
 * Dashboard 图表 / 实例列表 / 实例详情 等页面统一引用。
 */

/* ========== 实例状态 → 色值（图表专用） ========== */

export const INSTANCE_STATUS_COLORS: Record<string, string> = {
    completed: '#52c41a',
    running: '#1677ff',
    pending: '#faad14',
    failed: '#ff4d4f',
    skipped: '#8c8c8c',
    cancelled: '#d9d9d9',
    waiting_approval: '#722ed1',
};

/* ========== 实例状态 → 中文标签 ========== */

export const INSTANCE_STATUS_LABELS: Record<string, string> = {
    pending: '等待中',
    running: '执行中',
    waiting_approval: '待审批',
    completed: '已完成',
    success: '成功',
    approved: '已通过',
    failed: '失败',
    rejected: '已拒绝',
    error: '错误',
    partial: '部分成功',
    cancelled: '已取消',
    skipped: '已跳过',
    simulated: '模拟通过',
    triggered: '已触发',
};

/* ========== 实例状态 → antd Tag/Badge 配置（列表组件用） ========== */

export const INSTANCE_STATUS_MAP: Record<string, { color: string; text: string; bg?: string }> = {
    completed: { color: 'success', text: '完成', bg: '#f6ffed' },
    running: { color: 'processing', text: '运行中', bg: '#e6f7ff' },
    pending: { color: 'warning', text: '待处理', bg: '#fffbe6' },
    failed: { color: 'error', text: '失败', bg: '#fff2f0' },
    skipped: { color: 'default', text: '跳过', bg: '#fafafa' },
    cancelled: { color: 'default', text: '取消', bg: '#fafafa' },
    waiting_approval: { color: 'warning', text: '待审批', bg: '#fffbe6' },
};
