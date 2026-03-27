import React from 'react';
import { FileOutlined, GlobalOutlined, KeyOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type {
    SecretFormValues,
    SecretsSourceConfig,
    SecretsSourceRecord,
    VaultAuthType,
    WebhookAuthType,
    WebhookMethod,
} from './secretFormTypes';
export type {
    BuildSecretsPayloadOptions,
    SecretFormValues,
    SecretsSourceConfig,
    SecretsSourceRecord,
    VaultAuthType,
    WebhookAuthType,
    WebhookMethod,
} from './secretFormTypes';
export { buildSecretsSourcePayload } from './secretFormPayload';

export const SOURCE_TYPES = [
    { value: 'file', label: '本地密钥文件', icon: <FileOutlined />, supportPassword: false },
    { value: 'vault', label: 'HashiCorp Vault', icon: <SafetyCertificateOutlined />, supportPassword: true },
    { value: 'webhook', label: 'Webhook', icon: <GlobalOutlined />, supportPassword: true },
];

export const AUTH_TYPES = [
    { value: 'ssh_key', label: 'SSH 密钥', icon: <KeyOutlined /> },
    { value: 'password', label: '密码认证', icon: <LockOutlined /> },
];

export const VAULT_AUTH_TYPES = [
    { value: 'token', label: 'Token' },
    { value: 'approle', label: 'AppRole' },
];

export const WEBHOOK_AUTH_TYPES = [
    { value: 'none', label: '无认证' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];

export function hasFormErrorFields(error: unknown): error is { errorFields: unknown[] } {
    return typeof error === 'object' && error !== null && 'errorFields' in error;
}

export function normalizeVaultAuthType(value?: string): VaultAuthType {
    return value === 'approle' ? 'approle' : 'token';
}

export function normalizeWebhookAuthType(value?: string): WebhookAuthType {
    if (value === 'basic' || value === 'bearer' || value === 'api_key') {
        return value;
    }
    return 'none';
}

export function normalizeWebhookMethod(value?: string): WebhookMethod {
    return value === 'GET' ? 'GET' : 'POST';
}

export function getSecretFormInitialValues(): Partial<SecretFormValues> {
    return {
        auth_type: 'ssh_key',
        is_default: false,
        priority: 100,
        type: 'file',
        vault_auth_type: 'token',
        webhook_auth_type: 'none',
        webhook_method: 'POST',
    };
}

export function getAvailableSourceTypes(authType: string) {
    return SOURCE_TYPES.filter((item) => authType === 'ssh_key' || item.supportPassword);
}

export function mapSecretsSourceToFormValues(source: SecretsSourceRecord): Partial<SecretFormValues> {
    const config = source.config || {};
    return {
        auth_type: source.auth_type,
        file_key_path: config.key_path || (config as SecretsSourceConfig & { path?: string }).path,
        file_username: config.username,
        is_default: source.is_default,
        name: source.name,
        priority: source.priority,
        type: source.type,
        vault_address: config.address,
        vault_auth_type: normalizeVaultAuthType(config.auth?.type),
        vault_field_password: config.field_mapping?.password,
        vault_field_private_key: config.field_mapping?.private_key,
        vault_field_username: config.field_mapping?.username,
        vault_query_key: config.query_key,
        vault_role_id: config.auth?.role_id,
        vault_secret_path: config.secret_path || (config as SecretsSourceConfig & { path_template?: string }).path_template,
        webhook_api_key_header: config.auth?.header_name,
        webhook_auth_type: normalizeWebhookAuthType(config.auth?.type),
        webhook_basic_username: config.auth?.username,
        webhook_field_password: config.field_mapping?.password,
        webhook_field_private_key: config.field_mapping?.private_key,
        webhook_field_username: config.field_mapping?.username,
        webhook_method: normalizeWebhookMethod(config.method),
        webhook_query_key: config.query_key,
        webhook_response_path: config.response_data_path,
        webhook_url: config.url,
    };
}
