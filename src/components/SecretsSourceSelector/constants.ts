export const TYPE_MAP: Record<string, { label: string; color: string }> = {
    vault: { label: 'Vault', color: '#722ed1' },
    file: { label: '文件', color: '#1890ff' },
    webhook: { label: 'Webhook', color: '#13c2c2' },
};

export const AUTH_MAP: Record<string, string> = {
    ssh_key: 'SSH Key',
    password: 'Password',
};

export const TYPE_OPTIONS = [
    { label: '全部类型', value: 'all' },
    { label: 'Vault', value: 'vault' },
    { label: '文件', value: 'file' },
    { label: 'Webhook', value: 'webhook' },
];

export const AUTH_OPTIONS = [
    { label: '全部认证', value: 'all' },
    { label: 'SSH Key', value: 'ssh_key' },
    { label: 'Password', value: 'password' },
];

export const ROW_HEIGHT = 44;
