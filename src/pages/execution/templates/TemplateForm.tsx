import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyOutlined } from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import { Button, Form, Spin, message } from 'antd';
import SubPageHeader from '@/components/SubPageHeader';
import SecretsSourceSelector from '@/components/SecretsSourceSelector';
import {
    confirmExecutionTaskReview,
    createExecutionTask,
    updateExecutionTask,
} from '@/services/auto-healing/execution';
import {
    invalidateSelectorInventory,
    selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';
import TemplateBasicInfoCard from './TemplateBasicInfoCard';
import TemplateEnvironmentCard from './TemplateEnvironmentCard';
import TemplateNotificationCard from './TemplateNotificationCard';
import TemplateReviewAlert from './TemplateReviewAlert';
import TemplateSecretsSourceField from './TemplateSecretsSourceField';
import TemplateVariablesCard from './TemplateVariablesCard';
import {
    buildTemplateMutationPayload,
    getMissingRequiredVariables,
    type TemplateFormValues,
} from './templateFormHelpers';
import {
    filterPlaybookVariables,
    getPlaybookVariables,
} from './templateVariableHelpers';
import { useTemplateFormData } from './useTemplateFormData';
import './TemplateForm.css';

const TemplateFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [secretsModalOpen, setSecretsModalOpen] = useState(false);
    const [varSearch, setVarSearch] = useState('');
    const [showOnlyRequired, setShowOnlyRequired] = useState(false);
    const {
        changedVariables,
        handleSelectPlaybook,
        loading,
        loadingPlaybook,
        needsReview,
        notifyChannels,
        notifyTemplates,
        playbooks,
        secretsSources,
        selectedPlaybook,
        setVariableValues,
        variableValues,
    } = useTemplateFormData({
        form,
        isEdit,
        taskId: params.id,
    });
    const selectedSecretIds = Form.useWatch('secrets_source_ids', form) || [];

    const variables = useMemo(
        () => getPlaybookVariables(selectedPlaybook),
        [selectedPlaybook],
    );
    const filteredVariables = useMemo(
        () => filterPlaybookVariables(variables, {
            onlyRequired: showOnlyRequired,
            searchText: varSearch,
        }),
        [showOnlyRequired, varSearch, variables],
    );

    useEffect(() => {
        setVarSearch('');
        setShowOnlyRequired(false);
    }, [isEdit, params.id]);

    const handleVariableChange = useCallback((name: string, value: unknown) => {
        setVariableValues((previousValues) => ({
            ...previousValues,
            [name]: value,
        }));
    }, [setVariableValues]);

    const handleSecretsConfirm = useCallback((sourceId: string) => {
        const current = form.getFieldValue('secrets_source_ids') || [];
        if (!current.includes(sourceId)) {
            form.setFieldsValue({ secrets_source_ids: [...current, sourceId] });
        }
        setSecretsModalOpen(false);
    }, [form]);

    const handleRemoveSecret = useCallback((sourceId: string) => {
        const current = form.getFieldValue('secrets_source_ids') || [];
        form.setFieldsValue({
            secrets_source_ids: current.filter((id: string) => id !== sourceId),
        });
    }, [form]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields() as TemplateFormValues;
            if (values.playbook_id && loadingPlaybook) {
                message.warning('Playbook 变量仍在加载，请稍后再保存');
                return;
            }
            if (values.playbook_id && !selectedPlaybook) {
                message.error('Playbook 元数据加载失败，无法校验变量，请刷新后重试');
                return;
            }

            const missingVariables = getMissingRequiredVariables(variables, variableValues);
            if (missingVariables.length > 0) {
                message.error(`缺少必填参数: ${missingVariables.map((variable) => variable.name).join(', ')}`);
                return;
            }

            setSubmitting(true);
            const payload = buildTemplateMutationPayload({
                selectedPlaybook,
                values,
                variableValues,
            });

            if (isEdit && params.id) {
                await updateExecutionTask(params.id, payload);
                if (needsReview) {
                    await confirmExecutionTaskReview(params.id);
                }
                invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
                message.success('更新成功');
            } else {
                await createExecutionTask(payload as never);
                invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
                message.success('创建成功');
            }

            history.push('/execution/templates');
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
                return;
            }
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }, [
        form,
        isEdit,
        loadingPlaybook,
        needsReview,
        params.id,
        selectedPlaybook,
        variableValues,
        variables,
    ]);

    return (
        <div className="template-form-page">
            <SubPageHeader
                title={isEdit ? '编辑任务模板' : '创建任务模板'}
                onBack={() => history.push('/execution/templates')}
                actions={(
                    <div className="template-form-actions">
                        <Button onClick={() => history.push('/execution/templates')}>取消</Button>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={submitting}
                            disabled={isEdit ? !access.canUpdateTask : !access.canCreateTask}
                        >
                            {isEdit ? '保存' : '创建'}
                        </Button>
                    </div>
                )}
            />

            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    requiredMark={false}
                    initialValues={{ executor_type: 'local' }}
                    size="large"
                >
                    <div className="template-form-cards">
                        <TemplateReviewAlert
                            visible={needsReview}
                            changedVariables={changedVariables}
                        />

                        <TemplateBasicInfoCard
                            form={form}
                            playbooks={playbooks}
                            onSelectPlaybook={handleSelectPlaybook}
                        />

                        <TemplateEnvironmentCard />

                        <div className="template-form-card">
                            <h4 className="template-form-section-title">
                                <KeyOutlined />凭据配置
                            </h4>

                            <Form.Item
                                name="secrets_source_ids"
                                label="密钥源"
                                extra="选择用于 SSH 连接的凭据，可选多个。执行时按顺序尝试匹配。"
                                tooltip="密钥源提供 SSH Key 或密码等认证信息"
                            >
                                <TemplateSecretsSourceField
                                    secretIds={selectedSecretIds}
                                    secretsSources={secretsSources}
                                    onOpen={() => setSecretsModalOpen(true)}
                                    onRemove={handleRemoveSecret}
                                />
                            </Form.Item>
                        </div>

                        <TemplateVariablesCard
                            filteredVariables={filteredVariables}
                            loadingPlaybook={loadingPlaybook}
                            selectedPlaybook={selectedPlaybook}
                            showOnlyRequired={showOnlyRequired}
                            varSearch={varSearch}
                            variableValues={variableValues}
                            variables={variables}
                            onShowOnlyRequiredChange={setShowOnlyRequired}
                            onVarSearchChange={setVarSearch}
                            onVariableChange={handleVariableChange}
                        />

                        <TemplateNotificationCard
                            notifyChannels={notifyChannels}
                            notifyTemplates={notifyTemplates}
                        />
                    </div>
                </Form>
            </Spin>

            <SecretsSourceSelector
                open={secretsModalOpen}
                sources={secretsSources}
                onConfirm={handleSecretsConfirm}
                onCancel={() => setSecretsModalOpen(false)}
            />
        </div>
    );
};

export default TemplateFormPage;
