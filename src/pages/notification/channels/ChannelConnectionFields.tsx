import React from 'react';
import { Col, Divider, Form, Input, InputNumber, Row, Segmented, Select, Switch } from 'antd';
import type { ChannelFormValues, WebhookAuthType } from './channelFormHelpers';

const { TextArea } = Input;

interface ChannelConnectionFieldsProps {
    channelType?: AutoHealing.ChannelType;
    isEdit: boolean;
    loadedWebhookAuthType: WebhookAuthType | null;
    webhookAuthType: WebhookAuthType;
    onWebhookAuthTypeChange: (value: WebhookAuthType) => void;
}

const ChannelConnectionFields: React.FC<ChannelConnectionFieldsProps> = ({
    channelType,
    isEdit,
    loadedWebhookAuthType,
    webhookAuthType,
    onWebhookAuthTypeChange,
}) => {
    if (!channelType) {
        return <div style={{ color: '#8c8c8c', textAlign: 'center', padding: 16 }}>请先选择渠道类型</div>;
    }

    if (channelType === 'webhook') {
        return (
            <>
                <Form.Item<ChannelFormValues> label="Webhook URL" name="webhook_url" rules={[{ required: !isEdit, message: '请输入 URL' }]}>
                    <Input placeholder="https://example.com/webhook" />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item<ChannelFormValues> label="请求方法" name="method" initialValue={isEdit ? undefined : 'POST'}>
                            <Select options={[{ value: 'POST' }, { value: 'GET' }, { value: 'PUT' }]} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item<ChannelFormValues> label="超时秒数" name="timeout_seconds" initialValue={isEdit ? undefined : 30}>
                            <InputNumber min={1} max={300} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider style={{ fontSize: 12, color: '#8c8c8c', margin: '12px 0' }}>认证配置</Divider>

                <Form.Item label="认证方式" style={{ marginBottom: 12 }}>
                    <Segmented
                        value={webhookAuthType}
                        onChange={(value) => onWebhookAuthTypeChange(value as WebhookAuthType)}
                        options={[
                            { label: 'Custom Headers / Token', value: 'headers' },
                            { label: 'Basic Auth', value: 'basic' },
                        ]}
                    />
                </Form.Item>

                {webhookAuthType === 'headers' ? (
                    <Form.Item<ChannelFormValues>
                        label="自定义 Headers (JSON)"
                        name="headers"
                        tooltip="在此处配置 Authorization 头或其他 Token"
                    >
                        <TextArea
                            placeholder={isEdit
                                ? '留空保持现有 Headers；如需覆盖，请输入完整 JSON'
                                : '{"Authorization": "Bearer <token>", "X-Custom-Header": "value"}'}
                            autoSize={{ minRows: 2, maxRows: 4 }}
                        />
                    </Form.Item>
                ) : (
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item<ChannelFormValues> label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item<ChannelFormValues>
                                label="密码"
                                name="password"
                                rules={[{ required: !isEdit || loadedWebhookAuthType !== 'basic', message: '请输入密码' }]}
                            >
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
                        <Form.Item<ChannelFormValues> label="SMTP 服务器" name="smtp_host" rules={[{ required: !isEdit, message: '请输入 SMTP 地址' }]}>
                            <Input placeholder="smtp.example.com" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item<ChannelFormValues> label="端口" name="smtp_port" initialValue={isEdit ? undefined : 587}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item<ChannelFormValues> label="用户名" name="username" rules={[{ required: !isEdit, message: '请输入用户名' }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item<ChannelFormValues> label="密码" name="password" rules={[{ required: !isEdit, message: '请输入密码' }]}>
                            <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item<ChannelFormValues> label="发送方地址" name="from_address">
                    <Input placeholder="noreply@example.com" />
                </Form.Item>
                <Form.Item<ChannelFormValues> name="use_tls" valuePropName="checked" initialValue={isEdit ? undefined : true}>
                    <Switch checkedChildren="启用 TLS" unCheckedChildren="禁用 TLS" />
                </Form.Item>
            </>
        );
    }

    return (
        <>
            <Form.Item<ChannelFormValues> label="Webhook URL" name="webhook_url" rules={[{ required: !isEdit, message: '请输入钉钉机器人 Webhook' }]}>
                <Input placeholder="https://oapi.dingtalk.com/robot/send?access_token=xxx" />
            </Form.Item>
            <Form.Item<ChannelFormValues> label="加签密钥" name="secret">
                <Input.Password placeholder={isEdit ? '留空保持不变' : 'SEC...'} />
            </Form.Item>
        </>
    );
};

export default ChannelConnectionFields;
