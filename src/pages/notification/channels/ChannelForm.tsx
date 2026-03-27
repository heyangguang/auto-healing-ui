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
import './ChannelForm.css';

const { TextArea } = Input;

const hasFormErrorFields = (error: unknown): error is { errorFields: unknown[] } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

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
                const channel: ChannelDetail = await getChannel(params.id!);
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

            <div className="channel-form-card">
                <Spin spinning={loading}>
                    <Form<ChannelFormValues> form={form} layout="vertical">
                        {isEdit && (
                            <Alert
                                title="敏感配置保护中"
                                description="出于安全考虑，URL、密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}
                        {loadFailed && (
                            <Alert
                                title="渠道详情加载失败"
                                description="当前未拿到后端返回的渠道详情，已阻止保存，请返回列表后重试。"
                                type="error"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* 基本信息 */}
                        <Card type="inner" title="基本信息" size="small" style={{ marginBottom: 16 }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item<ChannelFormValues> label="渠道名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                                        <Input placeholder="例如：运维告警群" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item<ChannelFormValues> label="渠道类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                                        <Select
                                            onChange={(value) => setChannelType(value)}
                                            disabled={isEdit}
                                            options={[
                                                { label: 'Webhook (通用)', value: 'webhook' },
                                                { label: '邮件 (Email)', value: 'email' },
                                                { label: '钉钉 (DingTalk)', value: 'dingtalk' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item<ChannelFormValues> label="描述" name="description" style={{ marginBottom: 0 }}>
                                <TextArea rows={2} placeholder="可选的描述信息" />
                            </Form.Item>
                        </Card>

                        {/* 连接配置 */}
                        <Card type="inner" title="连接配置" size="small" style={{ marginBottom: 16 }}>
                            <ChannelConnectionFields
                                channelType={channelType}
                                isEdit={isEdit}
                                loadedWebhookAuthType={loadedWebhookAuthType}
                                onWebhookAuthTypeChange={setWebhookAuthType}
                                webhookAuthType={webhookAuthType}
                            />
                        </Card>

                        {/* 策略与接收人 */}
                        <Card type="inner" title={channelType === 'email' ? '重试策略与收件人' : '重试策略'} size="small">
                            <ChannelRetrySection channelType={channelType} />
                        </Card>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default ChannelFormPage;
