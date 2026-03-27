import {
    BellOutlined,
    CheckCircleOutlined,
    DingdingOutlined,
    GlobalOutlined,
    MailOutlined,
    StopOutlined,
} from '@ant-design/icons';
import {
    Button,
    Empty,
    Pagination,
    Row,
    Spin,
    Typography,
    message,
} from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { history } from '@umijs/max';
import { useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import { extractErrorMsg } from '@/utils/errorMsg';
import {
    getChannels, deleteChannel, testChannel, updateChannel
} from '@/services/auto-healing/notification';
import './index.css';
import { CHANNEL_TYPE_CONFIG, getChannelTypeConfig } from '@/constants/notificationDicts';
import NotificationChannelCard from './NotificationChannelCard';
import NotificationChannelDetailDrawer from './NotificationChannelDetailDrawer';

const { Text } = Typography;

const getTypeConfig = (type: string) => getChannelTypeConfig(type);

type NotificationChannelsAdvancedSearch = {
    name?: string;
    type?: AutoHealing.ChannelType;
};

type NotificationChannelsSearchParams = {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: NotificationChannelsAdvancedSearch;
    filters?: { field: string; value: string }[];
};

// ==================== Main Page Component ====================
const NotificationChannelsPage: React.FC = () => {
    const access = useAccess();

    // Data State
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination & Filters
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(12);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<AutoHealing.ChannelType | ''>('');

    // Detail Drawer
    const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
    const [detailChannel, setDetailChannel] = useState<AutoHealing.NotificationChannel | null>(null);

    // ==================== Data Loading ====================
    const loadChannels = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getChannels({
                page: currentPage,
                page_size: pageSize,
                type: filterType || undefined,
                name: searchText || undefined,
            });
            setChannels(res.data || []);
            setTotal(res.total || 0);
        } catch (error: unknown) {
            setChannels([]);
            setTotal(0);
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '加载通知渠道失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, filterType, searchText]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    // StandardTable onSearch callback
    const handleSearchChange = useCallback((params: NotificationChannelsSearchParams) => {
        const filters = params.filters || [];
        const nameFilter = filters.find(f => f.field === 'name');
        const typeFilter = filters.find(f => f.field === '__enum__type') || filters.find(f => f.field === 'type');
        const advType = params.advancedSearch?.type;
        const advName = params.advancedSearch?.name;
        setCurrentPage(1);
        setSearchText(nameFilter?.value || advName || '');
        setFilterType((typeFilter?.value as AutoHealing.ChannelType | undefined) || advType || '');
    }, []);

    // ==================== Actions ====================
    const handleToggle = async (channel: AutoHealing.NotificationChannel, checked: boolean) => {
        const originalState = channel.is_active;
        setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, is_active: checked } : c));
        setActionLoading(channel.id);
        try {
            await updateChannel(channel.id, { is_active: checked });
            message.success(checked ? '渠道已启用' : '渠道已禁用');
        } catch (error: unknown) {
            setChannels(prev => prev.map(c => c.id === channel.id ? { ...c, is_active: originalState } : c));
            message.error(extractErrorMsg(
                error as Parameters<typeof extractErrorMsg>[0],
                checked ? '启用渠道失败，请稍后重试' : '禁用渠道失败，请稍后重试',
            ));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (channel: AutoHealing.NotificationChannel) => {
        setActionLoading(channel.id);
        try {
            await deleteChannel(channel.id);
            message.success('渠道已删除');
            const nextTotal = Math.max(0, total - 1);
            const nextPage = Math.min(currentPage, Math.max(1, Math.ceil(nextTotal / pageSize)));
            setChannels(prev => prev.filter(c => c.id !== channel.id));
            setTotal(nextTotal);
            if (nextPage !== currentPage) {
                setCurrentPage(nextPage);
            } else {
                loadChannels();
            }
        } catch (error: unknown) {
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '删除渠道失败，请稍后重试'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleTest = async (channel: AutoHealing.NotificationChannel) => {
        setActionLoading(channel.id);
        try {
            await testChannel(channel.id);
            message.success('连接测试成功');
        } catch (error: unknown) {
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '测试渠道失败，请稍后重试'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleViewDetail = (channel: AutoHealing.NotificationChannel) => {
        setDetailChannel(channel);
        setDetailDrawerOpen(true);
    };

    const handleEdit = useCallback((channel: AutoHealing.NotificationChannel) => {
        history.push(`/notification/channels/${channel.id}/edit`);
    }, []);

    // ==================== Main Render ====================
    return (
        <StandardTable<AutoHealing.NotificationChannel>
            tabs={[{ key: 'grid', label: '渠道列表' }]}
            title="通知渠道"
            description={`管理通知渠道配置，当前共 ${total} 个渠道`}
            headerIcon={
                <svg viewBox="0 0 48 48" fill="none">
                    <path d="M24 6v4M24 38v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M10 24c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 28h32v2a4 4 0 01-4 4H12a4 4 0 01-4-4v-2z" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="24" cy="38" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
            }
            searchFields={[
                { key: 'name', label: '渠道名称' },
            ]}
            columns={[
                {
                    columnKey: 'type',
                    columnTitle: '渠道类型',
                    dataIndex: 'type',
                    headerFilters: [
                        { label: 'Webhook', value: 'webhook' },
                        { label: '邮件', value: 'email' },
                        { label: '钉钉', value: 'dingtalk' },
                    ],
                },
            ]}
            onSearch={handleSearchChange}
            primaryActionLabel="新建渠道"
            primaryActionDisabled={!access.canCreateChannel}
            onPrimaryAction={() => history.push('/notification/channels/create')}
        >
            {/* ===== 卡片网格 ===== */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
            ) : channels.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">暂无通知渠道配置</Text>}
                >
                    <Button type="dashed" disabled={!access.canCreateChannel} onClick={() => history.push('/notification/channels/create')}>创建第一个渠道</Button>
                </Empty>
            ) : (
                <Row gutter={[20, 20]} className="channels-grid">
                    {channels.map((channel) => (
                        <NotificationChannelCard
                            key={channel.id}
                            actionLoading={actionLoading === channel.id}
                            canDelete={!!access.canDeleteChannel}
                            canTest={!!access.canTestChannel}
                            canUpdate={!!access.canUpdateChannel}
                            channel={channel}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onTest={handleTest}
                            onToggle={handleToggle}
                            onViewDetail={handleViewDetail}
                        />
                    ))}
                </Row>
            )}

            {/* ===== 分页 ===== */}
            {!loading && total > 0 && (
                <div className="channels-pagination">
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={total}
                        onChange={(page, size) => {
                            setCurrentPage(page);
                            setPageSize(size);
                        }}
                        showSizeChanger={true}
                        pageSizeOptions={['12', '24', '48']}
                        showQuickJumper
                        showTotal={t => `共 ${t} 条`}
                    />
                </div>
            )}

            <NotificationChannelDetailDrawer
                canTest={!!access.canTestChannel}
                canUpdate={!!access.canUpdateChannel}
                channel={detailChannel}
                open={detailDrawerOpen}
                onClose={() => setDetailDrawerOpen(false)}
                onEdit={(channel) => {
                    setDetailDrawerOpen(false);
                    handleEdit(channel);
                }}
                onTest={(channel) => {
                    setDetailDrawerOpen(false);
                    void handleTest(channel);
                }}
            />
        </StandardTable>
    );
};

export default NotificationChannelsPage;
