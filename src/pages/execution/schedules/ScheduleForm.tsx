import React from 'react';
import { Button, Checkbox, Form, Spin, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import ScheduleInfoCard from './ScheduleInfoCard';
import ScheduleOverridesCard from './ScheduleOverridesCard';
import ScheduleSelectedTemplateCard from './ScheduleSelectedTemplateCard';
import ScheduleTemplateSelection from './ScheduleTemplateSelection';
import ScheduleVariableOverridesCard from './ScheduleVariableOverridesCard';
import { useScheduleFormController } from './useScheduleFormController';
import '../templates/TemplateForm.css';
import '@/components/StandardTable/index.css';
import './schedule.css';

const { Text } = Typography;

const ScheduleForm: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const controller = useScheduleFormController({
        form,
        isEdit,
        scheduleId: params.id,
    });

    if (controller.loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" tip="加载中..."><div /></Spin>
            </div>
        );
    }

    if (controller.step === 'select') {
        return (
            <div className="template-form-page">
                <SubPageHeader
                    title="创建定时调度"
                    titleExtra={<span style={{ color: '#8c8c8c', fontSize: 13 }}>第 1 步：选择任务模板</span>}
                    onBack={() => history.push('/execution/schedules')}
                />
                <ScheduleTemplateSelection
                    currentPage={controller.currentPage}
                    filteredTemplates={controller.filteredTemplates}
                    filterExecutor={controller.filterExecutor}
                    filterNotification={controller.filterNotification}
                    onlyReady={controller.onlyReady}
                    pageSize={controller.pageSize}
                    paginatedTemplates={controller.paginatedTemplates}
                    searchText={controller.searchText}
                    onFilterExecutorChange={(value) => {
                        controller.setFilterExecutor(value);
                        controller.setCurrentPage(1);
                    }}
                    onFilterNotificationChange={(value) => {
                        controller.setFilterNotification(value);
                        controller.setCurrentPage(1);
                    }}
                    onOnlyReadyChange={(checked) => {
                        controller.setOnlyReady(checked);
                        controller.setCurrentPage(1);
                    }}
                    onPageChange={(page, size) => {
                        controller.setCurrentPage(page);
                        if (size !== controller.pageSize) {
                            controller.setPageSize(size);
                        }
                    }}
                    onSearchTextChange={(value) => {
                        controller.setSearchText(value);
                        controller.setCurrentPage(1);
                    }}
                    onSelectTemplate={controller.handleSelectTemplate}
                />
            </div>
        );
    }

    return (
        <div className="template-form-page">
            <SubPageHeader
                title={isEdit ? '编辑定时调度' : '创建定时调度'}
                titleExtra={(
                    <span style={{ color: '#8c8c8c', fontSize: 13 }}>
                        {isEdit ? `编辑 #${controller.editingSchedule?.id?.slice(0, 8).toUpperCase()}` : '第 2 步：配置调度参数'}
                    </span>
                )}
                onBack={() => {
                    if (isEdit) {
                        history.push('/execution/schedules');
                        return;
                    }
                    controller.resetCreateScheduleState();
                    controller.setStep('select');
                }}
                actions={(
                    <div className="template-form-actions">
                        <Button
                            onClick={() => {
                                if (isEdit) {
                                    history.push('/execution/schedules');
                                    return;
                                }
                                controller.resetCreateScheduleState();
                                controller.setStep('select');
                            }}
                        >
                            取消
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => void controller.handleSubmit()}
                            loading={controller.submitting}
                            disabled={isEdit ? !access.canUpdateTask : !access.canCreateTask}
                        >
                            {isEdit ? '保存配置' : '创建调度'}
                        </Button>
                    </div>
                )}
            />

            <Form form={form} layout="vertical" requiredMark={false} size="large">
                <div className="template-form-cards">
                    <ScheduleInfoCard />
                    {controller.selectedTemplate && <ScheduleSelectedTemplateCard selectedTemplate={controller.selectedTemplate} />}
                    <ScheduleOverridesCard
                        secretsSourceIds={controller.secretsSourceIds}
                        secretsSources={controller.secretsSources}
                        targetHostsOverride={controller.targetHostsOverride}
                        onSecretsSourceIdsChange={controller.setSecretsSourceIds}
                        onTargetHostsOverrideChange={controller.setTargetHostsOverride}
                    />
                    <ScheduleVariableOverridesCard
                        displayValues={controller.effectiveVariableValues}
                        loadingPlaybook={controller.loadingPlaybook}
                        overrideValues={controller.variableValues}
                        templatePlaybook={controller.templatePlaybook}
                        onVariableClear={controller.handleVariableClear}
                        onVariableChange={controller.handleVariableChange}
                    />
                    <div className="template-form-card">
                        <h4 className="template-form-section-title">
                            <BellOutlined />通知配置
                        </h4>
                        <NotificationConfigDisplay
                            value={controller.selectedTemplate?.notification_config}
                            channels={controller.channels}
                            templates={controller.notifyTemplates}
                            compact
                        />
                        {controller.hasNotificationConfig && (
                            <div style={{ marginTop: 12 }}>
                                <Checkbox checked={controller.skipNotification} onChange={(event) => controller.setSkipNotification(event.target.checked)}>
                                    <Text type="secondary">调度执行时跳过通知</Text>
                                </Checkbox>
                            </div>
                        )}
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default ScheduleForm;
