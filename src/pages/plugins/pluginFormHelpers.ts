import type { PluginRecord } from '@/services/auto-healing/plugins';

export const DEFAULT_PLUGIN_MAX_FAILURES = 5;
export const DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES = 5;
export const BASIC_AUTH_USERNAME_RULES = [{ required: true, whitespace: true, message: '请输入用户名' }] as const;

export type PluginFilterOperator = Extract<AutoHealing.SyncFilterRule['operator'], string>;

export type EditablePluginMapping = {
    external: string;
    standard: string;
};

export type EditablePluginFilter = {
    field: string;
    operator: PluginFilterOperator;
    value: string;
};

export type EditablePluginExtraParam = {
    key: string;
    value: string;
};

export type PluginFormValues = {
    api_key?: string;
    api_key_header?: string;
    auth_type: AutoHealing.PluginConfig['auth_type'];
    close_incident_method?: AutoHealing.PluginConfig['close_incident_method'];
    close_incident_url?: string;
    description?: string;
    max_failures?: number;
    name: string;
    password?: string;
    response_data_path?: string;
    since_param?: string;
    sync_enabled?: boolean;
    sync_interval_minutes?: number;
    token?: string;
    type: AutoHealing.PluginType;
    url: string;
    username?: string;
    version?: string;
};

type BuildPluginPayloadOptions = {
    extraParams: EditablePluginExtraParam[];
    filters: EditablePluginFilter[];
    mappings: EditablePluginMapping[];
    originalConfig?: Partial<AutoHealing.PluginConfig>;
    values: PluginFormValues;
};

type PluginMutationPayload = AutoHealing.CreatePluginRequest & {
    max_failures: number;
};

export function buildPluginConfig(
    values: PluginFormValues,
    originalConfig?: Partial<AutoHealing.PluginConfig>,
): AutoHealing.PluginConfig {
    const config: AutoHealing.PluginConfig = {
        url: values.url,
        auth_type: values.auth_type,
    };

    if (values.auth_type === 'basic') {
        config.username = values.username || originalConfig?.username;
        if (values.password) config.password = values.password;
        else if (originalConfig?.auth_type === 'basic' && originalConfig.password) config.password = originalConfig.password;
    }
    if (values.auth_type === 'bearer') {
        if (values.token) config.token = values.token;
        else if (originalConfig?.auth_type === 'bearer' && originalConfig.token) config.token = originalConfig.token;
    }
    if (values.auth_type === 'api_key') {
        config.api_key_header = values.api_key_header;
        if (values.api_key) config.api_key = values.api_key;
        else if (originalConfig?.auth_type === 'api_key' && originalConfig.api_key) config.api_key = originalConfig.api_key;
    }
    if (values.since_param) config.since_param = values.since_param;
    if (values.response_data_path) config.response_data_path = values.response_data_path;
    if (values.close_incident_url) config.close_incident_url = values.close_incident_url;
    if (values.close_incident_method) config.close_incident_method = values.close_incident_method;
    return config;
}

export function buildPluginExtraParams(extraParams: EditablePluginExtraParam[]): Record<string, string> | undefined {
    const validParams = extraParams.filter((param) => param.key && param.value);
    if (validParams.length === 0) return undefined;

    return validParams.reduce<Record<string, string>>((result, param) => ({
        ...result,
        [param.key]: param.value,
    }), {});
}

export function buildPluginFieldMapping(
    mappings: EditablePluginMapping[],
    type: AutoHealing.PluginType,
): AutoHealing.FieldMapping {
    const validMappings = mappings.filter((mapping) => mapping.standard && mapping.external);
    if (validMappings.length === 0) return {};

    const mappingRecord = validMappings.reduce<Record<string, string>>((result, mapping) => ({
        ...result,
        [mapping.standard]: mapping.external,
    }), {});
    return type === 'cmdb' ? { cmdb_mapping: mappingRecord } : { incident_mapping: mappingRecord };
}

export function buildPluginSyncFilter(filters: EditablePluginFilter[]): AutoHealing.SyncFilter {
    return {
        logic: 'and',
        rules: filters
            .filter((filter) => filter.field)
            .map((filter) => ({
                field: filter.field,
                operator: filter.operator,
                value: filter.operator === 'in'
                    ? filter.value.split(',').map((item) => item.trim()).filter(Boolean)
                    : filter.value || '',
            })),
    };
}

export function hasIncompletePluginFilter(filters: EditablePluginFilter[]): boolean {
    return filters.some((filter) => {
        const hasAnyValue = Boolean(filter.field.trim() || filter.value.trim());
        if (!hasAnyValue) {
            return false;
        }
        return !filter.field.trim() || !filter.value.trim();
    });
}

export function buildPluginPayload({
    extraParams,
    filters,
    mappings,
    originalConfig,
    values,
}: BuildPluginPayloadOptions): PluginMutationPayload {
    const config = buildPluginConfig(values, originalConfig);
    const pluginExtraParams = buildPluginExtraParams(extraParams);
    if (pluginExtraParams) config.extra_params = pluginExtraParams;

    return {
        name: values.name,
        type: values.type,
        description: values.description,
        version: values.version,
        config,
        field_mapping: buildPluginFieldMapping(mappings, values.type),
        sync_filter: buildPluginSyncFilter(filters),
        sync_enabled: Boolean(values.sync_enabled),
        sync_interval_minutes: values.sync_interval_minutes ?? DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
        max_failures: values.max_failures ?? DEFAULT_PLUGIN_MAX_FAILURES,
    };
}

export function getPluginEditInitialValues(plugin: PluginRecord): Partial<PluginFormValues> {
    return {
        name: plugin.name,
        type: plugin.type,
        description: plugin.description,
        version: plugin.version,
        url: plugin.config?.url,
        auth_type: plugin.config?.auth_type || 'basic',
        username: plugin.config?.username,
        password: undefined,
        token: undefined,
        api_key: undefined,
        api_key_header: plugin.config?.api_key_header,
        since_param: plugin.config?.since_param,
        response_data_path: plugin.config?.response_data_path,
        close_incident_url: plugin.config?.close_incident_url,
        close_incident_method: plugin.config?.close_incident_method,
        sync_enabled: plugin.sync_enabled,
        sync_interval_minutes: plugin.sync_interval_minutes ?? DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
        max_failures: plugin.max_failures ?? DEFAULT_PLUGIN_MAX_FAILURES,
    };
}

type PluginLogResponseGuardOptions = {
    currentPluginId?: string;
    latestRequestId: number;
    pluginId: string;
    requestId: number;
};

export function shouldApplyPluginLogResponse({
    currentPluginId,
    latestRequestId,
    pluginId,
    requestId,
}: PluginLogResponseGuardOptions): boolean {
    return requestId === latestRequestId && currentPluginId === pluginId;
}
