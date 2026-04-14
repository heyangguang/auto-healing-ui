import React, { useEffect, useRef, useState } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import {
    Alert, Button, Card, Col, Form, Input, Row, Select, Spin, message,
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getChannel, createChannel, updateChannel
} from '@/services/auto-healing/notification';
import { extractErrorMsg } from '@/utils/errorMsg';
import ChannelConnectionFields from './ChannelConnectionFields';
import ChannelRetrySection from './ChannelRetrySection';
import {
    applyChannelToForm,
    assertSafeChannelConfigUpdate,
    buildChannelPayload,
    getLoadedWebhookAuthType,
    hasTouchedChannelConfigFields,
    type ChannelConfig,
    type ChannelDetail,
    type ChannelFormValues,
    type WebhookAuthType,
} from './channelFormHelpers';
import { getChannelTypeConfig, getChannelTypeOptions } from '@/constants/notificationDicts';
import './ChannelForm.css';

const { TextArea } = Input;

const hasFormErrorFields = (error: unknown): error is { errorFields: unknown[] } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

const CHANNEL_TYPE_DESCRIPTIONS: Partial<Record<AutoHealing.ChannelType, string>> = {
    webhook: '适合任意 HTTP 回调或自定义终端',
    email: '通过 SMTP 向邮箱投递通知',
    dingtalk: '钉钉群机器人通知，支持加签',
    wecom: '企业微信群机器人通知，适合内网团队',
    slack: 'Slack Incoming Webhook，推送到工作区频道',
    teams: 'Microsoft Teams Incoming Webhook，推送到团队频道',
};

const renderChannelTypeBadge = (type?: string, compact = false) => {
    const typeConfig = getChannelTypeConfig(type || '');
    return (
        <span
            className={`channel-type-badge${compact ? ' channel-type-badge--compact' : ''}`}
            style={{ background: typeConfig.bg, color: typeConfig.color }}
        >
            {React.cloneElement(
                typeConfig.icon as React.ReactElement<{ style?: React.CSSProperties }>,
                { style: { fontSize: compact ? 14 : 16 } },
            )}
        </span>
    );
};

const renderChannelTypeLabel = (type?: string, label?: string) => (
    <div className="channel-type-select-label">
        {renderChannelTypeBadge(type, true)}
        <span>{label || getChannelTypeConfig(type || '').labelCN}</span>
    </div>
);

const renderChannelTypeOption = (type?: string, label?: string) => (
    <div className="channel-type-option">
        {renderChannelTypeBadge(type)}
        <div className="channel-type-option__content">
            <div className="channel-type-option__title">{label || getChannelTypeConfig(type || '').labelCN}</div>
            <div className="channel-type-option__desc">{CHANNEL_TYPE_DESCRIPTIONS[type as AutoHealing.ChannelType] || '通知渠道'}</div>
        </div>
    </div>
);

const ChannelFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm<ChannelFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [channelType, setChannelType] = useState<AutoHealing.ChannelType | undefined>(undefined);
    const [webhookAuthType, setWebhookAuthType] = useState<WebhookAuthType>('headers');
    const originalConfigRef = useRef<ChannelConfig>({});
    const [loadedWebhookAuthType, setLoadedWebhookAuthType] = useState<WebhookAuthType | null>(null);
    const [loadFailed, setLoadFailed] = useState(false);

    // ==================== Load Data for Edit ====================
    useEffect(() => {
        if (!isEdit || !params.id) {
            originalConfigRef.current = {};
            setLoadedWebhookAuthType(null);
            setLoadFailed(false);
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const channelId = params.id;
                if (!channelId) {
                    return;
                }
                const channel: ChannelDetail = await getChannel(channelId);
                setLoadFailed(false);
                const originalConfig = channel.config || {};
                originalConfigRef.current = originalConfig;
                setChannelType(channel.type);
                const nextWebhookAuthType = getLoadedWebhookAuthType(channel);
                setWebhookAuthType(nextWebhookAuthType);
                setLoadedWebhookAuthType(nextWebhookAuthType);
                applyChannelToForm(form, channel);
            } catch (error: unknown) {
                setLoadFailed(true);
                message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '加载通知渠道失败，当前不可保存'));
            } finally {
                setLoading(false);
            }
        })();
    }, [form, isEdit, params.id]);

    // ==================== Submit ====================
    const handleSubmit = async () => {
        try {
            if (loadFailed) {
                message.error('渠道详情加载失败，无法保存');
                return;
            }
            const values = await form.validateFields();
            setSubmitting(true);
            assertSafeChannelConfigUpdate({
                channelType: values.type,
                form,
                originalConfig: originalConfigRef.current || {},
                values,
                webhookAuthType,
            });
            const payload = buildChannelPayload({
                values,
                isEdit,
                originalConfig: originalConfigRef.current || {},
                webhookAuthType,
            });

            if (isEdit && params.id) {
                const updatePayload: AutoHealing.UpdateChannelRequest = {
                    name: payload.name,
                    description: payload.description,
                    retry_config: payload.retry_config,
                    recipients: payload.recipients,
                    is_default: payload.is_default,
                    rate_limit_per_minute: payload.rate_limit_per_minute,
                };
                if (hasTouchedChannelConfigFields(form, values.type, webhookAuthType)) {
                    updatePayload.config = payload.config;
                }

                await updateChannel(params.id, updatePayload);
                message.success('渠道已更新');
            } else {
                await createChannel(payload);
                message.success('渠道已创建');
            }
            history.push('/notification/channels');
        } catch (error: unknown) {
            if (error instanceof Error) {
                message.error(error.message);
                return;
            }
            if (!hasFormErrorFields(error)) {
                /* global error handler */
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Main Render ====================
    return (
        <div className="channel-form-page">
            <SubPageHeader
                title={isEdit ? '编辑通知渠道' : '新建通知渠道'}
                onBack={() => history.push('/notification/channels')}
                actions={
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        loading={submitting}
                        disabled={loadFailed || (isEdit ? !access.canUpdateChannel : !access.canCreateChannel)}
                        onClick={handleSubmit}
                    >
                        {isEdit ? '保存修改' : '创建渠道'}
                    </Button>
                }
            />

            <Spin spinning={loading}>
                <Form<ChannelFormValues>
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                    className="channel-form-cards"
                >
                    {isEdit && (
                        <Alert
                            className="channel-form-alert"
                            title="敏感配置保护中"
                            description="出于安全考虑，URL、密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                            type="info"
                            showIcon
                        />
                    )}
                    {loadFailed && (
                        <Alert
                            className="channel-form-alert"
                            title="渠道详情加载失败"
                            description="当前未拿到后端返回的渠道详情，已阻止保存，请返回列表后重试。"
                            type="error"
                            showIcon
                        />
                    )}

                    <Card className="channel-form-section-card" title="基本信息" size="small">
                        <Row gutter={16}>
                            <Col xs={24} md={14}>
                                <Form.Item<ChannelFormValues> label="渠道名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                                    <Input placeholder="例如：运维告警群" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={10}>
                                <Form.Item<ChannelFormValues> label="渠道类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                                    <Select
                                        className="channel-form-control-lg"
                                        onChange={(value) => setChannelType(value)}
                                        disabled={isEdit}
                                        optionFilterProp="label"
                                        optionRender={(option) => renderChannelTypeOption(
                                            option.value === undefined ? undefined : String(option.value),
                                            option.label as string,
                                        )}
                                        labelRender={(option) => renderChannelTypeLabel(
                                            option.value === undefined ? undefined : String(option.value),
                                            option.label as string,
                                        )}
                                        options={getChannelTypeOptions('form')}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item<ChannelFormValues> label="描述" name="description">
                            <TextArea rows={3} placeholder="可选的描述信息" />
                        </Form.Item>
                    </Card>

                    <Card className="channel-form-section-card" title="连接配置" size="small">
                        <ChannelConnectionFields
                            channelType={channelType}
                            isEdit={isEdit}
                            loadedWebhookAuthType={loadedWebhookAuthType}
                            onWebhookAuthTypeChange={setWebhookAuthType}
                            webhookAuthType={webhookAuthType}
                        />
                    </Card>

                    <Card
                        className="channel-form-section-card"
                        title={channelType === 'email' ? '重试策略与收件人' : '重试策略'}
                        size="small"
                    >
                        <ChannelRetrySection channelType={channelType} />
                    </Card>
                </Form>
            </Spin>
        </div>
    );
};

export default ChannelFormPage;
