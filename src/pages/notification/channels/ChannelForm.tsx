import React, { useState, useEffect, useCallback } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import {
    Form, Input, Select, Button, message, Spin, Switch,
    InputNumber, Row, Col, Card, Segmented, Divider, Alert
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getChannel, createChannel, updateChannel
} from '@/services/auto-healing/notification';
import './ChannelForm.css';

const { TextArea } = Input;

const ChannelFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [channelType, setChannelType] = useState<AutoHealing.ChannelType | undefined>(undefined);
    const [webhookAuthType, setWebhookAuthType] = useState<'headers' | 'basic'>('headers');

    // ==================== Load Data for Edit ====================
    useEffect(() => {
        if (!isEdit || !params.id) return;
        setLoading(true);
        (async () => {
            try {
                const res = await getChannel(params.id!);
                const channel = (res as any)?.data || res;
                setChannelType(channel.type);
                form.setFieldsValue({
                    name: channel.name,
                    type: channel.type,
                    description: channel.description,
                    recipients: channel.recipients,
                    is_default: channel.is_default,
                    max_retries: channel.retry_config?.max_retries ?? 3,
                    rate_limit_per_minute: channel.rate_limit_per_minute,
                });
                // Set individual interval fields
                const intervals = channel.retry_config?.retry_intervals || [1, 5, 15];
                intervals.forEach((val: number, idx: number) => {
                    form.setFieldValue(`interval_${idx}`, val);
                });
                // Determine auth type
                if (channel.type === 'webhook' && (channel as any).config?.username) {
                    setWebhookAuthType('basic');
                } else {
                    setWebhookAuthType('headers');
                }
            } catch {
                message.error('加载渠道数据失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, params.id]);

    // ==================== Submit ====================
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // Build config
            const config: Record<string, any> = {};
            if (values.type === 'webhook') {
                if (values.webhook_url) config.url = values.webhook_url;
                if (values.method) config.method = values.method;
                if (values.timeout_seconds) config.timeout_seconds = values.timeout_seconds;
                if (webhookAuthType === 'headers') {
                    if (values.headers) {
                        try { config.headers = JSON.parse(values.headers); } catch (e) { /* ignore */ }
                    }
                } else if (webhookAuthType === 'basic') {
                    if (values.username) config.username = values.username;
                    if (values.password) config.password = values.password;
                }
            } else if (values.type === 'email') {
                if (values.smtp_host) config.smtp_host = values.smtp_host;
                if (values.smtp_port) config.smtp_port = values.smtp_port;
                if (values.username) config.username = values.username;
                if (values.password) config.password = values.password;
                if (values.from_address) config.from_address = values.from_address;
                config.use_tls = values.use_tls ?? true;
            } else if (values.type === 'dingtalk') {
                if (values.webhook_url) config.webhook_url = values.webhook_url;
                if (values.secret) config.secret = values.secret;
            }

            const maxRetries = values.max_retries ?? 3;
            const retryIntervals: number[] = [];
            for (let i = 0; i < maxRetries; i++) {
                const val = values[`interval_${i}`];
                retryIntervals.push(val ?? (i === 0 ? 1 : i === 1 ? 5 : 15));
            }
            const retry_config = {
                max_retries: maxRetries,
                retry_intervals: retryIntervals,
            };

            const payload: AutoHealing.CreateChannelRequest = {
                name: values.name,
                type: values.type,
                description: values.description,
                config: Object.keys(config).length > 0 ? config : {},
                retry_config,
                default_recipients: values.recipients || [],
                is_default: values.is_default || false,
            };

            if (isEdit && params.id) {
                await updateChannel(params.id, payload);
                message.success('渠道已更新');
            } else {
                await createChannel(payload);
                message.success('渠道已创建');
            }
            history.push('/notification/channels');
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('保存失败');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Connection Config Fields ====================
    const renderConfigFields = () => {
        if (!channelType) {
            return <div style={{ color: '#8c8c8c', textAlign: 'center', padding: 16 }}>请先选择渠道类型</div>;
        }

        if (channelType === 'webhook') {
            return (
                <>
                    <Form.Item label="Webhook URL" name="webhook_url" rules={[{ required: !isEdit, message: '请输入 URL' }]}>
                        <Input placeholder="https://example.com/webhook" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="请求方法" name="method" initialValue="POST">
                                <Select options={[{ value: 'POST' }, { value: 'GET' }, { value: 'PUT' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="超时秒数" name="timeout_seconds" initialValue={30}>
                                <InputNumber min={1} max={300} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation={'left' as any} style={{ fontSize: 12, color: '#8c8c8c', margin: '12px 0' }}>认证配置</Divider>

                    <Form.Item label="认证方式" style={{ marginBottom: 12 }}>
                        <Segmented
                            value={webhookAuthType}
                            onChange={v => setWebhookAuthType(v as 'headers' | 'basic')}
                            options={[
                                { label: 'Custom Headers / Token', value: 'headers' },
                                { label: 'Basic Auth', value: 'basic' }
                            ]}
                        />
                    </Form.Item>

                    {webhookAuthType === 'headers' ? (
                        <Form.Item
                            label="自定义 Headers (JSON)"
                            name="headers"
                            tooltip="在此处配置 Authorization 头或其他 Token"
                        >
                            <TextArea placeholder='{"Authorization": "Bearer <token>", "X-Custom-Header": "value"}' autoSize={{ minRows: 2, maxRows: 4 }} />
                        </Form.Item>
                    ) : (
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="密码" name="password" rules={[{ required: !isEdit, message: '请输入密码' }]}>
                                    <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}
                </>
            );
        }

        if (channelType === 'email') {
            return (
                <>
                    <Row gutter={16}>
                        <Col span={16}>
                            <Form.Item label="SMTP 服务器" name="smtp_host" rules={[{ required: !isEdit, message: '请输入 SMTP 地址' }]}>
                                <Input placeholder="smtp.example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item label="端口" name="smtp_port" initialValue={587}>
                                <InputNumber style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="用户名" name="username" rules={[{ required: !isEdit, message: '请输入用户名' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="密码" name="password" rules={[{ required: !isEdit, message: '请输入密码' }]}>
                                <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="发送方地址" name="from_address">
                        <Input placeholder="noreply@example.com" />
                    </Form.Item>
                    <Form.Item name="use_tls" valuePropName="checked" initialValue={true}>
                        <Switch checkedChildren="启用 TLS" unCheckedChildren="禁用 TLS" />
                    </Form.Item>
                </>
            );
        }

        if (channelType === 'dingtalk') {
            return (
                <>
                    <Form.Item label="Webhook URL" name="webhook_url" rules={[{ required: !isEdit, message: '请输入钉钉机器人 Webhook' }]}>
                        <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
                    </Form.Item>
                    <Form.Item label="加签密钥" name="secret">
                        <Input.Password placeholder={isEdit ? '留空保持不变' : 'SEC...'} />
                    </Form.Item>
                </>
            );
        }

        return null;
    };

    // ==================== Main Render ====================
    return (
        <div className="channel-form-page">
            <SubPageHeader
                title={isEdit ? '编辑通知渠道' : '新建通知渠道'}
                onBack={() => history.push('/notification/channels')}
                actions={
                    <Button type="primary" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !access.canUpdateChannel : !access.canCreateChannel} onClick={handleSubmit}>
                        {isEdit ? '保存修改' : '创建渠道'}
                    </Button>
                }
            />

            <div className="channel-form-card">
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical">
                        {isEdit && (
                            <Alert
                                message="敏感配置保护中"
                                description="出于安全考虑，URL、密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* 基本信息 */}
                        <Card type="inner" title="基本信息" size="small" style={{ marginBottom: 16 }}>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="渠道名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
                                        <Input placeholder="例如：运维告警群" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="渠道类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                                        <Select
                                            onChange={v => setChannelType(v)}
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
                            <Form.Item label="描述" name="description" style={{ marginBottom: 0 }}>
                                <TextArea rows={2} placeholder="可选的描述信息" />
                            </Form.Item>
                        </Card>

                        {/* 连接配置 */}
                        <Card type="inner" title="连接配置" size="small" style={{ marginBottom: 16 }}>
                            {renderConfigFields()}
                        </Card>

                        {/* 策略与接收人 */}
                        <Card type="inner" title={channelType === 'email' ? '重试策略与收件人' : '重试策略'} size="small">
                            {channelType === 'email' && (
                                <Form.Item
                                    label="默认收件邮箱"
                                    name="recipients"
                                    help="输入邮箱地址后回车添加，支持多个"
                                    rules={[{
                                        validator: async (_, value) => {
                                            if (value && value.length > 0) {
                                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                                const invalid = value.filter((v: string) => !emailRegex.test(v));
                                                if (invalid.length > 0) {
                                                    throw new Error(`格式无效: ${invalid.join(', ')}`);
                                                }
                                            }
                                        }
                                    }]}
                                >
                                    <Select
                                        mode="tags"
                                        placeholder="example@company.com"
                                        style={{ width: '100%' }}
                                        tokenSeparators={[',', ' ']}
                                    />
                                </Form.Item>
                            )}

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="最大重试次数" name="max_retries" initialValue={3}>
                                        <Select
                                            options={[
                                                { value: 0, label: '不重试' },
                                                { value: 1, label: '1 次' },
                                                { value: 2, label: '2 次' },
                                                { value: 3, label: '3 次' },
                                            ]}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label="速率限制 (条/分)" name="rate_limit_per_minute">
                                        <InputNumber min={1} style={{ width: '100%' }} placeholder="默认无限制" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.max_retries !== curr.max_retries}>
                                {({ getFieldValue }) => {
                                    const count = getFieldValue('max_retries') || 0;
                                    if (count === 0) return null;
                                    return (
                                        <Form.Item label="重试间隔配置 (分钟)">
                                            <div style={{ display: 'flex', gap: 16 }}>
                                                {Array.from({ length: count }).map((_, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: 8, fontSize: 12, color: '#8c8c8c', whiteSpace: 'nowrap' }}>
                                                            第 {idx + 1} 次:
                                                        </span>
                                                        <Form.Item
                                                            name={`interval_${idx}`}
                                                            initialValue={idx === 0 ? 1 : idx === 1 ? 5 : 15}
                                                            rules={[{ required: true, message: '必填' }]}
                                                            noStyle
                                                        >
                                                            <InputNumber min={1} max={1440} style={{ width: 110 }} />
                                                        </Form.Item>
                                                    </div>
                                                ))}
                                            </div>
                                        </Form.Item>
                                    );
                                }}
                            </Form.Item>

                            <Form.Item name="is_default" valuePropName="checked" label="设为默认渠道" style={{ marginBottom: 0 }}>
                                <Switch />
                            </Form.Item>
                        </Card>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default ChannelFormPage;
