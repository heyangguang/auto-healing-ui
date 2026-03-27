import React from 'react';
import { history, useAccess } from '@umijs/max';
import { Alert, Button, Checkbox, Col, Divider, Form, Input, InputNumber, Row, Select, Spin, Typography, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import SecretFormFileSection from './SecretFormFileSection';
import SecretFormVaultSection from './SecretFormVaultSection';
import SecretFormWebhookSection from './SecretFormWebhookSection';
import {
    AUTH_TYPES,
    getSecretFormInitialValues,
    hasFormErrorFields,
    type SecretFormValues,
} from './secretFormConfig';
import { useSecretFormState } from './useSecretFormState';
import './SecretForm.css';

const SecretFormPage: React.FC = () => {
    const access = useAccess();
    const [form] = Form.useForm<SecretFormValues>();
    const state = useSecretFormState({ form });

    return (
        <div className="secret-form-page">
            <SubPageHeader title={state.isEdit ? '编辑密钥源' : '新建密钥源'} onBack={() => history.push('/resources/secrets')} />

            <div className="secret-form-card">
                <Spin spinning={state.loading}>
                    <Form form={form} layout="vertical" className="secret-form-content" initialValues={getSecretFormInitialValues()}>
                        {state.isEdit && state.loadError && (
                            <Alert
                                message="密钥源详情加载失败"
                                description={state.loadError}
                                type="error"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}
                        {state.isEdit && (
                            <Alert
                                message="敏感配置保护中"
                                description="出于安全考虑，密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info"
                                showIcon
                                style={{ marginBottom: 24 }}
                            />
                        )}

                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>基础信息</Typography.Title>
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item name="name" label="名称" tooltip="密钥源的唯一标识名称，建议包含环境和用途信息" rules={[{ required: true, message: '请输入名称' }]}>
                                    <Input placeholder="例如：生产环境服务器密钥" />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name="priority" label="优先级" tooltip="当多个密钥源可用时，优先级数值越小的越先被使用。范围 1~999">
                                    <InputNumber min={1} max={999} style={{ width: '100%' }} placeholder="100" />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="auth_type" label="凭据类型" tooltip="SSH 密钥：用于 SSH 私钥认证，适合 Linux/Unix 主机。密码认证：用于用户名+密码的方式连接目标主机" rules={[{ required: true }]}>
                                    <Select options={AUTH_TYPES} disabled={state.isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="type" label="密钥源类型" tooltip="本地密钥文件：直接读取服务器上的密钥文件。Vault：从 HashiCorp Vault 动态获取凭据。Webhook：通过 HTTP API 从外部系统获取凭据" rules={[{ required: true }]}>
                                    <Select options={state.availableSourceTypes} disabled={state.isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="is_default" valuePropName="checked" noStyle>
                                    <Checkbox>设为默认密钥源（当任务未指定密钥源时自动使用）</Checkbox>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '8px 0 24px' }} />
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>连接配置</Typography.Title>
                        {state.sourceType === 'file' && <SecretFormFileSection />}
                        {state.sourceType === 'vault' && <SecretFormVaultSection isEdit={state.isEdit} loadedVaultAuthType={state.loadedVaultAuthType} vaultAuthType={state.vaultAuthType} />}
                        {state.sourceType === 'webhook' && <SecretFormWebhookSection isEdit={state.isEdit} loadedWebhookAuthType={state.loadedWebhookAuthType} webhookAuthType={state.webhookAuthType} />}

                        <Divider style={{ margin: '16px 0 24px' }} />
                        <div className="secret-form-actions">
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                loading={state.submitting}
                                disabled={
                                    (state.isEdit ? !access.canUpdateSecretsSource : !access.canCreateSecretsSource)
                                    || !!state.loadError
                                }
                                onClick={async () => {
                                    try {
                                        await state.handleSubmit();
                                    } catch (error: unknown) {
                                        if (!hasFormErrorFields(error)) {
                                            message.error(error instanceof Error ? error.message : '保存密钥源失败');
                                        }
                                    }
                                }}
                            >
                                {state.isEdit ? '保存修改' : '创建密钥源'}
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
