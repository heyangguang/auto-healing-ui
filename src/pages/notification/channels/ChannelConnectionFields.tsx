import React from 'react';
import { Col, Divider, Form, Input, InputNumber, Row, Segmented, Select, Switch } from 'antd';
import type { ChannelFormValues, WebhookAuthType } from './channelFormHelpers';

interface ChannelConnectionFieldsProps {
    channelType?: AutoHealing.ChannelType;
    isEdit: boolean;
    loadedWebhookAuthType: WebhookAuthType | null;
    webhookAuthType: WebhookAuthType;
    onWebhookAuthTypeChange: (value: WebhookAuthType) => void;
}

const renderWebhookField = (isEdit: boolean, message: string, placeholder: string) => (
    <Form.Item<ChannelFormValues> label="Webhook URL" name="webhook_url" rules={[{ required: !isEdit, message }]}>
        <Input placeholder={placeholder} />
    </Form.Item>
);

const renderWebhookAuthFields = (
    isEdit: boolean,
    loadedWebhookAuthType: WebhookAuthType | null,
    webhookAuthType: WebhookAuthType,
    onWebhookAuthTypeChange: (value: WebhookAuthType) => void,
) => (
    <>
        <Divider style={{ fontSize: 12, color: '#8c8c8c', margin: '12px 0' }}>认证配置</Divider>
        <Form.Item label="认证方式" style={{ marginBottom: 12 }}>
            <Segmented
                className="channel-form-auth-segmented"
                value={webhookAuthType}
                onChange={(value) => onWebhookAuthTypeChange(value as WebhookAuthType)}
                options={[
                    { label: 'Custom Headers / Token', value: 'headers' },
                    { label: 'Basic Auth', value: 'basic' },
                ]}
            />
        </Form.Item>
        {webhookAuthType === 'headers' ? (
            <Form.Item<ChannelFormValues> label="自定义 Headers (JSON)" name="headers" tooltip="在此处配置 Authorization 头或其他 Token">
                <Input.TextArea
                    placeholder={isEdit
                        ? '留空保持现有 Headers；如需覆盖，请输入完整 JSON'
                        : '{"Authorization": "Bearer <token>", "X-Custom-Header": "value"}'}
                    autoSize={{ minRows: 2, maxRows: 4 }}
                />
            </Form.Item>
        ) : (
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item<ChannelFormValues> label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item<ChannelFormValues> label="密码" name="password" rules={[{ required: !isEdit || loadedWebhookAuthType !== 'basic', message: '请输入密码' }]}>
                        <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                    </Form.Item>
                </Col>
            </Row>
        )}
    </>
);

const renderWebhookFields = (
    isEdit: boolean,
    loadedWebhookAuthType: WebhookAuthType | null,
    webhookAuthType: WebhookAuthType,
    onWebhookAuthTypeChange: (value: WebhookAuthType) => void,
) => (
    <>
        {renderWebhookField(isEdit, '请输入 URL', 'https://example.com/webhook')}
        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="请求方法" name="method" initialValue={isEdit ? undefined : 'POST'}>
                    <Select className="channel-form-control-md" options={[{ value: 'POST' }, { value: 'GET' }, { value: 'PUT' }]} />
                </Form.Item>
            </Col>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="超时秒数" name="timeout_seconds" initialValue={isEdit ? undefined : 30}>
                    <InputNumber className="channel-form-control-sm" min={1} max={300} />
                </Form.Item>
            </Col>
        </Row>
        {renderWebhookAuthFields(isEdit, loadedWebhookAuthType, webhookAuthType, onWebhookAuthTypeChange)}
    </>
);

const renderEmailFields = (isEdit: boolean) => (
    <>
        <Row gutter={16}>
            <Col xs={24} md={16}>
                <Form.Item<ChannelFormValues> label="SMTP 服务器" name="smtp_host" rules={[{ required: !isEdit, message: '请输入 SMTP 地址' }]}>
                    <Input placeholder="smtp.example.com" />
                </Form.Item>
            </Col>
            <Col xs={24} md={8}>
                <Form.Item<ChannelFormValues> label="端口" name="smtp_port" initialValue={isEdit ? undefined : 587}>
                    <InputNumber className="channel-form-control-sm" />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="用户名" name="username" rules={[{ required: !isEdit, message: '请输入用户名' }]}>
                    <Input />
                </Form.Item>
            </Col>
            <Col xs={24} md={12}>
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

const renderDingTalkFields = (isEdit: boolean) => (
    <>
        {renderWebhookField(isEdit, '请输入钉钉机器人 Webhook', 'https://oapi.dingtalk.com/robot/send?access_token=xxx')}
        <Form.Item<ChannelFormValues> label="加签密钥" name="secret">
            <Input.Password placeholder={isEdit ? '留空保持不变' : 'SEC...'} />
        </Form.Item>
    </>
);

const renderWeComFields = (isEdit: boolean) => (
    <>
        {renderWebhookField(isEdit, '请输入企业微信机器人 Webhook', 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx')}
        <div className="channel-form-empty-state" style={{ minHeight: 'auto', padding: '12px 0 0', justifyContent: 'flex-start' }}>
            企业微信机器人渠道只需要配置 Webhook，提醒对象不再在渠道级别固化。
        </div>
    </>
);

const renderSlackFields = (isEdit: boolean) => (
    <>
        {renderWebhookField(isEdit, '请输入 Slack Incoming Webhook', 'https://hooks.slack.com/services/xxx/yyy/zzz')}
        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="默认频道" name="channel">
                    <Input placeholder="#ops-alerts" />
                </Form.Item>
            </Col>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="发送用户名" name="username">
                    <Input placeholder="auto-healing" />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={16}>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="Emoji 图标" name="icon_emoji">
                    <Input placeholder=":robot_face:" />
                </Form.Item>
            </Col>
            <Col xs={24} md={12}>
                <Form.Item<ChannelFormValues> label="图标 URL" name="icon_url">
                    <Input placeholder="https://example.com/icon.png" />
                </Form.Item>
            </Col>
        </Row>
    </>
);

const renderTeamsFields = (isEdit: boolean) => (
    <>
        {renderWebhookField(isEdit, '请输入 Teams Incoming Webhook', 'https://example.webhook.office.com/webhookb2/...')}
        <Form.Item<ChannelFormValues> label="主题色" name="theme_color">
            <Input placeholder="6264A7" />
        </Form.Item>
    </>
);

const ChannelConnectionFields: React.FC<ChannelConnectionFieldsProps> = ({
    channelType,
    isEdit,
    loadedWebhookAuthType,
    webhookAuthType,
    onWebhookAuthTypeChange,
}) => {
    if (!channelType) {
        return <div className="channel-form-empty-state">请先选择渠道类型</div>;
    }

    if (channelType === 'webhook') {
        return renderWebhookFields(isEdit, loadedWebhookAuthType, webhookAuthType, onWebhookAuthTypeChange);
    }

    if (channelType === 'email') {
        return renderEmailFields(isEdit);
    }

    if (channelType === 'dingtalk') return renderDingTalkFields(isEdit);
    if (channelType === 'wecom') return renderWeComFields(isEdit);
    if (channelType === 'slack') return renderSlackFields(isEdit);
    if (channelType === 'teams') return renderTeamsFields(isEdit);
    return <div className="channel-form-empty-state">暂不支持的渠道类型</div>;
};

export default ChannelConnectionFields;
