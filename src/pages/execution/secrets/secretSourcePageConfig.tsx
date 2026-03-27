import React from 'react';
import {
    FileOutlined,
    GlobalOutlined,
    KeyOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import {
    CREDENTIAL_TYPE_OPTIONS,
    SECRETS_SOURCE_OPTIONS,
    SECRETS_STATUS_OPTIONS,
} from '@/constants/secretsDicts';

export type SecretsStatsSummary = {
    active: number;
    file: number;
    total: number;
    vault: number;
    webhook: number;
};

export const SOURCE_TYPES = [
    { value: 'file', label: '本地密钥文件', icon: <FileOutlined />, color: '#1890ff', bgColor: '#e6f7ff', desc: '从本地密钥文件读取凭据（仅支持SSH Key）', supportPassword: false },
    { value: 'vault', label: 'HashiCorp Vault', icon: <SafetyCertificateOutlined />, color: '#722ed1', bgColor: '#f9f0ff', desc: '从 Vault 安全存储获取凭据', supportPassword: true },
    { value: 'webhook', label: 'Webhook', icon: <GlobalOutlined />, color: '#52c41a', bgColor: '#f6ffed', desc: '通过外部 HTTP 服务获取凭据', supportPassword: true },
];

export const AUTH_TYPES = [
    { value: 'ssh_key', label: 'SSH 密钥', icon: <KeyOutlined />, color: '#1890ff' },
    { value: 'password', label: '密码认证', icon: <LockOutlined />, color: '#fa8c16' },
];

export const searchFields: SearchField[] = [
    { key: 'name', label: '密钥源名称', description: '按密钥源名称模糊搜索' },
];

export const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '密钥源名称', type: 'input', placeholder: '密钥源名称' },
    { key: 'type', label: '密钥源类型', type: 'select', placeholder: '全部类型', options: SECRETS_SOURCE_OPTIONS },
    { key: 'auth_type', label: '认证方式', type: 'select', placeholder: '全部认证', options: CREDENTIAL_TYPE_OPTIONS },
    { key: 'status', label: '密钥源状态', type: 'select', placeholder: '全部状态', options: SECRETS_STATUS_OPTIONS },
];

export const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>密钥库图标</title>
        <rect x="6" y="20" width="36" height="22" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M16 20V14a8 8 0 0116 0v6" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="24" cy="31" r="3" fill="currentColor" opacity="0.6" />
        <line x1="24" y1="34" x2="24" y2="37" stroke="currentColor" strokeWidth="2" />
    </svg>
);

export function getSourceTypeConfig(type: string) {
    return SOURCE_TYPES.find((item) => item.value === type) || SOURCE_TYPES[0];
}

export function getAuthTypeConfig(authType: string) {
    return AUTH_TYPES.find((item) => item.value === authType) || AUTH_TYPES[0];
}

export function sortSecretsSources(items: AutoHealing.SecretsSource[]) {
    return [...items].sort((left, right) => {
        if (left.is_default && !right.is_default) return -1;
        if (!left.is_default && right.is_default) return 1;
        return (left.priority || 0) - (right.priority || 0);
    });
}

export function summarizeSecretsSources(items: AutoHealing.SecretsSource[]) {
    const count = (predicate: (item: AutoHealing.SecretsSource) => boolean) => items.filter(predicate).length;
    return {
        active: count((item) => item.status === 'active'),
        file: count((item) => item.type === 'file'),
        total: items.length,
        vault: count((item) => item.type === 'vault'),
        webhook: count((item) => item.type === 'webhook'),
    };
}

export function filterSecretsSources(
    items: AutoHealing.SecretsSource[],
    advancedSearch?: Record<string, unknown>,
    searchValue?: string,
    searchField?: string,
) {
    let filtered = [...items];
    if (searchValue) {
        const keyword = searchValue.toLowerCase();
        if (searchField === 'type' || searchField === 'auth_type' || searchField === 'status') {
            filtered = filtered.filter((item) => String(item[searchField] || '').toLowerCase().includes(keyword));
        } else {
            filtered = filtered.filter((item) => item.name.toLowerCase().includes(keyword));
        }
    }
    if (!advancedSearch) {
        return filtered;
    }
    const search = advancedSearch;
    if (search.name) {
        const keyword = String(search.name).toLowerCase();
        filtered = filtered.filter((item) => item.name.toLowerCase().includes(keyword));
    }
    if (search.name__exact) {
        filtered = filtered.filter((item) => item.name === search.name__exact);
    }
    if (search.type) {
        filtered = filtered.filter((item) => item.type === search.type);
    }
    if (search.auth_type) {
        filtered = filtered.filter((item) => item.auth_type === search.auth_type);
    }
    if (search.status) {
        filtered = filtered.filter((item) => item.status === search.status);
    }
    return filtered;
}
