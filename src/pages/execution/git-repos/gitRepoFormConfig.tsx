import React from 'react';
import { GlobalOutlined, KeyOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

export type GitRepoFormValues = {
    auth_type?: string;
    default_branch?: string;
    interval_unit?: 'm' | 'h' | 'd';
    interval_value?: number;
    max_failures?: number;
    name?: string;
    passphrase?: string;
    password?: string;
    private_key?: string;
    sync_enabled?: boolean;
    token?: string;
    url?: string;
    username?: string;
};

type GitRepoUpdatePayloadOptions = {
    originalAuthType: string;
    values: GitRepoFormValues;
};

const DEFAULT_INTERVAL_VALUE = 1;
const DEFAULT_INTERVAL_UNIT: GitRepoFormValues['interval_unit'] = 'h';
const DEFAULT_MAX_FAILURES = 5;
const DEFAULT_AUTH_TYPE = 'none';
const SYNC_INTERVAL_PATTERN = /^(\d+)([mhd])$/;

export const authTypeOptions = [
    { value: 'none', label: '公开仓库', icon: <GlobalOutlined />, desc: '无需认证' },
    { value: 'token', label: 'Token', icon: <KeyOutlined />, desc: '访问令牌' },
    { value: 'password', label: '密码', icon: <LockOutlined />, desc: '用户名/密码' },
    { value: 'ssh_key', label: 'SSH', icon: <SafetyCertificateOutlined />, desc: 'SSH 密钥' },
];

export const syncIntervalOptions = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30];

export const gitRepoFormInitialValues: GitRepoFormValues = {
    auth_type: DEFAULT_AUTH_TYPE,
    interval_unit: DEFAULT_INTERVAL_UNIT,
    interval_value: DEFAULT_INTERVAL_VALUE,
    max_failures: DEFAULT_MAX_FAILURES,
    sync_enabled: false,
};

export function valuesChangedAuthType(current?: string, original?: string) {
    return (current || DEFAULT_AUTH_TYPE) !== (original || DEFAULT_AUTH_TYPE);
}

export function parseSyncInterval(syncInterval?: string) {
    const match = syncInterval?.match(SYNC_INTERVAL_PATTERN);
    if (!match) {
        return {
            intervalUnit: DEFAULT_INTERVAL_UNIT,
            intervalValue: DEFAULT_INTERVAL_VALUE,
        };
    }
    return {
        intervalUnit: match[2] as GitRepoFormValues['interval_unit'],
        intervalValue: Number(match[1]),
    };
}

export function buildSyncInterval(values: GitRepoFormValues) {
    return `${values.interval_value || DEFAULT_INTERVAL_VALUE}${values.interval_unit || DEFAULT_INTERVAL_UNIT}`;
}

function compactAuthConfig<T extends Record<string, string | undefined>>(authConfig: T): Partial<T> | undefined {
    const entries = Object.entries(authConfig).filter(([, value]) => value);
    if (entries.length === 0) {
        return undefined;
    }
    return Object.fromEntries(entries) as Partial<T>;
}

function buildFreshAuthConfig(values: GitRepoFormValues) {
    if (values.auth_type === 'token') {
        return compactAuthConfig({ token: values.token });
    }
    if (values.auth_type === 'password') {
        return compactAuthConfig({ password: values.password, username: values.username });
    }
    if (values.auth_type === 'ssh_key') {
        return compactAuthConfig({ passphrase: values.passphrase, private_key: values.private_key });
    }
    return undefined;
}

export function buildValidateRequest(values: GitRepoFormValues) {
    return {
        url: values.url || '',
        auth_type: values.auth_type || DEFAULT_AUTH_TYPE,
        auth_config: buildFreshAuthConfig(values),
    };
}

function buildUpdateAuthConfig(options: GitRepoUpdatePayloadOptions) {
    const { originalAuthType, values } = options;
    if (values.auth_type === 'none') {
        return {};
    }
    if (values.auth_type === 'token') {
        if (originalAuthType === 'token' && !values.token) return undefined;
        return compactAuthConfig({ token: values.token });
    }
    if (values.auth_type === 'password') {
        if (originalAuthType === 'password' && !values.username && !values.password) return undefined;
        return compactAuthConfig({ password: values.password, username: values.username });
    }
    if (values.auth_type === 'ssh_key') {
        if (originalAuthType === 'ssh_key' && !values.private_key && !values.passphrase) return undefined;
        return compactAuthConfig({ passphrase: values.passphrase, private_key: values.private_key });
    }
    return undefined;
}

export function buildCreateGitRepoPayload(values: GitRepoFormValues): AutoHealing.CreateGitRepoRequest {
    return {
        auth_config: buildFreshAuthConfig(values),
        auth_type: (values.auth_type || DEFAULT_AUTH_TYPE) as AutoHealing.GitAuthType,
        default_branch: values.default_branch || '',
        max_failures: Number(values.max_failures) || 0,
        name: values.name || '',
        sync_enabled: values.sync_enabled || false,
        sync_interval: buildSyncInterval(values),
        url: values.url || '',
    };
}

export function buildUpdateGitRepoPayload(options: GitRepoUpdatePayloadOptions): AutoHealing.UpdateGitRepoRequest {
    const { values } = options;
    return {
        auth_config: buildUpdateAuthConfig(options),
        auth_type: (values.auth_type || DEFAULT_AUTH_TYPE) as AutoHealing.GitAuthType,
        default_branch: values.default_branch || '',
        max_failures: Number(values.max_failures) || 0,
        sync_enabled: values.sync_enabled || false,
        sync_interval: buildSyncInterval(values),
    };
}
