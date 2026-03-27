import { PlusOutlined, FieldTimeOutlined } from '@ant-design/icons';
import {
    Button, message, Space, Card, Spin, Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import React, { useState, useMemo, useCallback } from 'react';
import { history, useAccess } from '@umijs/max';
import {
    getExecutionSchedule, deleteExecutionSchedule,
    enableExecutionSchedule, disableExecutionSchedule, updateExecutionSchedule,
} from '@/services/auto-healing/execution';
import StandardTable from '@/components/StandardTable';
import ScheduleTimeline from './components/ScheduleTimeline';
import { createRequestSequence } from '@/utils/requestSequence';
import ScheduleDetailDrawer from './ScheduleDetailDrawer';
import ScheduleEnableOnceModal from './ScheduleEnableOnceModal';
import { buildScheduleColumns } from './scheduleTableColumns';
import {
    advancedSearchFields,
    headerIcon,
    renderScheduleStatsBar,
    searchFields,
} from './schedulePageHelpers';
import { useScheduleOverviewData } from './useScheduleOverviewData';
import { useScheduleTableRequest } from './useScheduleTableRequest';

import './schedule.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const ExecutionSchedulePage: React.FC = () => {
    const access = useAccess();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const {
        allSchedules,
        channels,
        loadAllData,
        notifyTemplates,
        secretsSources,
        stats,
        templateMap,
        vizLoading,
    } = useScheduleOverviewData(refreshTrigger);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<AutoHealing.ExecutionSchedule | null>(null);
    const detailRequestSequenceRef = React.useRef(createRequestSequence());
    const [enableOnceModal, setEnableOnceModal] = useState<{
        visible: boolean;
        schedule: AutoHealing.ExecutionSchedule | null;
        newScheduledAt: dayjs.Dayjs | null;
    }>({ visible: false, schedule: null, newScheduledAt: null });
    const { tableRequest } = useScheduleTableRequest(() => {
        void loadAllData();
    });

    const openScheduleDetail = useCallback(async (schedule: AutoHealing.ExecutionSchedule) => {
        const token = detailRequestSequenceRef.current.next();
        setSelectedSchedule(schedule);
        setDrawerVisible(true);
        try {
            const detail = await getExecutionSchedule(schedule.id);
            if (!detailRequestSequenceRef.current.isCurrent(token)) return;
            setSelectedSchedule(detail);
        } catch {
            // keep lightweight payload as fallback
        }
    }, []);

    const refreshSelectedScheduleDetail = useCallback(async (scheduleId: string) => {
        const token = detailRequestSequenceRef.current.next();
        try {
            const detail = await getExecutionSchedule(scheduleId);
            if (!detailRequestSequenceRef.current.isCurrent(token)) {
                return;
            }
            setSelectedSchedule(detail);
        } catch {
            /* ignore detail refresh failure */
        }
    }, []);

    const handleToggle = async (schedule: AutoHealing.ExecutionSchedule, enabled: boolean) => {
        if (enabled && schedule.schedule_type === 'once') {
            setEnableOnceModal({ visible: true, schedule, newScheduledAt: null });
            return;
        }
        setActionLoading(schedule.id);
        try {
            if (selectedSchedule?.id === schedule.id) {
                detailRequestSequenceRef.current.invalidate();
            }
            if (enabled) {
                await enableExecutionSchedule(schedule.id);
                message.success('调度已启用');
            } else {
                await disableExecutionSchedule(schedule.id);
                message.success('调度已暂停');
            }
            if (selectedSchedule?.id === schedule.id) {
                await refreshSelectedScheduleDetail(schedule.id);
            }
            setRefreshTrigger(t => t + 1);
        } catch {
            message.error(enabled ? '启用失败' : '暂停失败');
        }
        setActionLoading(null);
    };

    const handleEnableOnce = async () => {
        if (!enableOnceModal.schedule || !enableOnceModal.newScheduledAt) {
            message.warning('请选择新的执行时间');
            return;
        }
        setActionLoading(enableOnceModal.schedule.id);
        try {
            if (selectedSchedule?.id === enableOnceModal.schedule.id) {
                detailRequestSequenceRef.current.invalidate();
            }
            const detail = await getExecutionSchedule(enableOnceModal.schedule.id);
            const requestData: AutoHealing.UpdateExecutionScheduleRequest = {
                name: detail.name,
                schedule_type: detail.schedule_type,
                schedule_expr: detail.schedule_expr || undefined,
                scheduled_at: dayjs.isDayjs(enableOnceModal.newScheduledAt)
                    ? enableOnceModal.newScheduledAt.format()
                    : enableOnceModal.newScheduledAt,
                description: detail.description,
                max_failures: detail.max_failures,
                target_hosts_override: detail.target_hosts_override,
                extra_vars_override: detail.extra_vars_override,
                secrets_source_ids: detail.secrets_source_ids,
                skip_notification: detail.skip_notification,
            };
            await updateExecutionSchedule(enableOnceModal.schedule.id, requestData);
            await enableExecutionSchedule(enableOnceModal.schedule.id);
            if (selectedSchedule?.id === enableOnceModal.schedule.id) {
                await refreshSelectedScheduleDetail(enableOnceModal.schedule.id);
            }
            message.success('调度已启用');
            setEnableOnceModal({ visible: false, schedule: null, newScheduledAt: null });
            setRefreshTrigger(t => t + 1);
        } catch {
            /* global error handler */
        }
        setActionLoading(null);
    };

    const handleDelete = async (schedule: AutoHealing.ExecutionSchedule) => {
        setActionLoading(schedule.id);
        try {
            await deleteExecutionSchedule(schedule.id);
            message.success('调度已删除');
            setRefreshTrigger(t => t + 1);
        } catch {
            /* global error handler */
        }
        setActionLoading(null);
    };
    const columns = useMemo(
        () => buildScheduleColumns({
            access,
            actionLoading,
            templateMap,
            onDelete: handleDelete,
            onOpenDetail: openScheduleDetail,
            onToggle: handleToggle,
        }),
        [access, actionLoading, handleDelete, handleToggle, openScheduleDetail, templateMap],
    );

    const vizSection = useMemo(() => (
        <div className="schedule-viz-section">
            <Card
                size="small"
                title={
                    <Space>
                        <FieldTimeOutlined style={{ color: '#722ed1' }} />
                        <span>今日时间轴</span>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                            {dayjs().format('YYYY年M月D日 dddd')}
                        </Text>
                    </Space>
                }
                className="schedule-viz-card"
            >
                {vizLoading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}><Spin size="small" /></div>
                ) : (
                    <ScheduleTimeline
                        schedules={allSchedules}
                        templateMap={templateMap}
                        onScheduleClick={openScheduleDetail}
                    />
                )}
            </Card>

        </div>
    ), [vizLoading, allSchedules, templateMap]);
    const statsBar = useMemo(() => renderScheduleStatsBar(stats), [stats]);

    return (
        <>
            <StandardTable<AutoHealing.ExecutionSchedule>
                tabs={[{ key: 'list', label: '调度列表' }]}
                title="定时调度"
                description="管理定时调度任务，配置执行频率和时间窗口。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                afterHeader={vizSection}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                request={tableRequest}
                defaultPageSize={15}
                preferenceKey="execution_schedules"
                refreshTrigger={refreshTrigger}
                primaryActionLabel="创建调度"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateTask}
                onPrimaryAction={() => history.push('/execution/schedules/create')}
                onRowClick={openScheduleDetail}
            />

            <ScheduleDetailDrawer
                access={access}
                actionLoading={actionLoading}
                channels={channels}
                notifyTemplates={notifyTemplates}
                open={drawerVisible}
                secretsSources={secretsSources}
                selectedSchedule={selectedSchedule}
                templateMap={templateMap}
                onClose={() => {
                    detailRequestSequenceRef.current.invalidate();
                    setDrawerVisible(false);
                    setSelectedSchedule(null);
                }}
                onToggle={handleToggle}
            />
            <ScheduleEnableOnceModal
                confirmLoading={actionLoading === enableOnceModal.schedule?.id}
                state={enableOnceModal}
                onConfirm={handleEnableOnce}
                onScheduledAtChange={(value) => setEnableOnceModal((prev) => ({ ...prev, newScheduledAt: value }))}
                onClose={() => setEnableOnceModal({ visible: false, schedule: null, newScheduledAt: null })}
            />
        </>
    );
};

export default ExecutionSchedulePage;
