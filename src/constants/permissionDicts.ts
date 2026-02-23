/**
 * 权限模块（Permission Module）相关字典值集中管理
 *
 * 后端权限按 module 分组（如 system、user、healing 等），
 * 此文件提供统一的中文标签和颜色映射。
 * 后端新增模块时，只需在此文件追加即可。
 */

/** 权限模块 → 中文标签 */
export const PERMISSION_MODULE_LABELS: Record<string, string> = {
    system: '系统管理',
    user: '用户管理',
    role: '角色管理',
    plugin: '插件管理',
    execution: '执行管理',
    notification: '通知管理',
    healing: '自愈引擎',
    workflow: '工作流',
    dashboard: '仪表盘',
    platform: '平台管理',
    'site-message': '站内信',
};

/** 权限模块 → 中文标签 + 颜色（用于权限列表页卡片分组） */
export const PERMISSION_MODULE_META: Record<string, { label: string; color: string }> = {
    system: { label: '系统管理', color: '#722ed1' },
    user: { label: '用户管理', color: '#1677ff' },
    role: { label: '角色管理', color: '#13c2c2' },
    plugin: { label: '插件管理', color: '#52c41a' },
    execution: { label: '执行管理', color: '#fa8c16' },
    notification: { label: '通知管理', color: '#eb2f96' },
    healing: { label: '自愈引擎', color: '#f5222d' },
    workflow: { label: '工作流', color: '#2f54eb' },
    dashboard: { label: '仪表盘', color: '#faad14' },
    platform: { label: '平台管理', color: '#531dab' },
    'site-message': { label: '站内信', color: '#08979c' },
};
