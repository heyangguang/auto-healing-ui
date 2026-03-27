import React from 'react';
import { Alert, Col, Form, Input, Row, Select, Typography } from 'antd';
import { WEBHOOK_AUTH_TYPES } from './secretFormConfig';

type SecretFormWebhookSectionProps = {
    isEdit: boolean;
    loadedWebhookAuthType?: string;
    webhookAuthType: string;
};

export default function SecretFormWebhookSection(props: SecretFormWebhookSectionProps) {
    const { isEdit, loadedWebhookAuthType, webhookAuthType } = props;

    return (
        <>
            <Alert type="info" message="通过 HTTP 请求从外部密钥管理系统（如 CyberArk、自研 CMDB 等）获取凭据。" style={{ marginBottom: 16 }} />
            <Row gutter={24}>
                <Col span={14}>
                    <Form.Item name="webhook_url" label="API 地址" tooltip="外部系统提供凭据的 HTTP 接口地址。支持 {hostname} 和 {ip} 变量，运行时自动替换为目标主机信息" rules={[{ required: true }]} extra="例如：https://cmdb.company.com/api/credentials?host={hostname}">
                        <Input placeholder="https://api.internal/get-secret?ip={ip}" />
                    </Form.Item>
                </Col>
                <Col span={4}>
                    <Form.Item name="webhook_method" label="请求方法" tooltip="调用外部 API 时使用的 HTTP 方法" initialValue="POST">
                        <Select options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="webhook_query_key" label="查询键" tooltip="当 URL 使用了 {hostname} 或 {ip} 变量时，指定替换变量的数据来源">
                        <Select allowClear placeholder="选择查询键" options={[{ label: '主机名 (hostname)', value: 'hostname' }, { label: 'IP 地址 (ip)', value: 'ip' }]} />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="webhook_auth_type" label="认证方式" tooltip="调用外部 API 时使用的认证方式" initialValue="none">
                        <Select options={WEBHOOK_AUTH_TYPES} />
                    </Form.Item>
                </Col>
            </Row>
            {webhookAuthType === 'basic' && (
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="webhook_basic_username" label="Basic Auth 用户名" tooltip="HTTP Basic 认证的用户名" rules={[{ required: true, message: '请输入 Basic Auth 用户名' }]}>
                            <Input placeholder="api_user" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="webhook_basic_password" label="Basic Auth 密码" tooltip="HTTP Basic 认证的密码" rules={[{ required: !isEdit || loadedWebhookAuthType !== 'basic', message: '请输入 Basic Auth 密码' }]}>
                            <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                        </Form.Item>
                    </Col>
                </Row>
            )}
            {webhookAuthType === 'bearer' && (
                <Row gutter={24}>
                    <Col span={16}>
                        <Form.Item name="webhook_bearer_token" label="Bearer Token" tooltip="放在 Authorization: Bearer <token> 请求头中的令牌" extra="不需要加 'Bearer' 前缀，系统会自动添加" rules={[{ required: !isEdit || loadedWebhookAuthType !== 'bearer', message: '请输入 Bearer Token' }]}>
                            <Input.Password placeholder={isEdit ? '留空保持不变' : 'eyJhbGciOiJIUzI1NiIs...'} />
                        </Form.Item>
                    </Col>
                </Row>
            )}
            {webhookAuthType === 'api_key' && (
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="webhook_api_key_header" label="Header 名称" tooltip="API Key 放置在请求头中的 Header 名称" extra="常见：X-API-Key, Authorization" rules={[{ required: true, message: '请输入 Header 名称' }]}>
                            <Input placeholder="X-API-Key" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="webhook_api_key" label="API Key 值" tooltip="API Key 的实际值" rules={[{ required: !isEdit || loadedWebhookAuthType !== 'api_key', message: '请输入 API Key' }]}>
                            <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                        </Form.Item>
                    </Col>
                </Row>
            )}
            <Row gutter={24}>
                <Col span={10}>
                    <Form.Item name="webhook_response_path" label="响应数据路径" tooltip="API 返回的 JSON 中，凭据数据所在的 JSON 路径。例如返回 {data: {credential: {...}}} 时填 data.credential" extra="留空表示使用整个响应体 | 示例：data、result.credential">
                        <Input placeholder="data" />
                    </Form.Item>
                </Col>
            </Row>
            <div className="plugin-form-subsection">
                <div className="plugin-form-subsection-header">
                    <Typography.Text strong style={{ fontSize: 13 }}>字段映射</Typography.Text>
                </div>
                <Alert type="info" message="指定 API 响应 JSON 中各凭据对应的字段名 (Key)。留空则使用默认 Key 名。" style={{ marginBottom: 12 }} />
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="webhook_field_username" label="用户名字段" tooltip="响应 JSON 中存储用户名的 Key" extra="默认：username" style={{ marginBottom: 0 }}>
                            <Input placeholder="username" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="webhook_field_password" label="密码字段" tooltip="响应 JSON 中存储密码的 Key" extra="默认：password" style={{ marginBottom: 0 }}>
                            <Input placeholder="password" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="webhook_field_private_key" label="私钥字段" tooltip="响应 JSON 中存储 SSH 私钥的 Key" extra="默认：private_key" style={{ marginBottom: 0 }}>
                            <Input placeholder="private_key" />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </>
    );
}
