import React, { useState, useEffect } from 'react';
import { history, useParams } from '@umijs/max';
import {
    Form, Input, Select, Button, message, Spin, Row, Col, Checkbox, Alert, InputNumber, Divider, Typography,
} from 'antd';
import { SaveOutlined, KeyOutlined, LockOutlined, FileOutlined, SafetyCertificateOutlined, GlobalOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getSecretsSource, createSecretsSource, updateSecretsSource,
} from '@/services/auto-healing/secrets';
import './SecretForm.css';

/* ========== 配置常量 ========== */
const SOURCE_TYPES = [
    { value: 'file', label: '本地密钥文件', icon: <FileOutlined />, supportPassword: false },
    { value: 'vault', label: 'HashiCorp Vault', icon: <SafetyCertificateOutlined />, supportPassword: true },
    { value: 'webhook', label: 'Webhook', icon: <GlobalOutlined />, supportPassword: true },
];

const AUTH_TYPES = [
    { value: 'ssh_key', label: 'SSH 密钥', icon: <KeyOutlined /> },
    { value: 'password', label: '密码认证', icon: <LockOutlined /> },
];

const VAULT_AUTH_TYPES = [
    { value: 'token', label: 'Token' },
    { value: 'approle', label: 'AppRole' },
];

const WEBHOOK_AUTH_TYPES = [
    { value: 'none', label: '无认证' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];

const SecretFormPage: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const authType = Form.useWatch('auth_type', form) || 'ssh_key';
    const sourceType = Form.useWatch('type', form) || 'file';
    const vaultAuthType = Form.useWatch('vault_auth_type', form) || 'token';
    const webhookAuthType = Form.useWatch('webhook_auth_type', form) || 'none';

    const availableSourceTypes = SOURCE_TYPES.filter(t => authType === 'ssh_key' || t.supportPassword);

    // ==================== Load Data ====================
    useEffect(() => {
        if (!isEdit || !params.id) {
            form.setFieldsValue({
                auth_type: 'ssh_key', type: 'file', priority: 100, is_default: false,
                vault_auth_type: 'token', webhook_auth_type: 'none', webhook_method: 'GET',
            });
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const res = await getSecretsSource(params.id!);
                const source = (res as any)?.data || res;
                const config = source.config || {};
                form.setFieldsValue({
                    name: source.name,
                    auth_type: source.auth_type,
                    type: source.type,
                    priority: source.priority,
                    is_default: source.is_default,
                    file_key_path: config.key_path,
                    file_username: config.username,
                    vault_address: config.address,
                    vault_secret_path: config.secret_path,
                    vault_query_key: config.query_key,
                    vault_auth_type: config.auth?.type || 'token',
                    vault_token: config.auth?.token,
                    vault_role_id: config.auth?.role_id,
                    vault_secret_id: config.auth?.secret_id,
                    vault_field_username: config.field_mapping?.username,
                    vault_field_password: config.field_mapping?.password,
                    vault_field_private_key: config.field_mapping?.private_key,
                    webhook_url: config.url,
                    webhook_method: config.method || 'GET',
                    webhook_query_key: config.query_key,
                    webhook_auth_type: config.auth?.type || 'none',
                    webhook_basic_username: config.auth?.username,
                    webhook_basic_password: config.auth?.password,
                    webhook_bearer_token: config.auth?.token,
                    webhook_api_key_header: config.auth?.header_name,
                    webhook_api_key: config.auth?.api_key,
                    webhook_response_path: config.response_data_path,
                    webhook_field_username: config.field_mapping?.username,
                    webhook_field_password: config.field_mapping?.password,
                    webhook_field_private_key: config.field_mapping?.private_key,
                });
            } catch {
                message.error('加载密钥源数据失败');
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

            let config: any = {};
            if (values.type === 'file') {
                config = { key_path: values.file_key_path, username: values.file_username };
            } else if (values.type === 'vault') {
                config = {
                    address: values.vault_address,
                    secret_path: values.vault_secret_path,
                    query_key: values.vault_query_key || undefined,
                    auth: {
                        type: values.vault_auth_type,
                        token: values.vault_token,
                        role_id: values.vault_role_id,
                        secret_id: values.vault_secret_id,
                    },
                    field_mapping: {
                        username: values.vault_field_username,
                        password: values.vault_field_password,
                        private_key: values.vault_field_private_key,
                    },
                };
            } else if (values.type === 'webhook') {
                config = {
                    url: values.webhook_url,
                    method: values.webhook_method,
                    query_key: values.webhook_query_key || undefined,
                    auth: {
                        type: values.webhook_auth_type,
                        username: values.webhook_basic_username,
                        password: values.webhook_basic_password,
                        token: values.webhook_bearer_token,
                        header_name: values.webhook_api_key_header,
                        api_key: values.webhook_api_key,
                    },
                    response_data_path: values.webhook_response_path,
                    field_mapping: {
                        username: values.webhook_field_username,
                        password: values.webhook_field_password,
                        private_key: values.webhook_field_private_key,
                    },
                };
            }

            const payload: any = {
                name: values.name,
                type: values.type,
                auth_type: values.auth_type,
                priority: values.priority,
                is_default: values.is_default,
                config,
            };

            if (isEdit && params.id) {
                await updateSecretsSource(params.id, payload);
                message.success('更新成功');
            } else {
                await createSecretsSource(payload);
                message.success('创建成功');
            }
            history.push('/resources/secrets');
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('保存失败');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Render ====================
    return (
        <div className="secret-form-page">
            <SubPageHeader
                title={isEdit ? '编辑密钥源' : '新建密钥源'}
                onBack={() => history.push('/resources/secrets')}
            />

            <div className="secret-form-card">
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical" className="secret-form-content">
                        {isEdit && (
                            <Alert
                                message="敏感配置保护中"
                                description="出于安全考虑，密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info" showIcon style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* 基础信息 */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>基础信息</Typography.Title>
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="name" label="名称"
                                    tooltip="密钥源的唯一标识名称，建议包含环境和用途信息"
                                    rules={[{ required: true, message: '请输入名称' }]}
                                >
                                    <Input placeholder="例如：生产环境服务器密钥" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item
                                    name="priority" label="优先级"
                                    tooltip="当多个密钥源可用时，优先级数值越大的越先被使用。范围 1~999"
                                >
                                    <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="100" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="auth_type" label="凭据类型"
                                    tooltip="SSH 密钥：用于 SSH 私钥认证，适合 Linux/Unix 主机。密码认证：用于用户名+密码的方式连接目标主机"
                                    rules={[{ required: true }]}
                                >
                                    <Select options={AUTH_TYPES} disabled={isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="type" label="密钥源类型"
                                    tooltip="本地密钥文件：直接读取服务器上的密钥文件。Vault：从 HashiCorp Vault 动态获取凭据。Webhook：通过 HTTP API 从外部系统获取凭据"
                                    rules={[{ required: true }]}
                                >
                                    <Select options={availableSourceTypes} disabled={isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="is_default" valuePropName="checked" noStyle>
                                    <Checkbox>设为默认密钥源（当任务未指定密钥源时自动使用）</Checkbox>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '8px 0 24px' }} />

                        {/* ========== 连接配置 ========== */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>连接配置</Typography.Title>

                        {/* --- 本地文件 --- */}
                        {sourceType === 'file' && (
                            <>
                                <Alert type="info" message="直接读取部署服务器上的 SSH 私钥文件，适用于密钥存储在本地的场景。" style={{ marginBottom: 16 }} />
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="file_key_path" label="私钥文件路径"
                                            tooltip="服务器上私钥文件的绝对路径。系统将读取此文件用于 SSH 认证"
                                            rules={[{ required: true, message: '请输入私钥绝对路径' }]}
                                            extra="例如：/root/.ssh/id_rsa 或 /home/deploy/.ssh/id_ed25519"
                                        >
                                            <Input placeholder="/root/.ssh/id_rsa" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="file_username" label="默认用户名"
                                            tooltip="SSH 连接时使用的默认用户名。如果任务模板中未指定用户名，将使用此值"
                                            extra="通常为 root 或专用的运维账号"
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="root" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* --- HashiCorp Vault --- */}
                        {sourceType === 'vault' && (
                            <>
                                <Alert type="info" message="从 HashiCorp Vault KV 引擎（v1/v2）动态读取凭据。支持根据主机名或 IP 动态查询不同密钥。" style={{ marginBottom: 16 }} />
                                <Row gutter={24}>
                                    <Col span={10}>
                                        <Form.Item
                                            name="vault_address" label="Vault 服务地址"
                                            tooltip="HashiCorp Vault 实例的访问地址，包含协议和端口"
                                            rules={[{ required: true }]}
                                            extra="例如：https://vault.company.com 或 http://10.0.0.1:8200"
                                        >
                                            <Input placeholder="http://127.0.0.1:8200" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="vault_auth_type" label="认证方式"
                                            tooltip="Token：直接使用 Vault Token 认证。AppRole：通过 Role ID 和 Secret ID 进行应用级认证"
                                            initialValue="token"
                                        >
                                            <Select options={VAULT_AUTH_TYPES} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                {vaultAuthType === 'token' && (
                                    <Row gutter={24}>
                                        <Col span={16}>
                                            <Form.Item
                                                name="vault_token" label="Vault Token"
                                                tooltip="用于访问 Vault API 的认证令牌。建议使用有限权限的策略绑定 Token"
                                                rules={[{ required: !isEdit }]}
                                                extra="可在 Vault UI 或通过 vault token create 命令生成"
                                            >
                                                <Input.Password placeholder={isEdit ? '留空保持不变' : 'hvs.xxxxxxxxxxxxxxxxxxxxx'} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                                {vaultAuthType === 'approle' && (
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="vault_role_id" label="Role ID"
                                                tooltip="AppRole 认证的 Role 标识符，通常是 UUID 格式"
                                                rules={[{ required: true }]}
                                                extra="通过 vault read auth/approle/role/my-role/role-id 获取"
                                            >
                                                <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="vault_secret_id" label="Secret ID"
                                                tooltip="AppRole 认证的秘密标识符，与 Role ID 配对使用"
                                                rules={[{ required: !isEdit }]}
                                                extra="通过 vault write -f auth/approle/role/my-role/secret-id 生成"
                                            >
                                                <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                                <Row gutter={24}>
                                    <Col span={10}>
                                        <Form.Item
                                            name="vault_secret_path" label="Secret 路径"
                                            tooltip="Vault 中存储密钥数据的 KV 路径。支持 {hostname} 和 {ip} 变量，系统会根据目标主机自动替换"
                                            rules={[{ required: true }]}
                                            extra="静态路径：secret/data/ssh-keys | 动态路径：secret/data/hosts/{hostname}"
                                        >
                                            <Input placeholder="secret/data/ssh-keys" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="vault_query_key" label="查询键"
                                            tooltip="当 Secret 路径使用了 {hostname} 或 {ip} 变量时，指定替换变量的数据来源"
                                        >
                                            <Select allowClear placeholder="选择查询键" options={[{ label: '主机名 (hostname)', value: 'hostname' }, { label: 'IP 地址 (ip)', value: 'ip' }]} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <div className="plugin-form-subsection">
                                    <div className="plugin-form-subsection-header">
                                        <Typography.Text strong style={{ fontSize: 13 }}>字段映射</Typography.Text>
                                    </div>
                                    <Alert type="info" message="指定 Vault 返回的 JSON 中，各凭据对应的字段名 (Key)。留空则使用默认 Key 名。" style={{ marginBottom: 12 }} />
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="vault_field_username" label="用户名字段"
                                                tooltip="Vault Secret 中存储用户名的 JSON Key"
                                                extra="默认：username"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="username" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="vault_field_password" label="密码字段"
                                                tooltip="Vault Secret 中存储密码的 JSON Key"
                                                extra="默认：password"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="password" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="vault_field_private_key" label="私钥字段"
                                                tooltip="Vault Secret 中存储 SSH 私钥内容的 JSON Key"
                                                extra="默认：private_key"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="private_key" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            </>
                        )}

                        {/* --- Webhook --- */}
                        {sourceType === 'webhook' && (
                            <>
                                <Alert type="info" message="通过 HTTP 请求从外部密钥管理系统（如 CyberArk、自研 CMDB 等）获取凭据。" style={{ marginBottom: 16 }} />
                                <Row gutter={24}>
                                    <Col span={14}>
                                        <Form.Item
                                            name="webhook_url" label="API 地址"
                                            tooltip="外部系统提供凭据的 HTTP 接口地址。支持 {hostname} 和 {ip} 变量，运行时自动替换为目标主机信息"
                                            rules={[{ required: true }]}
                                            extra="例如：https://cmdb.company.com/api/credentials?host={hostname}"
                                        >
                                            <Input placeholder="https://api.internal/get-secret?ip={ip}" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            name="webhook_method" label="请求方法"
                                            tooltip="调用外部 API 时使用的 HTTP 方法"
                                            initialValue="GET"
                                        >
                                            <Select options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="webhook_query_key" label="查询键"
                                            tooltip="当 URL 使用了 {hostname} 或 {ip} 变量时，指定替换变量的数据来源"
                                        >
                                            <Select allowClear placeholder="选择查询键" options={[{ label: '主机名 (hostname)', value: 'hostname' }, { label: 'IP 地址 (ip)', value: 'ip' }]} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={24}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="webhook_auth_type" label="认证方式"
                                            tooltip="调用外部 API 时使用的认证方式"
                                            initialValue="none"
                                        >
                                            <Select options={WEBHOOK_AUTH_TYPES} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                {webhookAuthType === 'basic' && (
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_basic_username" label="Basic Auth 用户名"
                                                tooltip="HTTP Basic 认证的用户名"
                                            >
                                                <Input placeholder="api_user" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_basic_password" label="Basic Auth 密码"
                                                tooltip="HTTP Basic 认证的密码"
                                            >
                                                <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                                {webhookAuthType === 'bearer' && (
                                    <Row gutter={24}>
                                        <Col span={16}>
                                            <Form.Item
                                                name="webhook_bearer_token" label="Bearer Token"
                                                tooltip="放在 Authorization: Bearer <token> 请求头中的令牌"
                                                extra="不需要加 'Bearer' 前缀，系统会自动添加"
                                            >
                                                <Input.Password placeholder={isEdit ? '留空保持不变' : 'eyJhbGciOiJIUzI1NiIs...'} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                                {webhookAuthType === 'api_key' && (
                                    <Row gutter={24}>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_api_key_header" label="Header 名称"
                                                tooltip="API Key 放置在请求头中的 Header 名称"
                                                extra="常见：X-API-Key, Authorization"
                                            >
                                                <Input placeholder="X-API-Key" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_api_key" label="API Key 值"
                                                tooltip="API Key 的实际值"
                                            >
                                                <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                )}
                                <Row gutter={24}>
                                    <Col span={10}>
                                        <Form.Item
                                            name="webhook_response_path" label="响应数据路径"
                                            tooltip="API 返回的 JSON 中，凭据数据所在的 JSON 路径。例如返回 {data: {credential: {...}}} 时填 data.credential"
                                            extra='留空表示使用整个响应体 | 示例：data、result.credential'
                                        >
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
                                            <Form.Item
                                                name="webhook_field_username" label="用户名字段"
                                                tooltip="响应 JSON 中存储用户名的 Key"
                                                extra="默认：username"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="username" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_field_password" label="密码字段"
                                                tooltip="响应 JSON 中存储密码的 Key"
                                                extra="默认：password"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="password" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={8}>
                                            <Form.Item
                                                name="webhook_field_private_key" label="私钥字段"
                                                tooltip="响应 JSON 中存储 SSH 私钥的 Key"
                                                extra="默认：private_key"
                                                style={{ marginBottom: 0 }}
                                            >
                                                <Input placeholder="private_key" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            </>
                        )}

                        <Divider style={{ margin: '16px 0 24px' }} />
                        <div className="secret-form-actions">
                            <Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={handleSubmit}>
                                {isEdit ? '保存修改' : '创建密钥源'}
                            </Button>
                            <Button onClick={() => history.push('/resources/secrets')}>取消</Button>
                        </div>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default SecretFormPage;
