import type { BuildSecretsPayloadOptions, SecretFormValues, SecretsSourceConfig } from './secretFormTypes';

function pickDefinedFields<T extends Record<string, unknown>>(fields: T): Partial<T> | undefined {
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined && value !== '');
    if (entries.length === 0) {
        return undefined;
    }
    return Object.fromEntries(entries) as Partial<T>;
}

function preserveSecretValue(options: {
    fieldLabel: string;
    isEdit: boolean;
    nextValue?: string;
    originalType?: string;
    originalValue?: string;
    targetType: string;
}) {
    const { fieldLabel, isEdit, nextValue, originalType, originalValue, targetType } = options;
    if (nextValue) {
        return nextValue;
    }
    if (isEdit && originalType === targetType) {
        if (!originalValue) {
            throw new Error(`${fieldLabel} 未返回原始值，请重新输入后再保存`);
        }
        return originalValue;
    }
    return undefined;
}

function buildFieldMapping(fields: {
    password?: string;
    privateKey?: string;
    username?: string;
}) {
    return pickDefinedFields({
        password: fields.password,
        private_key: fields.privateKey,
        username: fields.username,
    });
}

function buildVaultAuthConfig(options: BuildSecretsPayloadOptions): SecretsSourceConfig['auth'] {
    const { isEdit, originalConfig, values } = options;
    const originalAuth = originalConfig.auth || {};
    if (values.vault_auth_type === 'token') {
        return pickDefinedFields({
            token: preserveSecretValue({
                fieldLabel: 'Vault Token',
                isEdit,
                nextValue: values.vault_token,
                originalType: originalAuth.type,
                originalValue: originalAuth.token,
                targetType: 'token',
            }),
            type: values.vault_auth_type,
        });
    }
    return pickDefinedFields({
        role_id: values.vault_role_id,
        secret_id: preserveSecretValue({
            fieldLabel: 'Secret ID',
            isEdit,
            nextValue: values.vault_secret_id,
            originalType: originalAuth.type,
            originalValue: originalAuth.secret_id,
            targetType: 'approle',
        }),
        type: values.vault_auth_type,
    });
}

function buildVaultConfig(options: BuildSecretsPayloadOptions): SecretsSourceConfig {
    const { values } = options;
    return {
        address: values.vault_address,
        auth: buildVaultAuthConfig(options),
        field_mapping: buildFieldMapping({
            password: values.vault_field_password,
            privateKey: values.vault_field_private_key,
            username: values.vault_field_username,
        }),
        query_key: values.vault_query_key || undefined,
        secret_path: values.vault_secret_path,
    };
}

function buildWebhookAuthConfig(options: BuildSecretsPayloadOptions): SecretsSourceConfig['auth'] {
    const { isEdit, originalConfig, values } = options;
    const originalAuth = originalConfig.auth || {};
    if (values.webhook_auth_type === 'basic') {
        return pickDefinedFields({
            password: preserveSecretValue({
                fieldLabel: 'Basic Auth 密码',
                isEdit,
                nextValue: values.webhook_basic_password,
                originalType: originalAuth.type,
                originalValue: originalAuth.password,
                targetType: 'basic',
            }),
            type: values.webhook_auth_type,
            username: values.webhook_basic_username,
        });
    }
    if (values.webhook_auth_type === 'bearer') {
        return pickDefinedFields({
            token: preserveSecretValue({
                fieldLabel: 'Bearer Token',
                isEdit,
                nextValue: values.webhook_bearer_token,
                originalType: originalAuth.type,
                originalValue: originalAuth.token,
                targetType: 'bearer',
            }),
            type: values.webhook_auth_type,
        });
    }
    if (values.webhook_auth_type === 'api_key') {
        return pickDefinedFields({
            api_key: preserveSecretValue({
                fieldLabel: 'API Key',
                isEdit,
                nextValue: values.webhook_api_key,
                originalType: originalAuth.type,
                originalValue: originalAuth.api_key,
                targetType: 'api_key',
            }),
            header_name: values.webhook_api_key_header,
            type: values.webhook_auth_type,
        });
    }
    return pickDefinedFields({ type: values.webhook_auth_type });
}

function buildWebhookConfig(options: BuildSecretsPayloadOptions): SecretsSourceConfig {
    const { values } = options;
    return {
        auth: buildWebhookAuthConfig(options),
        field_mapping: buildFieldMapping({
            password: values.webhook_field_password,
            privateKey: values.webhook_field_private_key,
            username: values.webhook_field_username,
        }),
        method: values.webhook_method || 'POST',
        query_key: values.webhook_query_key || undefined,
        response_data_path: values.webhook_response_path,
        url: values.webhook_url,
    };
}

function buildSecretsSourceConfig(options: BuildSecretsPayloadOptions): SecretsSourceConfig {
    const { values } = options;
    if (values.type === 'file') {
        return { key_path: values.file_key_path, username: values.file_username };
    }
    if (values.type === 'vault') {
        return buildVaultConfig(options);
    }
    return buildWebhookConfig(options);
}

export function buildSecretsSourcePayload(options: BuildSecretsPayloadOptions): AutoHealing.CreateSecretsSourceRequest {
    const { values } = options;
    return {
        auth_type: values.auth_type,
        config: buildSecretsSourceConfig(options),
        is_default: values.is_default,
        name: values.name,
        priority: values.priority,
        type: values.type,
    };
}

export type { SecretFormValues };
