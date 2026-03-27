/**
 * 审计日志字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

const FB_TENANT_RESOURCE: Record<string, string> = {
    auth: '认证', 'auth-logout': '登出', 'auth-profile': '个人资料',
    'common-user': '用户偏好',
    'common-workbench': '工作台',
    'common-search': '全局搜索',
    channels: '通知渠道', cmdb: '资产管理', dashboard: '监控面板',
    'execution-schedules': '定时任务', 'execution-tasks': '执行任务',
    'execution-runs': '执行记录', 'git-repos': '代码仓库',
    healing: '自愈管理', 'healing-flows': '自愈流程',
    'healing-rules': '自愈规则', 'healing-approvals': '审批任务',
    'healing-instances': '自愈实例', incidents: '事件工单',
    notifications: '通知记录', playbooks: '自动化剧本', plugins: '插件管理',
    'secrets-sources': '凭据管理', 'site-messages': '站内信',
    templates: '通知模板', 'tenant-impersonation': '临时提权',
    'tenant-users': '用户管理', 'tenant-roles': '角色管理',
    'tenant-permissions': '权限管理', 'tenant-plugins': '插件管理',
    'tenant-incidents': '事件工单', 'tenant-cmdb': '资产管理',
    'tenant-secrets-sources': '凭据管理', 'tenant-site-messages': '站内信',
    'tenant-command-blacklist': '命令黑名单', 'tenant-blacklist-exemptions': '豁免规则',
    'tenant-settings': '租户设置',
    user: '用户', users: '用户管理',
    'command-blacklist': '命令黑名单', 'blacklist-exemptions': '豁免规则',
    common: '通用操作',
};

const FB_PLATFORM_RESOURCE: Record<string, string> = {
    auth: '认证', 'auth-profile': '个人资料', 'auth-logout': '登出',
    'execution-tasks': '执行任务', 'healing-approvals': '自愈审批',
    'healing-flows': '自愈流程', 'healing-rules': '自愈规则',
    impersonation: '临时提权', incidents: '事件管理',
    permissions: '权限管理', plugins: '插件管理', roles: '角色管理',
    settings: '平台设置', 'site-messages': '站内信',
    tenant: '租户', 'tenant-impersonation': '临时提权',
    'tenant-users': '租户用户', 'tenant-roles': '租户角色',
    'tenant-blacklist-exemptions': '豁免规则', 'tenant-command-blacklist': '命令黑名单',
    tenants: '租户管理', users: '用户管理',
    'command-blacklist': '命令黑名单', 'blacklist-exemptions': '豁免规则',
    dictionaries: '字典管理',
    common: '通用操作', 'git-repos': '代码仓库',
    playbooks: '自动化剧本',
};

const FB_ACTION_LABELS: Record<string, string> = {
    activate: '激活', approve: '审批通过', assign_permission: '分配权限',
    assign_role: '分配角色', batch_create: '批量创建', confirm_review: '确认复核',
    create: '创建', deactivate: '停用', delete: '删除', disable: '禁用',
    dismiss: '驳回', enable: '启用', execute: '执行', login: '登录',
    logout: '登出', impersonation_enter: '提权进入', impersonation_exit: '提权退出',
    impersonation_terminate: '提权终止',
    maintenance: '维护', preview: '预览', ready: '就绪',
    reject: '审批拒绝', reset_password: '重置密码', reset_scan: '重置扫描',
    resume: '恢复', scan: '扫描', sync: '同步', test: '测试',
    trigger: '触发', update: '更新', update_variables: '更新变量',
};

const FB_ACTION_COLORS: Record<string, string> = {
    activate: 'green', approve: 'green', assign_permission: 'magenta',
    assign_role: 'magenta', batch_create: 'lime', confirm_review: 'cyan',
    create: 'green', deactivate: 'orange', delete: 'red', disable: 'orange',
    dismiss: 'volcano', enable: 'green', execute: 'geekblue', login: 'purple',
    logout: 'purple', impersonation_enter: 'purple', impersonation_exit: 'default',
    impersonation_terminate: 'red',
    maintenance: 'orange', preview: 'default', ready: 'cyan',
    reject: 'red', reset_password: 'orange', reset_scan: 'gold',
    resume: 'geekblue', scan: 'blue', sync: 'purple', test: 'default',
    trigger: 'gold', update: 'blue', update_variables: 'blue',
};

const FB_ACTION_VERBS: Record<string, { verb: string; color: string }> = {
    activate: { verb: '激活了', color: '#52c41a' }, approve: { verb: '通过了', color: '#52c41a' },
    assign_permission: { verb: '分配了权限', color: '#eb2f96' }, assign_role: { verb: '分配了角色', color: '#eb2f96' },
    batch_create: { verb: '批量创建了', color: '#52c41a' }, confirm_review: { verb: '确认复核了', color: '#13c2c2' },
    create: { verb: '创建了', color: '#52c41a' }, deactivate: { verb: '停用了', color: '#fa8c16' },
    delete: { verb: '删除了', color: '#f5222d' }, disable: { verb: '禁用了', color: '#fa8c16' },
    dismiss: { verb: '驳回了', color: '#fa541c' }, enable: { verb: '启用了', color: '#52c41a' },
    execute: { verb: '执行了', color: '#fa8c16' }, login: { verb: '登录了', color: '#722ed1' },
    logout: { verb: '登出了', color: '#722ed1' },
    impersonation_enter: { verb: '提权进入了', color: '#722ed1' },
    impersonation_exit: { verb: '提权退出了', color: '#722ed1' },
    impersonation_terminate: { verb: '终止了提权', color: '#f5222d' },
    maintenance: { verb: '维护了', color: '#fa8c16' },
    preview: { verb: '预览了', color: '#8c8c8c' }, ready: { verb: '就绪了', color: '#13c2c2' },
    reject: { verb: '拒绝了', color: '#f5222d' }, reset_password: { verb: '重置了密码', color: '#fa8c16' },
    reset_scan: { verb: '重置了扫描', color: '#faad14' }, resume: { verb: '恢复了', color: '#1890ff' },
    scan: { verb: '扫描了', color: '#1890ff' }, sync: { verb: '同步了', color: '#722ed1' },
    test: { verb: '测试了', color: '#8c8c8c' }, trigger: { verb: '触发了', color: '#fa8c16' },
    update: { verb: '更新了', color: '#1890ff' }, update_variables: { verb: '更新了变量', color: '#1890ff' },
};

const FB_HTTP_COLORS: Record<string, string> = {
    GET: '#61affe', POST: '#49cc90', PUT: '#fca130', PATCH: '#50e3c2', DELETE: '#f93e3e',
};

// ==================== 动态变量 ====================

/* ========== 资源类型 ========== */
export let TENANT_RESOURCE_LABELS: Record<string, string> = { ...FB_TENANT_RESOURCE };
export let PLATFORM_RESOURCE_LABELS: Record<string, string> = { ...FB_PLATFORM_RESOURCE };
export let ALL_RESOURCE_LABELS: Record<string, string> = { ...FB_TENANT_RESOURCE, ...FB_PLATFORM_RESOURCE };

/* ========== 操作类型 ========== */
export let ACTION_LABELS: Record<string, string> = { ...FB_ACTION_LABELS };
export let ACTION_COLORS: Record<string, string> = { ...FB_ACTION_COLORS };
export let ACTION_VERBS: Record<string, { verb: string; color: string }> = { ...FB_ACTION_VERBS };

/* ========== HTTP Method ========== */
export let HTTP_METHOD_COLORS: Record<string, string> = { ...FB_HTTP_COLORS };

// ==================== 刷新逻辑 ====================

function refresh() {
    // 审计资源类型
    const tenantRes = getDictItems('audit_resource_tenant');
    if (tenantRes?.length) {
        // 合并到硬编码兜底之上，保留两种 key 格式
        const map: Record<string, string> = { ...FB_TENANT_RESOURCE };
        tenantRes.forEach(i => { map[i.dict_key] = i.label; });
        TENANT_RESOURCE_LABELS = map;
    }

    const platformRes = getDictItems('audit_resource_platform');
    if (platformRes?.length) {
        // 合并到硬编码兜底之上，保留两种 key 格式（带/不带 platform- 前缀）
        const map: Record<string, string> = { ...FB_PLATFORM_RESOURCE };
        platformRes.forEach(i => { map[i.dict_key] = i.label; });
        PLATFORM_RESOURCE_LABELS = map;
    }

    ALL_RESOURCE_LABELS = { ...TENANT_RESOURCE_LABELS, ...PLATFORM_RESOURCE_LABELS };

    // 审计操作类型
    const actions = getDictItems('audit_action');
    if (actions?.length) {
        const labels: Record<string, string> = {};
        const colors: Record<string, string> = {};
        const verbs: Record<string, { verb: string; color: string }> = {};
        actions.forEach(i => {
            labels[i.dict_key] = i.label;
            colors[i.dict_key] = i.tag_color || 'default';
            // 中文动词：label + "了"
            const existingVerb = FB_ACTION_VERBS[i.dict_key];
            verbs[i.dict_key] = {
                verb: existingVerb?.verb || (`${i.label}了`),
                color: i.color || existingVerb?.color || '#8c8c8c',
            };
        });
        ACTION_LABELS = labels;
        ACTION_COLORS = colors;
        ACTION_VERBS = verbs;
    }

    // HTTP Method
    const methods = getDictItems('http_method');
    if (methods?.length) {
        const colors: Record<string, string> = {};
        methods.forEach(i => { colors[i.dict_key] = i.color || '#8c8c8c'; });
        HTTP_METHOD_COLORS = colors;
    }
}

onDictRefresh(refresh);
refresh();
