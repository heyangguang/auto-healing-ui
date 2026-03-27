import React from 'react';
import { BranchesOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Button, Space, Tag, Typography } from 'antd';

const { Text } = Typography;

type GitRepoValidationStatusProps = {
    access: { canCreateGitRepo?: boolean; canUpdateGitRepo?: boolean };
    availableBranches: string[];
    defaultBranch: string;
    isEdit: boolean;
    loadFailed: boolean;
    validated: boolean;
    validating: boolean;
    onValidate: () => void;
};

function ValidationButton(props: {
    access: { canCreateGitRepo?: boolean; canUpdateGitRepo?: boolean };
    isEdit: boolean;
    loadFailed: boolean;
    validated: boolean;
    validating: boolean;
    onValidate: () => void;
}) {
    const { access, isEdit, loadFailed, validated, validating, onValidate } = props;
    return (
        <div style={{ marginBottom: 24 }}>
            <Button
                onClick={onValidate}
                loading={validating}
                icon={<CheckCircleOutlined />}
                disabled={(isEdit ? !access.canUpdateGitRepo : !access.canCreateGitRepo) || loadFailed}
                type={validated ? 'default' : 'primary'}
            >
                {validating ? '验证中...' : validated ? '重新验证' : '验证并获取分支'}
            </Button>
        </div>
    );
}

export default function GitRepoValidationStatus(props: GitRepoValidationStatusProps) {
    const { access, availableBranches, defaultBranch, isEdit, loadFailed, validated, validating, onValidate } = props;

    return (
        <>
            <ValidationButton access={access} isEdit={isEdit} loadFailed={loadFailed} validated={validated} validating={validating} onValidate={onValidate} />
            {validated && availableBranches.length > 0 && (
                <div className="git-form-validate-result">
                    <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text>验证成功，检测到 {availableBranches.length} 个分支</Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                        {availableBranches.map((branch) => (
                            <Tag key={branch} icon={<BranchesOutlined />} color={branch === defaultBranch ? 'blue' : undefined}>
                                {branch}
                            </Tag>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
