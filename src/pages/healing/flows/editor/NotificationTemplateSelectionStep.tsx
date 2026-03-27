import React from 'react';
import { FileTextOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Pagination, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import { PAGE_SIZE, getChannelTypeConfig, type ChannelInfo, type TemplateInfo } from './notificationChannelTemplateSelectorShared';

const { Text, Paragraph } = Typography;

const STEP_CONTAINER_STYLE: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: 480,
};

const SELECTED_CHANNEL_STYLE: React.CSSProperties = {
    padding: 12,
    background: '#f5f5f5',
    borderRadius: 4,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
};

const SEARCH_ROW_STYLE: React.CSSProperties = {
    paddingBottom: 12,
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

interface NotificationTemplateSelectionStepProps {
    currentPage: number;
    loading: boolean;
    selectedChannel: ChannelInfo | null;
    templateSearch: string;
    templates: TemplateInfo[];
    total: number;
    onBack: () => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    onSelectTemplate: (templateId: string) => void;
    onTemplateSearchChange: (value: string) => void;
}

interface SelectedChannelSummaryProps {
    channel: ChannelInfo | null;
    onBack: () => void;
}

const SelectedChannelSummary: React.FC<SelectedChannelSummaryProps> = ({ channel, onBack }) => {
    const typeConfig = getChannelTypeConfig(channel?.type || '');

    return (
        <div style={SELECTED_CHANNEL_STYLE}>
            <Space>
                <span
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        background: `${typeConfig.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: typeConfig.color,
                        fontSize: 16,
                    }}
                >
                    {typeConfig.icon}
                </span>
                <div>
                    <Text strong>{channel?.name}</Text>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        已选渠道 · {typeConfig.labelCN}
                    </div>
                </div>
            </Space>
            <Button size="small" onClick={onBack}>
                更换渠道
            </Button>
        </div>
    );
};

interface TemplateListItemProps {
    template: TemplateInfo;
    onSelect: (templateId: string) => void;
}

const TemplateListItem: React.FC<TemplateListItemProps> = ({ template, onSelect }) => (
    <div
        onClick={() => onSelect(template.id)}
        style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f5f5f5',
            cursor: 'pointer',
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
                    background: '#e6f7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff',
                    fontSize: 16,
                }}
            >
                <FileTextOutlined />
            </span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{template.name}</div>
                {template.description && (
                    <Paragraph
                        ellipsis={{ rows: 1 }}
                        style={{ fontSize: 12, color: '#8c8c8c', margin: 0, marginTop: 2 }}
                    >
                        {template.description}
                    </Paragraph>
                )}
                {template.supported_channels && template.supported_channels.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                        {template.supported_channels.map(channelType => (
                            <Tag
                                key={channelType}
                                style={{ fontSize: 10, lineHeight: '14px', margin: '0 4px 0 0', padding: '0 4px' }}
                            >
                                {getChannelTypeConfig(channelType).labelCN}
                            </Tag>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
);

const NotificationTemplateSelectionStep: React.FC<NotificationTemplateSelectionStepProps> = ({
    currentPage,
    loading,
    selectedChannel,
    templateSearch,
    templates,
    total,
    onBack,
    onPageChange,
    onRefresh,
    onSelectTemplate,
    onTemplateSearchChange,
}) => {
    const typeConfig = getChannelTypeConfig(selectedChannel?.type || '');

    return (
        <div style={STEP_CONTAINER_STYLE}>
            <SelectedChannelSummary channel={selectedChannel} onBack={onBack} />
            <div style={SEARCH_ROW_STYLE}>
                <Input
                    placeholder="搜索模板名称或描述..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={templateSearch}
                    onChange={event => onTemplateSearchChange(event.target.value)}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Tooltip title="刷新模板列表">
                    <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading} />
                </Tooltip>
            </div>
            <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    显示支持 {typeConfig.labelCN} 类型的模板
                </Text>
            </div>
            <div style={LIST_CONTAINER_STYLE}>
                <Spin spinning={loading}>
                    {templates.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配模板" style={{ padding: 40 }} />
                    ) : (
                        templates.map(template => (
                            <TemplateListItem
                                key={template.id}
                                template={template}
                                onSelect={onSelectTemplate}
                            />
                        ))
                    )}
                </Spin>
            </div>
            {total > PAGE_SIZE && (
                <div style={PAGINATION_ROW_STYLE}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        共 {total} 个模板
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
};

export default NotificationTemplateSelectionStep;
