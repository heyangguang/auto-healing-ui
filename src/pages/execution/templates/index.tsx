import { AlertOutlined, PlusOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { Badge, Button, message, Tooltip } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import StandardTable from '@/components/StandardTable';
import {
    confirmExecutionTaskReview,
    deleteExecutionTask,
    getExecutionTasks,
} from '@/services/auto-healing/execution';
import {
    invalidateSelectorInventory,
    selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';
import TemplateBatchReviewModal from './TemplateBatchReviewModal';
import TemplateDetailDrawer from './TemplateDetailDrawer';
import TemplateStatsBar from './TemplateStatsBar';
import {
    buildTemplateQueryParams,
    ExecutionTaskRecord,
    templateAdvancedSearchFields,
    templateSearchFields,
    type TemplateRequestParams,
} from './templateListHelpers';
import { createTemplateColumns } from './templateTableColumns';
import { useTemplateBatchReview } from './useTemplateBatchReview';
import { useTemplateReferenceData } from './useTemplateReferenceData';
import './index.css';

const EMPTY_TEMPLATE_RESULT = { data: [], total: 0 };

const ExecutionTemplateList: React.FC = () => {
    const access = useAccess();
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<ExecutionTaskRecord>();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const tableRequestSequenceRef = useRef(createRequestSequence());
    const latestTableResultRef = useRef<{ data: ExecutionTaskRecord[]; total: number }>(EMPTY_TEMPLATE_RESULT);
    const pendingTableRequestRef = useRef<Promise<{ data: ExecutionTaskRecord[]; total: number }> | null>(null);
    const {
        notifyChannels,
        notifyTemplates,
        playbooks,
        secretsSources,
        stats,
        loadReferenceData,
    } = useTemplateReferenceData(refreshTrigger);

    const bumpRefreshTrigger = useCallback(() => {
        setRefreshTrigger((value) => value + 1);
    }, []);

    const handleConfirmReview = useCallback(async (id: string) => {
        try {
            await confirmExecutionTaskReview(id);
            invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
            message.success('已确认变更');
            setDetailOpen(false);
            bumpRefreshTrigger();
        } catch (error) {
            console.error(error);
            message.error('确认变更失败');
            throw error;
        }
    }, [bumpRefreshTrigger]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteExecutionTask(id);
            invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
            message.success('已删除');
            bumpRefreshTrigger();
        } catch {
            /* ignore */
        }
    }, [bumpRefreshTrigger]);

    const {
        batchReviewLoading,
        batchReviewOpen,
        handleBatchReview,
        openBatchReview,
        reviewGroups,
        selectedPlaybooks,
        setBatchReviewOpen,
        setSelectedPlaybooks,
    } = useTemplateBatchReview({
        playbooks,
        onRefresh: bumpRefreshTrigger,
    });

    const columns = useMemo(() => createTemplateColumns({
        access: {
            canDeleteTask: access.canDeleteTask,
            canExecuteTask: access.canExecuteTask,
            canUpdateTask: access.canUpdateTask,
        },
        onDelete: handleDelete,
        onOpenDetail: (record) => {
            setCurrentTemplate(record);
            setDetailOpen(true);
        },
        playbooks,
    }), [access.canDeleteTask, access.canExecuteTask, access.canUpdateTask, handleDelete, playbooks]);

    const handleRequest = useCallback(async (params: TemplateRequestParams) => {
        const token = tableRequestSequenceRef.current.next();
        const currentRequest = (async () => {
            void loadReferenceData();
            const response = await getExecutionTasks(buildTemplateQueryParams(params));
            const tasks = response.data || [];
            const total = response.total || tasks.length;
            const result = { data: tasks, total };
            if (tableRequestSequenceRef.current.isCurrent(token)) {
                latestTableResultRef.current = result;
            }
            return result;
        })();

        pendingTableRequestRef.current = currentRequest;
        const result = await currentRequest;
        if (tableRequestSequenceRef.current.isCurrent(token)) {
            return result;
        }
        if (pendingTableRequestRef.current && pendingTableRequestRef.current !== currentRequest) {
            return pendingTableRequestRef.current;
        }
        return latestTableResultRef.current;
    }, [loadReferenceData]);

    return (
        <>
            <StandardTable<ExecutionTaskRecord>
                tabs={[{ key: 'list', label: '模板列表' }]}
                title="任务模板"
                description="管理可复用的自动化任务蓝图，配置 Playbook、执行环境和变量参数。"
                headerIcon={<PlusOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                headerExtra={<TemplateStatsBar stats={stats} />}
                searchFields={templateSearchFields}
                advancedSearchFields={templateAdvancedSearchFields}
                columns={columns}
                rowKey="id"
                request={handleRequest}
                defaultPageSize={16}
                preferenceKey="execution_templates"
                refreshTrigger={refreshTrigger}
                primaryActionLabel="创建任务模板"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateTask}
                onPrimaryAction={() => history.push('/execution/templates/create')}
                extraToolbarActions={stats.needsReview > 0 ? (
                    <Tooltip title={`${stats.needsReview} 个模板待审核，点击批量确认`}>
                        <Badge dot offset={[-4, 4]}>
                            <Button icon={<AlertOutlined />} onClick={openBatchReview} disabled={!access.canUpdateTask} />
                        </Badge>
                    </Tooltip>
                ) : undefined}
                onRowClick={(record) => {
                    setCurrentTemplate(record);
                    setDetailOpen(true);
                }}
            />

            <TemplateDetailDrawer
                open={detailOpen}
                template={currentTemplate}
                onClose={() => {
                    setDetailOpen(false);
                    setCurrentTemplate(undefined);
                }}
                secretsSources={secretsSources}
                notifyChannels={notifyChannels}
                notifyTemplates={notifyTemplates}
                onConfirmReview={handleConfirmReview}
                canConfirmReview={access.canUpdateTask}
            />

            <TemplateBatchReviewModal
                confirmLoading={batchReviewLoading}
                open={batchReviewOpen}
                reviewGroups={reviewGroups}
                selectedPlaybooks={selectedPlaybooks}
                onCancel={() => setBatchReviewOpen(false)}
                onConfirm={handleBatchReview}
                onSelectedPlaybooksChange={setSelectedPlaybooks}
            />
        </>
    );
};

export default ExecutionTemplateList;
