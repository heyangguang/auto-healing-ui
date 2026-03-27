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

export type SecretFormValues = Record<string, any>;

export type BuildSecretsPayloadOptions = {
    isEdit: boolean;
    originalConfig: SecretsSourceConfig;
    values: SecretFormValues;
};
