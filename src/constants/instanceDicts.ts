/**
 * 自愈实例（Healing Instance）相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

const FB_COLORS: Record<string, string> = {
    completed: '#52c41a', running: '#1677ff', pending: '#faad14',
    failed: '#ff4d4f', skipped: '#8c8c8c', cancelled: '#d9d9d9',
    waiting_approval: '#722ed1',
};

const FB_LABELS: Record<string, string> = {
    pending: '等待中', running: '执行中', waiting_approval: '待审批',
    completed: '已完成', success: '成功', approved: '已通过',
    failed: '失败', rejected: '已拒绝', error: '错误',
    partial: '部分成功', cancelled: '已取消', skipped: '已跳过',
    simulated: '模拟通过', triggered: '已触发',
};

const FB_MAP: Record<string, { color: string; text: string; bg?: string }> = {
    completed: { color: 'success', text: '完成', bg: '#f6ffed' },
    running: { color: 'processing', text: '运行中', bg: '#e6f7ff' },
    pending: { color: 'warning', text: '待处理', bg: '#fffbe6' },
    failed: { color: 'error', text: '失败', bg: '#fff2f0' },
    skipped: { color: 'default', text: '跳过', bg: '#fafafa' },
    cancelled: { color: 'default', text: '取消', bg: '#fafafa' },
    waiting_approval: { color: 'warning', text: '待审批', bg: '#fffbe6' },
};

// ==================== 动态变量 ====================

export let INSTANCE_STATUS_COLORS: Record<string, string> = { ...FB_COLORS };
export let INSTANCE_STATUS_LABELS: Record<string, string> = { ...FB_LABELS };
export let INSTANCE_STATUS_MAP: Record<string, { color: string; text: string; bg?: string }> = { ...FB_MAP };

// ==================== 刷新逻辑 ====================

function refresh() {
    const items = getDictItems('instance_status');
    if (items?.length) {
        const colors: Record<string, string> = {};
        const labels: Record<string, string> = {};
        const map: Record<string, { color: string; text: string; bg?: string }> = {};
        items.forEach(i => {
            colors[i.dict_key] = i.color || '#8c8c8c';
            labels[i.dict_key] = i.label;
            map[i.dict_key] = { color: i.tag_color || 'default', text: i.label, bg: i.bg || '' };
        });
        INSTANCE_STATUS_COLORS = { ...FB_COLORS, ...colors };
        INSTANCE_STATUS_LABELS = { ...FB_LABELS, ...labels };
        INSTANCE_STATUS_MAP = { ...FB_MAP, ...map };
    }

    // 合并 node_status 和 approval_status 到 LABELS（实例详情页用）
    const nodeStatus = getDictItems('node_status');
    if (nodeStatus?.length) {
        nodeStatus.forEach(i => {
            INSTANCE_STATUS_LABELS[i.dict_key] = INSTANCE_STATUS_LABELS[i.dict_key] || i.label;
        });
    }
    const approvalStatus = getDictItems('approval_status');
    if (approvalStatus?.length) {
        approvalStatus.forEach(i => {
            INSTANCE_STATUS_LABELS[i.dict_key] = INSTANCE_STATUS_LABELS[i.dict_key] || i.label;
        });
    }
}

onDictRefresh(refresh);
refresh();

/* ========== Select Options 辅助 ========== */

/** 实例状态下拉选项（主要用于筛选器） */
export function getInstanceStatusOptions() {
    return Object.entries(INSTANCE_STATUS_MAP).map(([value, cfg]) => ({ label: cfg.text, value }));
}
