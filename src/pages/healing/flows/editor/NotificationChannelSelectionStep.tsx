import React from 'react';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, Input, Pagination, Space, Spin, Tabs, Tag, Tooltip, Typography } from 'antd';
import { PAGE_SIZE, getChannelTypeConfig, type ChannelInfo } from './notificationChannelTemplateSelectorShared';

const { Text } = Typography;

const STEP_CONTAINER_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: 480,
};

const TABS_CONTAINER_STYLE: React.CSSProperties = {
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 8,
};

const SEARCH_ROW_STYLE: React.CSSProperties = {
    padding: '12px 0',
    display: 'flex',
    gap: 8,
};

const LIST_CONTAINER_STYLE: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    border: '1px solid #f0f0f0',
    borderRadius: 4,
};

const PAGINATION_ROW_STYLE: React.CSSProperties = {
    padding: '12px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};

interface NotificationChannelSelectionStepProps {
    channelTypeFilter: string;
    channelTypeStats: Record<string, number>;
    channelSearch: string;
    channels: ChannelInfo[];
    currentPage: number;
    loading: boolean;
    total: number;
    onChannelSearchChange: (value: string) => void;
    onChannelTypeChange: (value: string) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    onSelectChannel: (channel: ChannelInfo) => void;
}

interface ChannelTypeTabsProps {
    activeKey: string;
    channelTypeStats: Record<string, number>;
    onChange: (key: string) => void;
}

const ChannelTypeTabs: React.FC<ChannelTypeTabsProps> = ({ activeKey, channelTypeStats, onChange }) => {
    const types = Object.keys(channelTypeStats).filter(type => type !== 'all');
    const items = [
        {
            key: 'all',
            label: <span>全部 <Badge count={channelTypeStats.all} style={{ backgroundColor: '#d9d9d9' }} /></span>,
        },
        ...types.map(type => {
            const config = getChannelTypeConfig(type);
            return {
                key: type,
                label: (
                    <Space size={4}>
                        <span style={{ color: config.color }}>{config.icon}</span>
                        <span>{config.labelCN}</span>
                        <Badge count={channelTypeStats[type]} style={{ backgroundColor: config.color }} />
                    </Space>
                ),
            };
        }),
    ];

    return <Tabs activeKey={activeKey} items={items} onChange={onChange} size="small" style={{ marginBottom: 0 }} />;
};

interface ChannelListItemProps {
    channel: ChannelInfo;
    onSelect: (channel: ChannelInfo) => void;
}

const ChannelListItem: React.FC<ChannelListItemProps> = ({ channel, onSelect }) => {
    const typeConfig = getChannelTypeConfig(channel.type);

    return (
        <div
            onClick={() => onSelect(channel)}
            style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f5f5f5',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#fff',
                transition: 'all 0.2s',
            }}
            onMouseEnter={event => {
                event.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseLeave={event => {
                event.currentTarget.style.background = '#fff';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 4,
                        background: `${typeConfig.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: typeConfig.color,
                        fontSize: 18,
                    }}
                >
                    {typeConfig.icon}
                </span>
                <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{channel.name}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        ID: {channel.id.slice(0, 8)}...
                    </div>
                </div>
            </div>
            <Tag color={typeConfig.color} style={{ margin: 0 }}>{typeConfig.labelCN}</Tag>
        </div>
    );
};

const NotificationChannelSelectionStep: React.FC<NotificationChannelSelectionStepProps> = ({
    channelTypeFilter,
    channelTypeStats,
    channelSearch,
    channels,
    currentPage,
    loading,
    total,
    onChannelSearchChange,
    onChannelTypeChange,
    onPageChange,
    onRefresh,
    onSelectChannel,
}) => (
    <div style={STEP_CONTAINER_STYLE}>
        <div style={TABS_CONTAINER_STYLE}>
            <ChannelTypeTabs
                activeKey={channelTypeFilter}
                channelTypeStats={channelTypeStats}
                onChange={onChannelTypeChange}
            />
        </div>
        <div style={SEARCH_ROW_STYLE}>
            <Input
                placeholder="搜索渠道名称或类型..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={channelSearch}
                onChange={event => onChannelSearchChange(event.target.value)}
                allowClear
                style={{ flex: 1 }}
            />
            <Tooltip title="刷新列表">
                <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} />
            </Tooltip>
        </div>
        <div style={LIST_CONTAINER_STYLE}>
            <Spin spinning={loading}>
                {channels.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配渠道" style={{ padding: 40 }} />
                ) : (
                    channels.map(channel => (
                        <ChannelListItem key={channel.id} channel={channel} onSelect={onSelectChannel} />
                    ))
                )}
            </Spin>
        </div>
        {total > PAGE_SIZE && (
            <div style={PAGINATION_ROW_STYLE}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {total} 个渠道
                </Text>
                <Pagination
                    size="small"
                    current={currentPage}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={onPageChange}
                    showSizeChanger={false}
                />
            </div>
        )}
    </div>
);

export default NotificationChannelSelectionStep;
