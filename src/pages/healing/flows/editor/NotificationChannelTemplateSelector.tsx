import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button, Modal, Tag, Typography, Space, Empty, Input, Tabs, message, Spin, Pagination, Tooltip, Badge } from 'antd';
import {
    PlusOutlined, BellOutlined, CloseOutlined, SendOutlined, SearchOutlined,
    MailOutlined, DingdingOutlined, ApiOutlined, ReloadOutlined, FileTextOutlined
} from '@ant-design/icons';
import { getChannels, getTemplates as getNotificationTemplates } from '@/services/auto-healing/notification';

const { Text, Paragraph } = Typography;

// 单个渠道+模板配置
interface ChannelTemplateConfig {
    channel_id: string;
    template_id: string;
}

interface ChannelInfo {
    id: string;
    name: string;
    type: string;
    enabled?: boolean;
}

interface TemplateInfo {
    id: string;
    name: string;
    supported_channels?: string[];
    description?: string;
}

interface NotificationChannelTemplateSelectorProps {
    value?: ChannelTemplateConfig[];
    onChange?: (value: ChannelTemplateConfig[]) => void;
}

// 渠道类型图标和颜色
const CHANNEL_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    email: { icon: <MailOutlined />, color: '#1890ff', label: '邮件' },
    dingtalk: { icon: <DingdingOutlined />, color: '#0089ff', label: '钉钉' },
    webhook: { icon: <ApiOutlined />, color: '#722ed1', label: 'Webhook' },
    default: { icon: <SendOutlined />, color: '#8c8c8c', label: '通知' },
};

const getChannelTypeConfig = (type: string) => {
    return CHANNEL_TYPE_CONFIG[type.toLowerCase()] || CHANNEL_TYPE_CONFIG.default;
};

// 每页显示数量
const PAGE_SIZE = 8;

/**
 * 通知渠道-模板选择器（专业版）
 * 
 * 功能：
 * 1. 分步选择：先选渠道 → 再选该渠道支持的模板
 * 2. 高级筛选：支持类型筛选、搜索、分页
 * 3. 专业布局：适配大量数据场景
 */
const NotificationChannelTemplateSelector: React.FC<NotificationChannelTemplateSelectorProps> = ({
    value = [],
    onChange
}) => {
    // 数据源
    const [channels, setChannels] = useState<ChannelInfo[]>([]);
    const [templates, setTemplates] = useState<TemplateInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    // 选择器状态
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [step, setStep] = useState<'channel' | 'template'>('channel');
    const [selectedChannel, setSelectedChannel] = useState<ChannelInfo | null>(null);

    // 筛选和分页 - 渠道
    const [channelSearch, setChannelSearch] = useState('');
    const [channelTypeFilter, setChannelTypeFilter] = useState('all');
    const [channelPage, setChannelPage] = useState(1);

    // 筛选和分页 - 模板
    const [templateSearch, setTemplateSearch] = useState('');
    const [templatePage, setTemplatePage] = useState(1);

    // 加载渠道数据
    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getChannels({ page_size: 200 });
            setChannels((res.data || []).map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                enabled: c.enabled
            })));
        } catch (e) {
            message.error('加载通知渠道失败');
        } finally {
            setLoading(false);
        }
    }, []);

    // 加载模板数据
    const loadTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const res = await getNotificationTemplates({ page_size: 200 });
            setTemplates((res.data || []).map(t => ({
                id: t.id,
                name: t.name,
                supported_channels: t.supported_channels,
                description: t.description
            })));
        } catch (e) {
            message.error('加载通知模板失败');
        } finally {
            setLoadingTemplates(false);
        }
    }, []);

    // 初始加载
    useEffect(() => {
        loadChannels();
        loadTemplates();
    }, [loadChannels, loadTemplates]);

    // 获取渠道信息
    const getChannel = (id: string) => channels.find(c => c.id === id);
    const getChannelName = (id: string) => getChannel(id)?.name || id.slice(0, 8);
    const getChannelType = (id: string) => getChannel(id)?.type || '';

    // 获取模板信息
    const getTemplate = (id: string) => templates.find(t => t.id === id);
    const getTemplateName = (id: string) => getTemplate(id)?.name || id.slice(0, 8);

    // 渠道类型统计
    const channelTypeStats = useMemo(() => {
        const stats: Record<string, number> = { all: channels.length };
        channels.forEach(c => {
            const type = c.type.toLowerCase();
            stats[type] = (stats[type] || 0) + 1;
        });
        return stats;
    }, [channels]);

    // 过滤渠道
    const filteredChannels = useMemo(() => {
        let list = channels;
        // 只显示启用的渠道
        list = list.filter(c => c.enabled !== false);
        // 按类型过滤
        if (channelTypeFilter !== 'all') {
            list = list.filter(c => c.type.toLowerCase() === channelTypeFilter);
        }
        // 按搜索词过滤
        if (channelSearch) {
            const searchLower = channelSearch.toLowerCase();
            list = list.filter(c =>
                c.name.toLowerCase().includes(searchLower) ||
                c.type.toLowerCase().includes(searchLower)
            );
        }
        return list;
    }, [channels, channelTypeFilter, channelSearch]);

    // 分页后的渠道
    const paginatedChannels = useMemo(() => {
        const start = (channelPage - 1) * PAGE_SIZE;
        return filteredChannels.slice(start, start + PAGE_SIZE);
    }, [filteredChannels, channelPage]);

    // 根据选中渠道过滤模板
    const filteredTemplates = useMemo(() => {
        if (!selectedChannel) return templates;
        const channelType = selectedChannel.type.toLowerCase();
        let filtered = templates.filter(t => {
            if (!t.supported_channels || t.supported_channels.length === 0) return true;
            return t.supported_channels.some(sc => sc.toLowerCase() === channelType);
        });
        if (templateSearch) {
            const searchLower = templateSearch.toLowerCase();
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower))
            );
        }
        return filtered;
    }, [selectedChannel, templates, templateSearch]);

    // 分页后的模板
    const paginatedTemplates = useMemo(() => {
        const start = (templatePage - 1) * PAGE_SIZE;
        return filteredTemplates.slice(start, start + PAGE_SIZE);
    }, [filteredTemplates, templatePage]);

    // 打开选择器
    const openSelector = () => {
        setStep('channel');
        setSelectedChannel(null);
        setChannelSearch('');
        setTemplateSearch('');
        setChannelTypeFilter('all');
        setChannelPage(1);
        setTemplatePage(1);
        setSelectorOpen(true);
    };

    // 选择渠道
    const handleSelectChannel = (channel: ChannelInfo) => {
        setSelectedChannel(channel);
        setTemplateSearch('');
        setTemplatePage(1);
        setStep('template');
    };

    // 选择模板并完成添加
    const handleSelectTemplate = (templateId: string) => {
        if (!selectedChannel) return;

        const newConfig: ChannelTemplateConfig = {
            channel_id: selectedChannel.id,
            template_id: templateId
        };

        // 检查是否已存在相同配置
        const exists = value.some(
            cfg => cfg.channel_id === newConfig.channel_id && cfg.template_id === newConfig.template_id
        );
        if (exists) {
            message.warning('该渠道-模板配置已存在');
            return;
        }

        onChange?.([...value, newConfig]);
        setSelectorOpen(false);
    };

    // 移除配置
    const handleRemoveConfig = (index: number) => {
        const newConfigs = value.filter((_, i) => i !== index);
        onChange?.(newConfigs);
    };

    // 渲染渠道类型标签
    const renderChannelTypeTabs = () => {
        const types = Object.keys(channelTypeStats).filter(t => t !== 'all');
        const tabItems = [
            { key: 'all', label: <span>全部 <Badge count={channelTypeStats.all} style={{ backgroundColor: '#d9d9d9' }} /></span> },
            ...types.map(type => {
                const config = getChannelTypeConfig(type);
                return {
                    key: type,
                    label: (
                        <Space size={4}>
                            <span style={{ color: config.color }}>{config.icon}</span>
                            <span>{config.label}</span>
                            <Badge count={channelTypeStats[type]} style={{ backgroundColor: config.color }} />
                        </Space>
                    )
                };
            })
        ];

        return (
            <Tabs
                activeKey={channelTypeFilter}
                onChange={key => {
                    setChannelTypeFilter(key);
                    setChannelPage(1);
                }}
                size="small"
                items={tabItems}
                style={{ marginBottom: 0 }}
            />
        );
    };

    // 渲染渠道选择内容
    const renderChannelContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
            {/* 类型筛选 */}
            <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                {renderChannelTypeTabs()}
            </div>

            {/* 搜索和刷新 */}
            <div style={{ padding: '12px 0', display: 'flex', gap: 8 }}>
                <Input
                    placeholder="搜索渠道名称或类型..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={channelSearch}
                    onChange={e => {
                        setChannelSearch(e.target.value);
                        setChannelPage(1);
                    }}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Tooltip title="刷新列表">
                    <Button icon={<ReloadOutlined />} onClick={loadChannels} loading={loading} />
                </Tooltip>
            </div>

            {/* 渠道列表 */}
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                <Spin spinning={loading}>
                    {paginatedChannels.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配渠道" style={{ padding: 40 }} />
                    ) : (
                        paginatedChannels.map(c => {
                            const typeConfig = getChannelTypeConfig(c.type);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => handleSelectChannel(c)}
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
                                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: 4,
                                            background: `${typeConfig.color}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: typeConfig.color,
                                            fontSize: 18
                                        }}>
                                            {typeConfig.icon}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                                            <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                                                ID: {c.id.slice(0, 8)}...
                                            </div>
                                        </div>
                                    </div>
                                    <Tag color={typeConfig.color} style={{ margin: 0 }}>{typeConfig.label}</Tag>
                                </div>
                            );
                        })
                    )}
                </Spin>
            </div>

            {/* 分页 */}
            {filteredChannels.length > PAGE_SIZE && (
                <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        共 {filteredChannels.length} 个渠道
                    </Text>
                    <Pagination
                        size="small"
                        current={channelPage}
                        pageSize={PAGE_SIZE}
                        total={filteredChannels.length}
                        onChange={setChannelPage}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );

    // 渲染模板选择内容
    const renderTemplateContent = () => (
        <div style={{ display: 'flex', flexDirection: 'column', height: 480 }}>
            {/* 已选渠道信息 */}
            <div style={{
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Space>
                    <span style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        background: `${getChannelTypeConfig(selectedChannel?.type || '').color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getChannelTypeConfig(selectedChannel?.type || '').color,
                        fontSize: 16
                    }}>
                        {getChannelTypeConfig(selectedChannel?.type || '').icon}
                    </span>
                    <div>
                        <Text strong>{selectedChannel?.name}</Text>
                        <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                            已选渠道 · {getChannelTypeConfig(selectedChannel?.type || '').label}
                        </div>
                    </div>
                </Space>
                <Button size="small" onClick={() => { setStep('channel'); setTemplateSearch(''); }}>
                    更换渠道
                </Button>
            </div>

            {/* 搜索和刷新 */}
            <div style={{ paddingBottom: 12, display: 'flex', gap: 8 }}>
                <Input
                    placeholder="搜索模板名称或描述..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={templateSearch}
                    onChange={e => {
                        setTemplateSearch(e.target.value);
                        setTemplatePage(1);
                    }}
                    allowClear
                    style={{ flex: 1 }}
                />
                <Tooltip title="刷新模板列表">
                    <Button icon={<ReloadOutlined />} onClick={loadTemplates} loading={loadingTemplates} />
                </Tooltip>
            </div>

            {/* 模板兼容性提示 */}
            <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    显示支持 {getChannelTypeConfig(selectedChannel?.type || '').label} 类型的模板
                </Text>
            </div>

            {/* 模板列表 */}
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
                <Spin spinning={loadingTemplates}>
                    {paginatedTemplates.length === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配模板" style={{ padding: 40 }} />
                    ) : (
                        paginatedTemplates.map(t => (
                            <div
                                key={t.id}
                                onClick={() => handleSelectTemplate(t.id)}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f5f5f5',
                                    cursor: 'pointer',
                                    background: '#fff',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 4,
                                        background: '#e6f7ff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#1890ff',
                                        fontSize: 16
                                    }}>
                                        <FileTextOutlined />
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                                        {t.description && (
                                            <Paragraph
                                                ellipsis={{ rows: 1 }}
                                                style={{ fontSize: 12, color: '#8c8c8c', margin: 0, marginTop: 2 }}
                                            >
                                                {t.description}
                                            </Paragraph>
                                        )}
                                        {t.supported_channels && t.supported_channels.length > 0 && (
                                            <div style={{ marginTop: 4 }}>
                                                {t.supported_channels.map(sc => (
                                                    <Tag key={sc} style={{ fontSize: 10, lineHeight: '14px', margin: '0 4px 0 0', padding: '0 4px' }}>
                                                        {getChannelTypeConfig(sc).label}
                                                    </Tag>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </Spin>
            </div>

            {/* 分页 */}
            {filteredTemplates.length > PAGE_SIZE && (
                <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        共 {filteredTemplates.length} 个模板
                    </Text>
                    <Pagination
                        size="small"
                        current={templatePage}
                        pageSize={PAGE_SIZE}
                        total={filteredTemplates.length}
                        onChange={setTemplatePage}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* 已配置的渠道-模板列表 */}
            {value.length > 0 && (
                <div style={{
                    border: '1px solid #f0f0f0',
                    borderRadius: 4,
                    background: '#fafafa'
                }}>
                    {value.map((cfg, idx) => {
                        const channel = getChannel(cfg.channel_id);
                        const typeConfig = getChannelTypeConfig(channel?.type || '');
                        return (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderBottom: idx < value.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    background: '#fff',
                                }}
                            >
                                <Space size={12}>
                                    <span style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 4,
                                        background: `${typeConfig.color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: typeConfig.color,
                                        fontSize: 14
                                    }}>
                                        {typeConfig.icon}
                                    </span>
                                    <div>
                                        <Text style={{ fontSize: 13 }}>{getChannelName(cfg.channel_id)}</Text>
                                        <Text type="secondary" style={{ margin: '0 8px' }}>→</Text>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{getTemplateName(cfg.template_id)}</Text>
                                    </div>
                                    <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>
                                        {typeConfig.label}
                                    </Tag>
                                </Space>
                                <CloseOutlined
                                    style={{ color: '#bfbfbf', cursor: 'pointer', fontSize: 12, padding: 4 }}
                                    onClick={() => handleRemoveConfig(idx)}
                                    onMouseEnter={e => e.currentTarget.style.color = '#ff4d4f'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#bfbfbf'}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 添加按钮 */}
            <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={openSelector}
                style={{
                    borderRadius: 4,
                    borderColor: '#d9d9d9',
                    color: '#595959',
                    height: 40
                }}
                loading={loading}
            >
                添加通知配置
            </Button>

            {/* 选择器Modal */}
            <Modal
                title={
                    <Space>
                        <BellOutlined style={{ color: '#1890ff' }} />
                        <span>{step === 'channel' ? '选择通知渠道' : '选择消息模板'}</span>
                        <Tag color="blue">{step === 'channel' ? '第 1 步' : '第 2 步'}</Tag>
                    </Space>
                }
                open={selectorOpen}
                onCancel={() => setSelectorOpen(false)}
                footer={null}
                width={600}
                destroyOnClose
                bodyStyle={{ padding: '16px 24px' }}
            >
                {step === 'channel' ? renderChannelContent() : renderTemplateContent()}
            </Modal>
        </div>
    );
};

export default NotificationChannelTemplateSelector;
