/**
 * 通用/跨模块字典值
 *
 * 覆盖多个页面共用的状态类型：
 * - 通知日志状态 (notification_log_status)
 * - 审计结果 (audit_result)
 * - 审计风险等级 (audit_risk_level)
 * - 用户状态 (user_status)
 * - 通用启停状态 (enabled_status)
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

const FB_NOTIF_LOG_STATUS: Record<string, { color: string; text: string }> = {
    sent: { color: 'success', text: '已发送' },
    failed: { color: 'error', text: '失败' },
    pending: { color: 'processing', text: '发送中' },
};

const FB_AUDIT_RESULT: Array<{ label: string; value: string }> = [
    { label: '成功', value: 'success' },
    { label: '失败', value: 'failed' },
];

const FB_RISK_LEVEL: Array<{ label: string; value: string }> = [
    { label: '极高', value: 'critical' },
    { label: '高危', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' },
];

const FB_USER_STATUS: Array<{ label: string; value: string }> = [
    { label: '正常', value: 'active' },
    { label: '已锁定', value: 'locked' },
    { label: '已禁用', value: 'inactive' },
];

const FB_USER_STATUS_MAP: Record<string, { label: string; color: string; tagColor: string; badge: string }> = {
    active: { label: '正常', color: '#52c41a', tagColor: 'success', badge: 'success' },
    locked: { label: '已锁定', color: '#fa8c16', tagColor: 'warning', badge: 'warning' },
    inactive: { label: '已禁用', color: '#8c8c8c', tagColor: 'default', badge: 'default' },
    disabled: { label: '已禁用', color: '#d9d9d9', tagColor: 'default', badge: 'default' },
};

// ==================== 动态变量 ====================

/** 通知日志状态 */
export let NOTIF_LOG_STATUS_MAP: Record<string, { color: string; text: string }> = { ...FB_NOTIF_LOG_STATUS };

/** 审计结果 options */
export let AUDIT_RESULT_OPTIONS: Array<{ label: string; value: string }> = [...FB_AUDIT_RESULT];

/** 审计风险等级 options */
export let RISK_LEVEL_OPTIONS: Array<{ label: string; value: string }> = [...FB_RISK_LEVEL];

/** 用户状态 options */
export let USER_STATUS_OPTIONS: Array<{ label: string; value: string }> = [...FB_USER_STATUS];

/** 用户状态 map（key → label/color/tagColor/badge） */
export let USER_STATUS_MAP: Record<string, { label: string; color: string; tagColor: string; badge: string }> = { ...FB_USER_STATUS_MAP };

// ==================== 刷新逻辑 ====================

function refresh() {
    const notifLog = getDictItems('notification_log_status');
    if (notifLog?.length) {
        const map: Record<string, any> = {};
        notifLog.forEach(i => {
            map[i.dict_key] = { color: i.tag_color || 'default', text: i.label };
        });
        NOTIF_LOG_STATUS_MAP = map;
    }

    const auditResult = getDictItems('audit_result');
    if (auditResult?.length) {
        AUDIT_RESULT_OPTIONS = auditResult.map(i => ({ label: i.label, value: i.dict_key }));
    }

    const riskLevel = getDictItems('audit_risk_level');
    if (riskLevel?.length) {
        RISK_LEVEL_OPTIONS = riskLevel.map(i => ({ label: i.label, value: i.dict_key }));
    }

    const userStatus = getDictItems('user_status');
    if (userStatus?.length) {
        USER_STATUS_OPTIONS = userStatus.map(i => ({ label: i.label, value: i.dict_key }));
        const map: Record<string, any> = {};
        userStatus.forEach(i => {
            map[i.dict_key] = {
                label: i.label,
                color: i.color || '#8c8c8c',
                tagColor: i.tag_color || 'default',
                badge: i.badge || 'default',
            };
        });
        USER_STATUS_MAP = map;
    }
}

onDictRefresh(refresh);
refresh();
