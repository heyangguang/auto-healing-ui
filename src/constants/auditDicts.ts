/**
 * 审计日志字典值集中管理
 *
 * 所有审计日志相关的枚举映射（资源类型、操作类型、颜色等）统一在此文件定义。
 * 后端新增类型时，只需在此文件追加即可，各页面自动生效。
 */

/* ========== 资源类型 ========== */

/** 租户级资源类型 → 中文 */
export const TENANT_RESOURCE_LABELS: Record<string, string> = {
    auth: '认证',
    'auth-logout': '登出',
    channels: '通知渠道',
    cmdb: '资产管理',
    'execution-schedules': '定时任务',
    'execution-tasks': '执行任务',
    'git-repos': 'Git 仓库',
    healing: '自愈管理',
    'healing-flows': '自愈流程',
    'healing-rules': '自愈规则',
    'healing-approvals': '自愈审批',
    incidents: '事件管理',
    playbooks: 'Playbook',
    plugins: '插件管理',
    'secrets-sources': '密钥管理',
    'site-messages': '站内信',
    templates: '通知模板',
    users: '用户管理',
};

/** 平台级资源类型 → 中文 */
export const PLATFORM_RESOURCE_LABELS: Record<string, string> = {
    auth: '认证',
    'auth-profile': '个人资料',
    'auth-logout': '登出',
    'healing-approvals': '自愈审批',
    'healing-flows': '自愈流程',
    'healing-rules': '自愈规则',
    permissions: '权限管理',
    roles: '角色管理',
    settings: '平台设置',
    tenant: '租户',
    'tenant-users': '租户用户',
    tenants: '租户管理',
    users: '用户管理',
};

/** 全量资源类型 → 中文（合并租户 + 平台，用于个人中心/工作台等统一场景） */
export const ALL_RESOURCE_LABELS: Record<string, string> = {
    ...TENANT_RESOURCE_LABELS,
    ...PLATFORM_RESOURCE_LABELS,
};

/* ========== 操作类型 ========== */

/** 操作类型 → 中文标签 */
export const ACTION_LABELS: Record<string, string> = {
    activate: '激活',
    approve: '审批通过',
    assign_permission: '分配权限',
    assign_role: '分配角色',
    batch_create: '批量创建',
    confirm_review: '确认复核',
    create: '创建',
    deactivate: '停用',
    delete: '删除',
    disable: '禁用',
    dismiss: '驳回',
    enable: '启用',
    execute: '执行',
    login: '登录',
    logout: '登出',
    maintenance: '维护',
    preview: '预览',
    ready: '就绪',
    reject: '审批拒绝',
    reset_password: '重置密码',
    reset_scan: '重置扫描',
    resume: '恢复',
    scan: '扫描',
    sync: '同步',
    test: '测试',
    trigger: '触发',
    update: '更新',
    update_variables: '更新变量',
};

/** 操作类型 → Tag 颜色 */
export const ACTION_COLORS: Record<string, string> = {
    activate: 'green',
    approve: 'green',
    assign_permission: 'magenta',
    assign_role: 'magenta',
    batch_create: 'lime',
    confirm_review: 'cyan',
    create: 'green',
    deactivate: 'orange',
    delete: 'red',
    disable: 'orange',
    dismiss: 'volcano',
    enable: 'green',
    execute: 'geekblue',
    login: 'purple',
    logout: 'purple',
    maintenance: 'orange',
    preview: 'default',
    ready: 'cyan',
    reject: 'red',
    reset_password: 'orange',
    reset_scan: 'gold',
    resume: 'geekblue',
    scan: 'blue',
    sync: 'purple',
    test: 'default',
    trigger: 'gold',
    update: 'blue',
    update_variables: 'blue',
};

/** 操作类型 → 中文动词 + 颜色（用于个人中心活动流） */
export const ACTION_VERBS: Record<string, { verb: string; color: string }> = {
    activate: { verb: '激活了', color: '#52c41a' },
    approve: { verb: '通过了', color: '#52c41a' },
    assign_permission: { verb: '分配了权限', color: '#eb2f96' },
    assign_role: { verb: '分配了角色', color: '#eb2f96' },
    batch_create: { verb: '批量创建了', color: '#52c41a' },
    confirm_review: { verb: '确认复核了', color: '#13c2c2' },
    create: { verb: '创建了', color: '#52c41a' },
    deactivate: { verb: '停用了', color: '#fa8c16' },
    delete: { verb: '删除了', color: '#f5222d' },
    disable: { verb: '禁用了', color: '#fa8c16' },
    dismiss: { verb: '驳回了', color: '#fa541c' },
    enable: { verb: '启用了', color: '#52c41a' },
    execute: { verb: '执行了', color: '#fa8c16' },
    login: { verb: '登录了', color: '#722ed1' },
    logout: { verb: '登出了', color: '#722ed1' },
    maintenance: { verb: '维护了', color: '#fa8c16' },
    preview: { verb: '预览了', color: '#8c8c8c' },
    ready: { verb: '就绪了', color: '#13c2c2' },
    reject: { verb: '拒绝了', color: '#f5222d' },
    reset_password: { verb: '重置了密码', color: '#fa8c16' },
    reset_scan: { verb: '重置了扫描', color: '#faad14' },
    resume: { verb: '恢复了', color: '#1890ff' },
    scan: { verb: '扫描了', color: '#1890ff' },
    sync: { verb: '同步了', color: '#722ed1' },
    test: { verb: '测试了', color: '#8c8c8c' },
    trigger: { verb: '触发了', color: '#fa8c16' },
    update: { verb: '更新了', color: '#1890ff' },
    update_variables: { verb: '更新了变量', color: '#1890ff' },
};

/* ========== HTTP Method ========== */

/** HTTP Method → 颜色 */
export const HTTP_METHOD_COLORS: Record<string, string> = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    PATCH: '#50e3c2',
    DELETE: '#f93e3e',
};
