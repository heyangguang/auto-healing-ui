/**
 * Git 仓库相关字典值
 *
 * 将 git-repos/index.tsx 中重复出现的 options 集中管理
 */

// ==================== Repo 状态选项 ====================
export const REPO_STATUS_OPTIONS = [
    { label: '就绪', value: 'ready' },
    { label: '待同步', value: 'pending' },
    { label: '同步中', value: 'syncing' },
    { label: '错误', value: 'error' },
];

// ==================== 认证方式选项 ====================
export const AUTH_TYPE_OPTIONS = [
    { label: '公开', value: 'none' },
    { label: 'Token', value: 'token' },
    { label: '密码', value: 'password' },
    { label: 'SSH', value: 'ssh_key' },
];

// ==================== 同步开关选项 ====================
export const SYNC_ENABLED_OPTIONS = [
    { label: '已开启', value: 'true' },
    { label: '未开启', value: 'false' },
];
