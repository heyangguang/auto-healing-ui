/**
 * 事件（Incident）相关字典值
 *
 * 数据源优先级：后端 API > localStorage 缓存 > 硬编码兜底
 * 消费组件无需改动，import 方式和用法完全不变。
 */
import { getDictItems, onDictRefresh, toLabelsMap, } from '@/utils/dictCache';

// ==================== 硬编码兜底（仅在 API + 缓存都为空时使用） ====================

const FB_SEVERITY: Record<string, { text: string; color: string; tagColor: string }> = {
    critical: { text: '严重', color: '#cf1322', tagColor: 'red' },
    high: { text: '高', color: '#fa541c', tagColor: 'orange' },
    medium: { text: '中', color: '#faad14', tagColor: 'gold' },
    low: { text: '低', color: '#52c41a', tagColor: 'green' },
    info: { text: '信息', color: '#8c8c8c', tagColor: 'default' },
};

const FB_SEVERITY_TAG_COLORS: Record<string, string> = {
    critical: 'error', high: 'warning', medium: 'processing', low: 'default',
    '1': 'error', '2': 'warning', '3': 'processing', '4': 'default',
};

const FB_CATEGORY: Record<string, string> = {
    network: '网络', application: '应用', database: '数据库',
    security: '安全', hardware: '硬件', storage: '存储',
};

const FB_STATUS: Record<string, { text: string; color: string }> = {
    open: { text: '打开', color: 'blue' },
    in_progress: { text: '处理中', color: 'orange' },
    resolved: { text: '已解决', color: 'green' },
    closed: { text: '已关闭', color: 'default' },
};

const FB_HEALING: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = {
    pending: { text: '待处理', color: '#d9d9d9', badge: 'default' },
    matched: { text: '已匹配', color: '#1677ff', badge: 'processing' },
    healing: { text: '自愈中', color: '#1677ff', badge: 'processing' },
    processing: { text: '处理中', color: '#1677ff', badge: 'processing' },
    healed: { text: '已自愈', color: '#52c41a', badge: 'success' },
    failed: { text: '失败', color: '#ff4d4f', badge: 'error' },
    skipped: { text: '已跳过', color: '#8c8c8c', badge: 'default' },
    dismissed: { text: '已忽略', color: '#bfbfbf', badge: 'default' },
};

// ==================== 动态变量（API 数据到达后自动覆盖） ====================

/* ========== 严重程度 ========== */

export let INCIDENT_SEVERITY_MAP: Record<string, { text: string; color: string; tagColor: string }> = { ...FB_SEVERITY };

/** 数字 key 别名（兼容后端返回数字 severity 的场景） */
const NUMERIC_SEVERITY_ALIASES: Record<string, string> = { '1': 'critical', '2': 'high', '3': 'medium', '4': 'low' };

export let SEVERITY_TAG_COLORS: Record<string, string> = { ...FB_SEVERITY_TAG_COLORS };

export function getSeverityText(severity: string): string {
    return INCIDENT_SEVERITY_MAP[severity]?.text || INCIDENT_SEVERITY_MAP[NUMERIC_SEVERITY_ALIASES[severity]]?.text || severity;
}

export function getSeverityColor(severity: string): string {
    return INCIDENT_SEVERITY_MAP[severity]?.color || INCIDENT_SEVERITY_MAP[NUMERIC_SEVERITY_ALIASES[severity]]?.color || '#8c8c8c';
}

/* ========== 事件类别 ========== */

export let CATEGORY_LABELS: Record<string, string> = { ...FB_CATEGORY };

/* ========== 工单状态 ========== */

export let INCIDENT_STATUS_MAP: Record<string, { text: string; color: string }> = { ...FB_STATUS };

/* ========== 自愈状态 ========== */

export let INCIDENT_HEALING_MAP: Record<string, { text: string; color: string; badge: 'success' | 'error' | 'warning' | 'processing' | 'default' }> = { ...FB_HEALING };

/* ========== 图表专用 ========== */

export let INCIDENT_CHART_COLORS: Record<string, string> = {
    pending: '#faad14', processing: '#1677ff', healed: '#52c41a',
    failed: '#ff4d4f', skipped: '#8c8c8c', dismissed: '#bfbfbf',
};

export let INCIDENT_CHART_LABELS: Record<string, string> = {
    pending: '待处理', processing: '处理中', healed: '已自愈',
    failed: '失败', skipped: '已跳过', dismissed: '已忽略',
};

type SeverityEntry = {
    text: string;
    color: string;
    tagColor: string;
};

type IncidentStatusEntry = {
    text: string;
    color: string;
};

type HealingEntry = {
    text: string;
    color: string;
    badge: 'success' | 'error' | 'warning' | 'processing' | 'default';
};

/* ========== Select Options 辅助 ========== */

/** 严重程度下拉选项 */
export function getSeverityOptions() {
    return Object.entries(INCIDENT_SEVERITY_MAP)
        .filter(([k]) => !Object.keys(NUMERIC_SEVERITY_ALIASES).includes(k)) // 排除数字别名
        .map(([value, cfg]) => ({ label: cfg.text, value }));
}

/** 工单状态下拉选项 */
export function getIncidentStatusOptions() {
    return Object.entries(INCIDENT_STATUS_MAP).map(([value, cfg]) => ({ label: cfg.text, value }));
}

/** 自愈状态下拉选项 */
export function getHealingStatusOptions() {
    return Object.entries(INCIDENT_HEALING_MAP).map(([value, cfg]) => ({ label: cfg.text, value }));
}

/** 自愈状态 headerFilter 选项 */
export function getHealingStatusFilters() {
    return Object.entries(INCIDENT_HEALING_MAP).map(([value, cfg]) => ({ label: cfg.text, value }));
}

// ==================== 刷新逻辑 ====================

function refresh() {
    const severity = getDictItems('incident_severity');
    if (severity?.length) {
        const map: Record<string, SeverityEntry> = {};
        const tagColors: Record<string, string> = {};
        severity.forEach(i => {
            map[i.dict_key] = { text: i.label, color: i.color || '#8c8c8c', tagColor: i.tag_color || 'default' };
            tagColors[i.dict_key] = i.badge || 'default';
        });
        // 添加数字别名
        Object.entries(NUMERIC_SEVERITY_ALIASES).forEach(([num, key]) => {
            if (map[key]) { map[num] = map[key]; tagColors[num] = tagColors[key]; }
        });
        INCIDENT_SEVERITY_MAP = map;
        SEVERITY_TAG_COLORS = tagColors;
    }

    const category = getDictItems('incident_category');
    if (category?.length) {
        CATEGORY_LABELS = toLabelsMap(category);
    }

    const status = getDictItems('incident_status');
    if (status?.length) {
        const map: Record<string, IncidentStatusEntry> = {};
        status.forEach(i => { map[i.dict_key] = { text: i.label, color: i.tag_color || 'default' }; });
        INCIDENT_STATUS_MAP = map;
    }

    const healing = getDictItems('healing_status');
    if (healing?.length) {
        const map: Record<string, HealingEntry> = {};
        const colors: Record<string, string> = {};
        const labels: Record<string, string> = {};
        healing.forEach(i => {
            map[i.dict_key] = { text: i.label, color: i.color || '#8c8c8c', badge: (i.badge || 'default') as 'success' | 'error' | 'warning' | 'processing' | 'default' };
            colors[i.dict_key] = i.color || '#8c8c8c';
            labels[i.dict_key] = i.label;
        });
        INCIDENT_HEALING_MAP = map;
        INCIDENT_CHART_COLORS = colors;
        INCIDENT_CHART_LABELS = labels;
    }
}

// 注册刷新回调
onDictRefresh(refresh);
// 立即尝试一次（如果缓存已加载）
refresh();
