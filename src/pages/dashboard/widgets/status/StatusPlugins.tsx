import { ApiOutlined } from '@ant-design/icons';
import { Badge, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import { PLUGIN_STATUS_MAP } from '@/constants/pluginDicts';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

const StatusPlugins: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('plugins');
    // 后端 dashboard overview 返回 plugin_overview 字段包含所有插件列表
    const items = data?.plugin_overview ?? data?.plugins_list ?? [];

    const columns = [
        {
            title: '插件', dataIndex: 'name', key: 'name', width: 150, ellipsis: true,
            render: (name: string) => <Typography.Text strong style={{ fontSize: 12 }}>{name}</Typography.Text>,
        },
        {
            title: '类型', dataIndex: 'type', key: 'type', width: 80,
            render: (type: string) => <Tag style={{ fontSize: 11 }}>{type?.toUpperCase()}</Tag>,
        },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 80,
            render: (status: string) => {
                const st = PLUGIN_STATUS_MAP[status] || { color: 'default', text: status };
                return <Badge status={st.color as any} text={<span style={{ fontSize: 12 }}>{st.text}</span>} />;
            },
        },
        {
            title: '更新时间', dataIndex: 'last_sync_at', key: 'last_sync_at', width: 120,
            render: (t: string) => <span style={{ fontSize: 11, color: '#8c8c8c' }}>{t ? dayjs(t).format('MM-DD HH:mm') : '-'}</span>,
        },
    ];

    return (
        <WidgetWrapper title="插件状态一览" icon={<ApiOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            <Table
                size="small"
                dataSource={Array.isArray(items) ? items : []}
                columns={columns}
                pagination={false}
                rowKey="id"
                scroll={{ y: 200 }}
                style={{ fontSize: 12 }}
            />
        </WidgetWrapper>
    );
};
export default StatusPlugins;
