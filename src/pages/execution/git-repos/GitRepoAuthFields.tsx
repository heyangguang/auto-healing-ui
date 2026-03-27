import React from 'react';
import { BranchesOutlined } from '@ant-design/icons';
import { Form, Input, Radio, Space } from 'antd';
import type { FormInstance } from 'antd';
import { authTypeOptions, type GitRepoFormValues } from './gitRepoFormConfig';
import GitRepoCredentialFields from './GitRepoCredentialFields';
import GitRepoValidationStatus from './GitRepoValidationStatus';

type GitRepoAuthFieldsProps = {
    access: { canCreateGitRepo?: boolean; canUpdateGitRepo?: boolean };
    authType?: string;
    availableBranches: string[];
    defaultBranch: string;
    form: FormInstance<GitRepoFormValues>;
    isEdit: boolean;
    loadFailed: boolean;
    originalAuthType: string;
    validated: boolean;
    validating: boolean;
    onUrlChange: () => void;
    onValidate: () => void;
};

function GitRepoAuthTypeSelector() {
    return (
        <Form.Item name="auth_type" label="认证方式">
            <Radio.Group>
                <Space size="middle">
                    {authTypeOptions.map((option) => (
                        <Radio key={option.value} value={option.value}>
                            <Space size={4}>
                                <span style={{ color: '#666' }}>{option.icon}</span>
                                <span>{option.label}</span>
                            </Space>
                        </Radio>
                    ))}
                </Space>
            </Radio.Group>
        </Form.Item>
    );
}

export default function GitRepoAuthFields(props: GitRepoAuthFieldsProps) {
    const { access, authType, availableBranches, defaultBranch, form, isEdit, loadFailed, originalAuthType, validated, validating, onUrlChange, onValidate } = props;

    return (
        <>
            <Form.Item name="url" label="仓库地址" rules={[{ required: true, message: '请输入仓库地址' }]} extra="支持 HTTPS 和 SSH 协议">
                <Input
                    size="large"
                    placeholder="https://github.com/org/repo.git"
                    prefix={<BranchesOutlined style={{ color: '#bfbfbf' }} />}
                    onChange={onUrlChange}
                    disabled={isEdit}
                />
            </Form.Item>
            <GitRepoAuthTypeSelector />
            <GitRepoCredentialFields authType={authType} form={form} isEdit={isEdit} originalAuthType={originalAuthType} />
            <GitRepoValidationStatus access={access} availableBranches={availableBranches} defaultBranch={defaultBranch} isEdit={isEdit} loadFailed={loadFailed} validated={validated} validating={validating} onValidate={onValidate} />
        </>
    );
}
