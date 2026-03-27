import React, { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { getNotifications } from '@/services/auto-healing/notification';
import { getExecutionRun } from '@/services/auto-healing/execution';
import StandardTable from '@/components/StandardTable';
import { extractErrorMsg } from '@/utils/errorMsg';
import './index.css';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
} from '@/utils/selectorInventoryCache';
import ExecutionRunDetailDrawer from './ExecutionRunDetailDrawer';
import NotificationRecordDetailDrawer from './NotificationRecordDetailDrawer';
import {
    buildNotificationRecordsQuery,
    buildRecordAdvancedSearchFields,
    NotificationStatsBar,
    type NotificationRecord,
    type NotificationRecordsRequestParams,
    RECORDS_HEADER_ICON,
    RECORD_SEARCH_FIELDS,
} from './notificationRecordsConfig';
import { buildNotificationRecordColumns } from './notificationRecordColumns';

// ==================== Main Component ====================
const NotificationRecords: React.FC = () => {
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<NotificationRecord | null>(null);
    const [reloadKey, _setReloadKey] = useState(0);
    const [execDetailOpen, setExecDetailOpen] = useState(false);
    const [execDetail, setExecDetail] = useState<AutoHealing.ExecutionRun | null>(null);
    const [execLoading, setExecLoading] = useState(false);
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);

    useEffect(() => {
        Promise.allSettled([
            getCachedNotificationChannelInventory(),
            getCachedNotificationTemplateInventory(),
        ]).then((results) => {
            const [channelResult, templateResult] = results;
            if (channelResult.status === 'fulfilled') {
                setChannels(channelResult.value);
            } else {
                setChannels([]);
            }
            if (templateResult.status === 'fulfilled') {
                setTemplates(templateResult.value);
            } else {
                setTemplates([]);
            }
            if (channelResult.status === 'rejected' || templateResult.status === 'rejected') {
                message.error('加载通知筛选选项失败，请稍后重试');
            }
        });
    }, []);

    const handleViewDetail = useCallback((record: NotificationRecord) => {
        setCurrentRecord(record);
        setDetailOpen(true);
    }, []);

    const handleOpenExecution = useCallback(async (runId: string) => {
        setExecLoading(true);
        setExecDetailOpen(true);
        try {
            const response = await getExecutionRun(runId);
            setExecDetail(response.data);
        } catch (error: unknown) {
            setExecDetail(null);
            setExecDetailOpen(false);
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '加载执行详情失败，请稍后重试'));
        } finally {
            setExecLoading(false);
        }
    }, []);

    const columns = buildNotificationRecordColumns({
        channels,
        onOpenDetail: handleViewDetail,
        onOpenExecution: handleOpenExecution,
    });

    return (
        <>
            <StandardTable<NotificationRecord>
                key={reloadKey}
                tabs={[{ key: 'list', label: '发送记录' }]}
                title="通知记录"
                description="查看和管理所有通知发送记录"
                headerIcon={RECORDS_HEADER_ICON}
                headerExtra={<NotificationStatsBar refreshKey={reloadKey} />}
                columns={columns}
                rowKey="id"
                searchFields={RECORD_SEARCH_FIELDS}
                advancedSearchFields={buildRecordAdvancedSearchFields(channels, templates)}
                request={async (params: NotificationRecordsRequestParams) => {
                    const res = await getNotifications(buildNotificationRecordsQuery(params));
                    const data = res.data || [];
                    return {
                        data,
                        total: res.total || data.length,
                    };
                }}
                defaultPageSize={16}
                preferenceKey="notification_records"
                onRowClick={handleViewDetail}
            />

            <NotificationRecordDetailDrawer open={detailOpen} record={currentRecord} onClose={() => setDetailOpen(false)} />
            <ExecutionRunDetailDrawer execution={execDetail} loading={execLoading} open={execDetailOpen} onClose={() => { setExecDetailOpen(false); setExecDetail(null); }} />
        </>
    );
};

export default NotificationRecords;
