import React from 'react';
import { Empty, Input, Tabs, Tag, Typography } from 'antd';
import { SearchOutlined, SendOutlined } from '@ant-design/icons';
import type { ChannelOption, TemplateOption } from './types';

const { Text } = Typography;

interface SelectorModalContentProps {
    step: 'channel' | 'template';
    channels: ChannelOption[];
    channelTypes: string[];
    activeTab: string;
    searchText: string;
    filteredChannels: ChannelOption[];
    selectedChannel: string | null;
    filteredTemplates: TemplateOption[];
    getChannelName: (id: string) => string;
    getChannelType: (id: string) => string;
    onTabChange: (key: string) => void;
    onSearchChange: (value: string) => void;
    onSelectChannel: (channelId: string) => void;
    onSelectTemplate: (templateId: string) => void;
}

const SelectorModalContent: React.FC<SelectorModalContentProps> = ({
    step,
    channels,
    channelTypes,
    activeTab,
    searchText,
    filteredChannels,
    selectedChannel,
    filteredTemplates,
    getChannelName,
    getChannelType,
    onTabChange,
    onSearchChange,
    onSelectChannel,
    onSelectTemplate,
}) => {
    if (step === 'channel') {
        const tabItems = [
            { key: 'all', label: `全部 (${channels.length})` },
            ...channelTypes.map((type) => ({
                key: type,
                label: `${type} (${channels.filter((c) => c.type === type).length})`,
            })),
        ];

        return (
            <>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => { onTabChange(key); onSearchChange(''); }}
                    size="small"
                    style={{ marginBottom: 12 }}
                    items={tabItems}
                />
                <Input
                    placeholder="搜索通知渠道..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ marginBottom: 12 }}
                    allowClear
                />
                <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                    {filteredChannels.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配渠道" />
                    ) : (
                        filteredChannels.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => onSelectChannel(c.id)}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f0f0f0',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#fff',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <SendOutlined style={{ marginRight: 10, color: '#1890ff', fontSize: 16 }} />
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                            {c.type}
                                        </div>
                                    </div>
                                </div>
                                <Tag style={{ margin: 0 }}>{c.type}</Tag>
                            </div>
                        ))
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    已选渠道：<Text strong>{getChannelName(selectedChannel || '')}</Text>
                    <Tag style={{ marginLeft: 8, fontSize: 10 }}>{getChannelType(selectedChannel || '')}</Tag>
                </Text>
            </div>
            <Input
                placeholder="搜索消息模板..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ marginBottom: 16 }}
                allowClear
            />
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                {filteredTemplates.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配模板" />
                ) : (
                    filteredTemplates.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onSelectTemplate(t.id)}
                            style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f0f0f0',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#fff',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                        >
                            <div>
                                <div style={{ fontWeight: 500 }}>{t.name}</div>
                                {t.supported_channels?.length ? (
                                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                                        支持: {t.supported_channels.join(', ')}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

export default SelectorModalContent;
