/**
 * 事件（Incident）相关字典值集中管理
 *
 * 包含：严重程度、事件类别、工单状态、自愈状态的统一映射。
 * 后端新增枚举值时，只需在此文件追加即可，各页面自动生效。
 */

/* ========== 严重程度 ========== */

/** 严重程度 → 显示信息（支持数字和字符串两种 key） */
export const INCIDENT_SEVERITY_MAP: Record<string, { text: string; color: string; tagColor: string }> = {
    critical: { text: '严重', color: '#cf1322', tagColor: 'red' },
    '1': { text: '严重', color: '#cf1322', tagColor: 'red' },
    high: { text: '高', color: '#fa541c', tagColor: 'orange' },
    '2': { text: '高', color: '#fa541c', tagColor: 'orange' },
    medium: { text: '中', color: '#faad14', tagColor: 'gold' },
    '3': { text: '中', color: '#faad14', tagColor: 'gold' },
    low: { text: '低', color: '#52c41a', tagColor: 'green' },
    '4': { text: '低', color: '#52c41a', tagColor: 'green' },
    info: { text: '信息', color: '#8c8c8c', tagColor: 'default' },
};

/** antd Tag color 别名（pending-center 等 Tag 组件直接使用） */
export const SEVERITY_TAG_COLORS: Record<string, string> = {
    critical: 'error',
    high: 'warning',
    medium: 'processing',
    low: 'default',
    '1': 'error',
    '2': 'warning',
    '3': 'processing',
    '4': 'default',
};

export function getSeverityText(severity: string): string {
    return INCIDENT_SEVERITY_MAP[severity]?.text || severity;
}

export function getSeverityColor(severity: string): string {
    return INCIDENT_SEVERITY_MAP[severity]?.color || '#8c8c8c';
}

/* ========== 事件类别 ========== */

/** 事件类别 → 中文标签 */
export const CATEGORY_LABELS: Record<string, string> = {
    network: '网络',
    application: '应用',
    database: '数据库',
    security: '安全',
    hardware: '硬件',
    storage: '存储',
};

/* ========== 工单状态 ========== */

/** 工单状态 → 显示信息 */
export const INCIDENT_STATUS_MAP: Record<string, { text: string; color: string }> = {
    open: { text: '打开', color: 'blue' },
    in_progress: { text: '处理中', color: 'orange' },
    resolved: { text: '已解决', color: 'green' },
    closed: { text: '已关闭', color: 'default' },
};

/* ========== 自愈状态 ========== */

/** 自愈状态 → 显示信息 */
export const INCIDENT_HEALING_MAP: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = {
    pending: { text: '待处理', color: '#d9d9d9', badge: 'default' },
    matched: { text: '已匹配', color: '#1677ff', badge: 'processing' },
    healing: { text: '自愈中', color: '#1677ff', badge: 'processing' },
    processing: { text: '处理中', color: '#1677ff', badge: 'processing' },
    healed: { text: '已自愈', color: '#52c41a', badge: 'success' },
    failed: { text: '失败', color: '#ff4d4f', badge: 'error' },
    skipped: { text: '已跳过', color: '#8c8c8c', badge: 'default' },
    dismissed: { text: '已忽略', color: '#bfbfbf', badge: 'default' },
};

/* ========== 告警状态 → 色值（Dashboard 图表专用） ========== */

export const INCIDENT_CHART_COLORS: Record<string, string> = {
    pending: '#faad14',
    processing: '#1677ff',
    healed: '#52c41a',
    failed: '#ff4d4f',
    skipped: '#8c8c8c',
    dismissed: '#bfbfbf',
};

/* ========== 告警状态 → 中文标签（Dashboard 图表专用） ========== */

export const INCIDENT_CHART_LABELS: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    healed: '已自愈',
    failed: '失败',
    skipped: '已跳过',
    dismissed: '已忽略',
};
