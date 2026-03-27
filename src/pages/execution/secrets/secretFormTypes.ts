export type SecretsSourceConfig = {
    address?: string;
    auth?: {
        api_key?: string;
        header_name?: string;
        password?: string;
        role_id?: string;
        secret_id?: string;
        token?: string;
        type?: string;
        username?: string;
    };
    field_mapping?: {
        password?: string;
        private_key?: string;
        username?: string;
    };
    key_path?: string;
    method?: string;
    query_key?: string;
    response_data_path?: string;
    secret_path?: string;
    url?: string;
    username?: string;
};

export type SecretsSourceRecord = AutoHealing.SecretsSource & {
    config?: SecretsSourceConfig;
};

export type VaultAuthType = 'token' | 'approle';
export type WebhookAuthType = 'none' | 'basic' | 'bearer' | 'api_key';
export type WebhookMethod = 'GET' | 'POST';

export interface SecretFormValues {
    auth_type: AutoHealing.AuthType;
    file_key_path?: string;
    file_username?: string;
    is_default?: boolean;
    name: string;
    priority?: number;
    type: AutoHealing.SecretsSourceType;
    vault_address?: string;
    vault_auth_type?: VaultAuthType;
    vault_field_password?: string;
    vault_field_private_key?: string;
    vault_field_username?: string;
    vault_query_key?: string;
    vault_role_id?: string;
    vault_secret_id?: string;
    vault_secret_path?: string;
    vault_token?: string;
    webhook_api_key?: string;
    webhook_api_key_header?: string;
    webhook_auth_type?: WebhookAuthType;
    webhook_basic_password?: string;
    webhook_basic_username?: string;
    webhook_bearer_token?: string;
    webhook_field_password?: string;
    webhook_field_private_key?: string;
    webhook_field_username?: string;
    webhook_method?: WebhookMethod;
    webhook_query_key?: string;
    webhook_response_path?: string;
    webhook_url?: string;
}

export type BuildSecretsPayloadOptions = {
    isEdit: boolean;
    originalConfig: SecretsSourceConfig;
    values: SecretFormValues;
};
