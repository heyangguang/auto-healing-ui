import type { FormInstance } from 'antd';
import type { NotificationChannelConfig, NotificationChannelDetail } from '@/services/auto-healing/notification';

export type WebhookAuthType = 'headers' | 'basic';
export type ChannelConfig = NotificationChannelConfig;
export type ChannelDetail = NotificationChannelDetail;

type IntervalFields = Partial<Record<`interval_${number}`, number>>;

export type ChannelFormValues = IntervalFields & {
    name: string;
    type: AutoHealing.ChannelType;
    description?: string;
    recipients?: string[];
    is_default?: boolean;
    max_retries?: number;
    rate_limit_per_minute?: number;
    webhook_url?: string;
    method?: string;
    timeout_seconds?: number;
    username?: string;
    password?: string;
    headers?: string;
    smtp_host?: string;
    smtp_port?: number;
    from_address?: string;
    use_tls?: boolean;
    secret?: string;
};

const DEFAULT_RETRY_INTERVALS = [1, 5, 15] as const;

const getIntervalDefault = (index: number) =>
    DEFAULT_RETRY_INTERVALS[index] ?? DEFAULT_RETRY_INTERVALS[DEFAULT_RETRY_INTERVALS.length - 1];

const pickExistingValue = <T>(nextValue: T | undefined, fallbackValue: T | undefined, shouldFallback: boolean) =>
    nextValue ?? (shouldFallback ? fallbackValue : undefined);

const parseWebhookHeaders = (headersText?: string) => {
    if (!headersText) {
        return undefined;
    }

    const parsed = JSON.parse(headersText) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('自定义 Headers 必须是 JSON 对象');
    }

    return parsed as Record<string, string>;
};

const buildWebhookConfig = (
    values: ChannelFormValues,
    originalConfig: ChannelConfig,
    isEdit: boolean,
    webhookAuthType: WebhookAuthType,
) => {
    const config: ChannelConfig = {
        url: pickExistingValue(values.webhook_url, originalConfig.url || originalConfig.webhook_url, isEdit),
        method: pickExistingValue(values.method, originalConfig.method, isEdit),
        timeout_seconds: pickExistingValue(values.timeout_seconds, originalConfig.timeout_seconds, isEdit),
    };

    if (webhookAuthType === 'headers') {
        const headers = values.headers
            ? parseWebhookHeaders(values.headers)
            : pickExistingValue(undefined, originalConfig.headers, isEdit);

        if (headers) {
            config.headers = headers;
        }

        return config;
    }

    config.username = pickExistingValue(values.username, originalConfig.username, isEdit);
    config.password = pickExistingValue(values.password, originalConfig.password, isEdit);
    return config;
};

const buildEmailConfig = (values: ChannelFormValues, originalConfig: ChannelConfig, isEdit: boolean) => ({
    smtp_host: pickExistingValue(values.smtp_host, originalConfig.smtp_host, isEdit),
    smtp_port: pickExistingValue(values.smtp_port, originalConfig.smtp_port, isEdit),
    username: pickExistingValue(values.username, originalConfig.username, isEdit),
    password: pickExistingValue(values.password, originalConfig.password, isEdit),
    from_address: pickExistingValue(values.from_address, originalConfig.from_address, isEdit),
    use_tls: isEdit ? pickExistingValue(values.use_tls, originalConfig.use_tls, true) : (values.use_tls ?? true),
});

const buildDingTalkConfig = (values: ChannelFormValues, originalConfig: ChannelConfig, isEdit: boolean) => ({
    webhook_url: pickExistingValue(values.webhook_url, originalConfig.webhook_url, isEdit),
    secret: pickExistingValue(values.secret, originalConfig.secret, isEdit),
});

const compactConfig = (config: ChannelConfig) =>
    Object.fromEntries(
        Object.entries(config).filter(([, value]) => value !== undefined),
    ) as ChannelConfig;

export const validateEmailRecipients = async (_rule: unknown, value?: string[]) => {
    if (!value?.length) {
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = value.filter((item) => !emailRegex.test(item));

    if (invalidEmails.length > 0) {
        throw new Error(`格式无效: ${invalidEmails.join(', ')}`);
    }
};

export const applyChannelToForm = (
    form: FormInstance<ChannelFormValues>,
    channel: ChannelDetail,
) => {
    const originalConfig = channel.config || {};
    form.setFieldsValue({
        name: channel.name,
        type: channel.type,
        description: channel.description,
        recipients: channel.recipients,
        is_default: channel.is_default,
        max_retries: channel.retry_config?.max_retries ?? 3,
        rate_limit_per_minute: channel.rate_limit_per_minute,
        webhook_url: originalConfig.url || originalConfig.webhook_url,
        method: originalConfig.method,
        timeout_seconds: originalConfig.timeout_seconds,
        username: originalConfig.username,
        headers: undefined,
        smtp_host: originalConfig.smtp_host,
        smtp_port: originalConfig.smtp_port,
        from_address: originalConfig.from_address,
        use_tls: originalConfig.use_tls,
        secret: undefined,
    });

    const intervals = channel.retry_config?.retry_intervals || DEFAULT_RETRY_INTERVALS;
    intervals.forEach((value, index) => {
        form.setFieldValue(`interval_${index}`, value);
    });
};

export const buildChannelPayload = (options: {
    isEdit: boolean;
    originalConfig: ChannelConfig;
    values: ChannelFormValues;
    webhookAuthType: WebhookAuthType;
}): AutoHealing.CreateChannelRequest => {
    const {
        isEdit,
        originalConfig,
        values,
        webhookAuthType,
    } = options;

    const configBuilders: Record<AutoHealing.ChannelType, () => ChannelConfig> = {
        webhook: () => buildWebhookConfig(values, originalConfig, isEdit, webhookAuthType),
        email: () => buildEmailConfig(values, originalConfig, isEdit),
        dingtalk: () => buildDingTalkConfig(values, originalConfig, isEdit),
    };

    const maxRetries = values.max_retries ?? 3;
    const retryIntervals = Array.from({ length: maxRetries }, (_, index) =>
        values[`interval_${index}`] ?? getIntervalDefault(index));

    return {
        name: values.name,
        type: values.type,
        description: values.description,
        config: compactConfig(configBuilders[values.type]()),
        retry_config: {
            max_retries: maxRetries,
            retry_intervals: retryIntervals,
        },
        recipients: values.recipients || [],
        is_default: values.is_default || false,
        rate_limit_per_minute: values.rate_limit_per_minute,
    };
};

const hasValue = <T>(value: T | undefined) => value !== undefined && value !== null && value !== '';

const ensureKnownValues = (
    label: string,
    pairs: Array<{ field: string; value: unknown }>,
) => {
    const missingFields = pairs.filter((item) => !hasValue(item.value)).map((item) => item.field);
    if (missingFields.length > 0) {
        throw new Error(`${label}：当前未拿到完整连接配置，无法安全更新。请补全 ${missingFields.join('、')} 后再保存。`);
    }
};

export const assertSafeChannelConfigUpdate = (options: {
    channelType: AutoHealing.ChannelType;
    form: FormInstance<ChannelFormValues>;
    originalConfig: ChannelConfig;
    values: ChannelFormValues;
    webhookAuthType: WebhookAuthType;
}) => {
    const { channelType, form, originalConfig, values, webhookAuthType } = options;
    if (!hasTouchedChannelConfigFields(form, channelType, webhookAuthType)) {
        return;
    }

    if (channelType === 'webhook') {
        ensureKnownValues('Webhook 配置不完整', [
            { field: 'Webhook URL', value: values.webhook_url ?? originalConfig.url ?? originalConfig.webhook_url },
            { field: '请求方法', value: values.method ?? originalConfig.method },
            { field: '超时秒数', value: values.timeout_seconds ?? originalConfig.timeout_seconds },
            ...(webhookAuthType === 'headers'
                ? [{ field: '认证 Headers', value: values.headers ?? originalConfig.headers }]
                : [
                    { field: '用户名', value: values.username ?? originalConfig.username },
                    { field: '密码', value: values.password ?? originalConfig.password },
                ]),
        ]);
        return;
    }

    if (channelType === 'email') {
        ensureKnownValues('邮件渠道配置不完整', [
            { field: 'SMTP 服务器', value: values.smtp_host ?? originalConfig.smtp_host },
            { field: 'SMTP 端口', value: values.smtp_port ?? originalConfig.smtp_port },
            { field: '用户名', value: values.username ?? originalConfig.username },
            { field: '密码', value: values.password ?? originalConfig.password },
            { field: 'TLS 开关', value: values.use_tls ?? originalConfig.use_tls },
        ]);
        return;
    }

    ensureKnownValues('钉钉渠道配置不完整', [
        { field: 'Webhook URL', value: values.webhook_url ?? originalConfig.webhook_url },
        { field: '加签密钥', value: values.secret ?? originalConfig.secret },
    ]);
};

export const hasTouchedChannelConfigFields = (
    form: FormInstance<ChannelFormValues>,
    channelType: AutoHealing.ChannelType,
    webhookAuthType: WebhookAuthType,
) => {
    if (channelType === 'webhook') {
        const baseFields: Array<keyof ChannelFormValues> = ['webhook_url', 'method', 'timeout_seconds'];
        const authFields: Array<keyof ChannelFormValues> = webhookAuthType === 'headers'
            ? ['headers']
            : ['username', 'password'];
        return [...baseFields, ...authFields].some((field) => form.isFieldTouched(field));
    }

    if (channelType === 'email') {
        return ['smtp_host', 'smtp_port', 'username', 'password', 'from_address', 'use_tls']
            .some((field) => form.isFieldTouched(field as keyof ChannelFormValues));
    }

    return ['webhook_url', 'secret']
        .some((field) => form.isFieldTouched(field as keyof ChannelFormValues));
};

export const getLoadedWebhookAuthType = (channel: ChannelDetail): WebhookAuthType => {
    const originalConfig = channel.config || {};
    return channel.type === 'webhook' && !!originalConfig.username ? 'basic' : 'headers';
};

export const getIntervalInitialValue = (index: number) => getIntervalDefault(index);
