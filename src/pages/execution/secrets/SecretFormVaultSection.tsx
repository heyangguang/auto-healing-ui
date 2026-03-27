import React from 'react';
import { Alert, Col, Form, Input, Row, Select, Typography } from 'antd';
import { VAULT_AUTH_TYPES } from './secretFormConfig';

type SecretFormVaultSectionProps = {
    isEdit: boolean;
    loadedVaultAuthType?: string;
    vaultAuthType: string;
};

export default function SecretFormVaultSection(props: SecretFormVaultSectionProps) {
    const { isEdit, loadedVaultAuthType, vaultAuthType } = props;

    return (
        <>
            <Alert type="info" message="从 HashiCorp Vault KV 引擎（v1/v2）动态读取凭据。支持根据主机名或 IP 动态查询不同密钥。" style={{ marginBottom: 16 }} />
            <Row gutter={24}>
                <Col span={10}>
                    <Form.Item name="vault_address" label="Vault 服务地址" tooltip="HashiCorp Vault 实例的访问地址，包含协议和端口" rules={[{ required: true }]} extra="例如：https://vault.company.com 或 http://10.0.0.1:8200">
                        <Input placeholder="http://127.0.0.1:8200" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="vault_auth_type" label="认证方式" tooltip="Token：直接使用 Vault Token 认证。AppRole：通过 Role ID 和 Secret ID 进行应用级认证" initialValue="token">
                        <Select options={VAULT_AUTH_TYPES} />
                    </Form.Item>
                </Col>
            </Row>
            {vaultAuthType === 'token' && (
                <Row gutter={24}>
                    <Col span={16}>
                        <Form.Item name="vault_token" label="Vault Token" tooltip="用于访问 Vault API 的认证令牌。建议使用有限权限的策略绑定 Token" rules={[{ required: !isEdit || loadedVaultAuthType !== 'token' }]} extra="可在 Vault UI 或通过 vault token create 命令生成">
                            <Input.Password placeholder={isEdit ? '留空保持不变' : 'hvs.xxxxxxxxxxxxxxxxxxxxx'} />
                        </Form.Item>
                    </Col>
                </Row>
            )}
            {vaultAuthType === 'approle' && (
                <Row gutter={24}>
                    <Col span={8}>
                        <Form.Item name="vault_role_id" label="Role ID" tooltip="AppRole 认证的 Role 标识符，通常是 UUID 格式" rules={[{ required: true }]} extra="通过 vault read auth/approle/role/my-role/role-id 获取">
                            <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="vault_secret_id" label="Secret ID" tooltip="AppRole 认证的秘密标识符，与 Role ID 配对使用" rules={[{ required: !isEdit || loadedVaultAuthType !== 'approle', message: '请输入 Secret ID' }]} extra="通过 vault write -f auth/approle/role/my-role/secret-id 生成">
                            <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                        </Form.Item>
                    </Col>
                </Row>
            )}
            <Row gutter={24}>
                <Col span={10}>
                    <Form.Item name="vault_secret_path" label="Secret 路径" tooltip="Vault 中存储密钥数据的 KV 路径。支持 {hostname} 和 {ip} 变量，系统会根据目标主机自动替换" rules={[{ required: true }]} extra="静态路径：secret/data/ssh-keys | 动态路径：secret/data/hosts/{hostname}">
                        <Input placeholder="secret/data/ssh-keys" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="vault_query_key" label="查询键" tooltip="当 Secret 路径使用了 {hostname} 或 {ip} 变量时，指定替换变量的数据来源">
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
                        <Form.Item name="vault_field_username" label="用户名字段" tooltip="Vault Secret 中存储用户名的 JSON Key" extra="默认：username" style={{ marginBottom: 0 }}>
                            <Input placeholder="username" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="vault_field_password" label="密码字段" tooltip="Vault Secret 中存储密码的 JSON Key" extra="默认：password" style={{ marginBottom: 0 }}>
                            <Input placeholder="password" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="vault_field_private_key" label="私钥字段" tooltip="Vault Secret 中存储 SSH 私钥内容的 JSON Key" extra="默认：private_key" style={{ marginBottom: 0 }}>
                            <Input placeholder="private_key" />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        </>
    );
}
