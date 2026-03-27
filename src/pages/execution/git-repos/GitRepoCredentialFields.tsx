import React from 'react';
import { Col, Form, Input, Row } from 'antd';
import type { FormInstance } from 'antd';
import { valuesChangedAuthType, type GitRepoFormValues } from './gitRepoFormConfig';

type GitRepoCredentialFieldsProps = {
    authType?: string;
    form: FormInstance<GitRepoFormValues>;
    isEdit: boolean;
    originalAuthType: string;
};

function validateToken(isEdit: boolean, form: FormInstance<GitRepoFormValues>, originalAuthType: string) {
    return async (_: unknown, value?: string) => {
        const changedType = !isEdit || valuesChangedAuthType(form.getFieldValue('auth_type'), originalAuthType);
        if ((changedType && !value) || (!changedType && !isEdit && !value)) {
            throw new Error('请输入 Access Token');
        }
    };
}

function validatePasswordField(options: {
    form: FormInstance<GitRepoFormValues>;
    field: 'password' | 'username';
    isEdit: boolean;
    originalAuthType: string;
}) {
    const { field, form, isEdit, originalAuthType } = options;
    return async (_: unknown, value?: string) => {
        const changedType = valuesChangedAuthType(form.getFieldValue('auth_type'), originalAuthType);
        const pairedField = field === 'username' ? 'password' : 'username';
        const pairedValue = form.getFieldValue(pairedField);
        const label = field === 'username' ? '用户名' : '密码';
        if (changedType && !value) throw new Error(`请输入${label}`);
        if (!changedType && pairedValue && !value && isEdit) throw new Error(`请输入${label}`);
    };
}

function validatePrivateKey(isEdit: boolean, form: FormInstance<GitRepoFormValues>, originalAuthType: string) {
    return async (_: unknown, value?: string) => {
        const changedType = !isEdit || valuesChangedAuthType(form.getFieldValue('auth_type'), originalAuthType);
        if (changedType && !value) {
            throw new Error('请输入 SSH 私钥');
        }
    };
}

function GitRepoPasswordFields(props: { form: FormInstance<GitRepoFormValues>; isEdit: boolean; originalAuthType: string }) {
    const { form, isEdit, originalAuthType } = props;
    return (
        <Row gutter={12}>
            <Col span={12}>
                <Form.Item
                    name="username"
                    label="用户名"
                    rules={[{ validator: validatePasswordField({ field: 'username', form, isEdit, originalAuthType }) }]}
                >
                    <Input placeholder={isEdit ? '留空保持原值' : '请输入用户名'} />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ validator: validatePasswordField({ field: 'password', form, isEdit, originalAuthType }) }]}
                >
                    <Input.Password placeholder={isEdit ? '留空保持原值' : '请输入密码'} />
                </Form.Item>
            </Col>
        </Row>
    );
}

function GitRepoSshKeyFields(props: { form: FormInstance<GitRepoFormValues>; isEdit: boolean; originalAuthType: string }) {
    const { form, isEdit, originalAuthType } = props;
    return (
        <>
            <Form.Item name="private_key" label="SSH 私钥" rules={[{ validator: validatePrivateKey(isEdit, form, originalAuthType) }]}>
                <Input.TextArea rows={3} placeholder={isEdit ? '留空保持原值' : '-----BEGIN RSA PRIVATE KEY-----'} style={{ fontFamily: 'monospace', fontSize: 11 }} />
            </Form.Item>
            <Form.Item name="passphrase" label="密钥密码">
                <Input.Password placeholder={isEdit ? '留空保持原值' : '可选'} />
            </Form.Item>
        </>
    );
}

export default function GitRepoCredentialFields(props: GitRepoCredentialFieldsProps) {
    const { authType, form, isEdit, originalAuthType } = props;

    if (authType === 'token') {
        return (
            <Form.Item name="token" label="Access Token" rules={[{ validator: validateToken(isEdit, form, originalAuthType) }]}>
                <Input.Password placeholder={isEdit ? '留空保持原值' : 'ghp_xxxx'} />
            </Form.Item>
        );
    }

    if (authType === 'password') {
        return <GitRepoPasswordFields form={form} isEdit={isEdit} originalAuthType={originalAuthType} />;
    }

    if (authType === 'ssh_key') {
        return <GitRepoSshKeyFields form={form} isEdit={isEdit} originalAuthType={originalAuthType} />;
    }

    return null;
}
