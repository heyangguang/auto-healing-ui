import React from 'react';
import { Alert, Button, Col, Divider, Form, Input, Row, Select } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import GitRepoAuthFields from './GitRepoAuthFields';
import GitRepoSyncSettings from './GitRepoSyncSettings';
import { gitRepoFormInitialValues, type GitRepoFormValues } from './gitRepoFormConfig';
import { useGitRepoFormState } from './useGitRepoFormState';
import './GitRepoForm.css';

const GitRepoFormPage: React.FC = () => {
    const access = useAccess();
    const [form] = Form.useForm<GitRepoFormValues>();
    const state = useGitRepoFormState({ form });

    return (
        <div className="git-form-page">
            <SubPageHeader
                title={state.isEdit ? '编辑代码仓库' : '添加代码仓库'}
                onBack={() => history.push('/execution/git-repos')}
                actions={(
                    <div className="git-form-actions">
                        <Button onClick={() => history.push('/execution/git-repos')}>取消</Button>
                        <Button
                            type="primary"
                            onClick={state.handleSubmit}
                            loading={state.submitting}
                            disabled={(state.isEdit ? !access.canUpdateGitRepo : !access.canCreateGitRepo) || state.loadFailed}
                        >
                            {state.isEdit ? '保存' : '创建'}
                        </Button>
                    </div>
                )}
            />

            <div className="git-form-card">
                <div className="git-form-content">
                    <Form form={form} layout="vertical" requiredMark={false} initialValues={gitRepoFormInitialValues} onValuesChange={state.handleValuesChange}>
                        {state.isEdit && state.loadFailed && (
                            <Alert
                                type="error"
                                showIcon
                                style={{ marginBottom: 16 }}
                                message="仓库详情加载失败"
                                action={state.reloadDetail ? <Button size="small" onClick={state.reloadDetail}>重试加载</Button> : undefined}
                            />
                        )}
                        <h4 className="git-form-section-title">
                            <GithubOutlined style={{ marginRight: 8 }} />仓库信息
                        </h4>

                        <GitRepoAuthFields
                            access={{ canCreateGitRepo: access.canCreateGitRepo, canUpdateGitRepo: access.canUpdateGitRepo }}
                            authType={state.authType}
                            availableBranches={state.availableBranches}
                            defaultBranch={state.defaultBranch}
                            form={form}
                            isEdit={state.isEdit}
                            loadFailed={state.loadFailed}
                            originalAuthType={state.originalAuthType}
                            validated={state.validated}
                            validating={state.validating || state.loading}
                            onUrlChange={() => {}}
                            onValidate={state.handleValidate}
                        />

                        <Divider />

                        <h4 className="git-form-section-title">基本设置</h4>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
                                    <Input placeholder="ansible-playbooks" disabled={state.isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="default_branch" label="默认分支" rules={[{ required: true, message: '请选择分支' }]}>
                                    <Select placeholder={state.validated ? '请选择' : '请先验证仓库'} disabled={!state.validated}>
                                        {state.availableBranches.map((branch) => (
                                            <Select.Option key={branch} value={branch}>
                                                {branch === state.defaultBranch ? `${branch} (默认)` : branch}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        <h4 className="git-form-section-title">同步设置</h4>
                        <GitRepoSyncSettings syncEnabled={state.syncEnabled} />
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default GitRepoFormPage;
