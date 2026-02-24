/**
 * 权限模块（Permission Module）相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

const FB_LABELS: Record<string, string> = {
    system: '系统管理', user: '用户管理', role: '角色权限',
    plugin: '插件管理', execution: '执行管理', notification: '通知管理',
    healing: '自愈管理', workflow: '工作流', dashboard: '仪表板',
    platform: '平台管理', 'site-message': '站内信', tenant: '租户管理',
    audit: '审计日志', channel: '通知渠道', playbook: '自动化剧本',
    repository: '代码仓库', task: '任务管理', template: '模板管理',
    security: '安全防护',
};

const FB_META: Record<string, { label: string; color: string }> = {
    system: { label: '系统管理', color: '#722ed1' },
    user: { label: '用户管理', color: '#1677ff' },
    role: { label: '角色权限', color: '#9254de' },
    plugin: { label: '插件管理', color: '#52c41a' },
    execution: { label: '执行管理', color: '#fa8c16' },
    notification: { label: '通知管理', color: '#eb2f96' },
    healing: { label: '自愈管理', color: '#52c41a' },
    workflow: { label: '工作流', color: '#1677ff' },
    dashboard: { label: '仪表板', color: '#faad14' },
    platform: { label: '平台管理', color: '#531dab' },
    'site-message': { label: '站内信', color: '#08979c' },
    tenant: { label: '租户管理', color: '#13c2c2' },
    audit: { label: '审计日志', color: '#8c8c8c' },
    channel: { label: '通知渠道', color: '#eb2f96' },
    playbook: { label: '自动化剧本', color: '#fa541c' },
    repository: { label: '代码仓库', color: '#2f54eb' },
    task: { label: '任务管理', color: '#fa8c16' },
    template: { label: '模板管理', color: '#13c2c2' },
    security: { label: '安全防护', color: '#f5222d' },
};

// ==================== 动态变量 ====================

export let PERMISSION_MODULE_LABELS: Record<string, string> = { ...FB_LABELS };
export let PERMISSION_MODULE_META: Record<string, { label: string; color: string }> = { ...FB_META };

// ==================== 刷新逻辑 ====================

function refresh() {
    const items = getDictItems('permission_module');
    if (items?.length) {
        const labels: Record<string, string> = {};
        const meta: Record<string, { label: string; color: string }> = {};
        items.forEach(i => {
            labels[i.dict_key] = i.label;
            meta[i.dict_key] = { label: i.label, color: i.color || '#8c8c8c' };
        });
        // 合并：硬编码兜底 + 字典数据覆盖（确保字典缺失时不丢失中文）
        PERMISSION_MODULE_LABELS = { ...FB_LABELS, ...labels };
        PERMISSION_MODULE_META = { ...FB_META, ...meta };
    }
}

onDictRefresh(refresh);
refresh();
