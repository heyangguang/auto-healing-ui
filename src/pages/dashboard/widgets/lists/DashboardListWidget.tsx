/**
 * 通用 Dashboard 列表组件
 * 用于展示来自 Dashboard section 的列表数据
 */
import { UnorderedListOutlined } from '@ant-design/icons';
import { Badge, Empty, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';

interface ColumnDef {
    key: string;
    label?: string;
    render?: (val: any, record: any) => React.ReactNode;
}

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardListWidgetProps extends Partial<WidgetComponentProps> {
    section: string;
    field: string;
    title: string;
    icon?: React.ReactNode;
    columns?: ColumnDef[];
    onItemClick?: (item: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
    success: 'success', completed: 'success', active: 'success', healed: 'success', sent: 'success', delivered: 'success', ready: 'success', synced: 'success',
    running: 'processing', processing: 'processing',
    pending: 'warning', pending_trigger: 'warning',
    failed: 'error', error: 'error', timeout: 'error', rejected: 'error',
    cancelled: 'default', skipped: 'default', inactive: 'default', offline: 'default', disabled: 'default', maintenance: 'warning',
};

const DashboardListWidget: React.FC<DashboardListWidgetProps> = ({ section, field, title, icon, columns, onItemClick, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const items: any[] = data?.[field] ?? [];

    return (
        <WidgetWrapper title={title} icon={icon || <UnorderedListOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <div style={{ height: '100%', overflowY: 'auto', display: items.length === 0 ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center' }}>
                {items.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                ) : (
                    items.map((item: any, index: number) => {
                        const displayTitle = item.title || item.name || item.username || item.subject || item.playbook_name || item.plugin_name || item.repo_name || item.flow_name || item.task_name || item.cmdb_item_name || item.display_name || item.id?.slice?.(0, 8) || '-';
                        const statusVal = item.status || item.severity || '';
                        const badgeStatus = STATUS_COLORS[statusVal] || 'default';
                        const timeVal = item.created_at || item.started_at || item.last_login_at || item.last_sync_at;
                        return (
                            <div
                                key={item.id || index}
                                style={{ padding: '6px 12px', cursor: onItemClick ? 'pointer' : 'default', borderBottom: '1px solid #f0f0f0' }}
                                onClick={() => onItemClick?.(item)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                    <Badge status={badgeStatus as any} />
                                    <Typography.Text ellipsis style={{ flex: 1, fontSize: 12 }}>
                                        {displayTitle}
                                    </Typography.Text>
                                    {statusVal && (
                                        <Tag color={badgeStatus === 'error' ? 'red' : badgeStatus === 'success' ? 'green' : badgeStatus === 'warning' ? 'orange' : badgeStatus === 'processing' ? 'blue' : 'default'} style={{ margin: 0, fontSize: 11 }}>
                                            {statusVal}
                                        </Tag>
                                    )}
                                    {timeVal && (
                                        <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                            {dayjs(timeVal).format('MM-DD HH:mm')}
                                        </Typography.Text>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardListWidget;
