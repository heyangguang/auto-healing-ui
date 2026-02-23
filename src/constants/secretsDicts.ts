/**
 * 密钥管理相关字典值
 *
 * 将 secrets/index.tsx 中重复出现的 options 集中管理
 */

// ==================== 密钥源类型选项 ====================
export const SECRETS_SOURCE_OPTIONS = [
    { label: '本地文件', value: 'file' },
    { label: 'Vault', value: 'vault' },
    { label: 'Webhook', value: 'webhook' },
];

// ==================== 凭据类型选项 ====================
export const CREDENTIAL_TYPE_OPTIONS = [
    { label: 'SSH 密钥', value: 'ssh_key' },
    { label: '密码', value: 'password' },
];

// ==================== 密钥状态选项 ====================
export const SECRETS_STATUS_OPTIONS = [
    { label: '已启用', value: 'active' },
    { label: '已禁用', value: 'inactive' },
];
