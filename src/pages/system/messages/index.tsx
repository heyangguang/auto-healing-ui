import React, { useState, useRef, useCallback } from 'react';
import { Tag, Space, message, Button, Tooltip, Drawer, Typography, Badge } from 'antd';
import {
    CheckOutlined, CheckCircleOutlined,
    BellOutlined, MailOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, SearchField } from '@/components/StandardTable';
import {
    getSiteMessages,
    markAsRead,
    markAllAsRead,
    deleteSiteMessages,
    type SiteMessage,
} from '@/services/auto-healing/siteMessage';
import dayjs from 'dayjs';
import './index.css';

const { Text } = Typography;

/* ========== 搜索字段配置 ========== */
const searchFields: SearchField[] = [
    { key: 'title', label: '标题' },
    { key: 'category', label: '分类' },
];

/* ========== 站内通知页面 ========== */
const SystemMessages: React.FC = () => {
    /* ---- 选中行 ---- */
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [selectedRows, setSelectedRows] = useState<SiteMessage[]>([]);

    /* ---- 详情 Drawer ---- */
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentMsg, setCurrentMsg] = useState<SiteMessage | null>(null);

    /* ---- 刷新触发器 ---- */
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(n => n + 1);
        setSelectedRowKeys([]);
        setSelectedRows([]);
    }, []);

    /* ---- 打开详情 ---- */
    const openDetail = useCallback((msg: SiteMessage) => {
        setCurrentMsg(msg);
        setDetailOpen(true);
        if (!msg.isRead) {
            markAsRead([msg.id]).then(() => triggerRefresh());
        }
    }, [triggerRefresh]);

    /* ---- 批量操作 ---- */

    const handleBatchMarkRead = useCallback(async () => {
        if (selectedRowKeys.length === 0) return message.warning('请先选择消息');
        await markAsRead(selectedRowKeys as string[]);
        message.success('已标记为已读');
        triggerRefresh();
    }, [selectedRowKeys, triggerRefresh]);

    const handleMarkAllRead = useCallback(async () => {
        await markAllAsRead();
        message.success('全部已读');
        triggerRefresh();
    }, [triggerRefresh]);

    /* ========== 列定义 ========== */
    const columns: StandardColumnDef<SiteMessage>[] = [
        {
            columnKey: 'category',
            columnTitle: '分类',
            dataIndex: 'category',
            width: 140,
            ellipsis: true,
            render: (_: any, record: SiteMessage) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tooltip title={record.isRead ? '已读' : '未读'}>
                        <span style={{
                            display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                            background: record.isRead ? '#d9d9d9' : '#1677ff', flexShrink: 0,
                        }} />
                    </Tooltip>
                    <Text type="secondary" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.category}</Text>
                </span>
            ),
        },
        {
            columnKey: 'title',
            columnTitle: '标题',
            dataIndex: 'title',
            fixedColumn: true,
            width: 240,
            ellipsis: true,
            render: (_: any, record: SiteMessage) => (
                <a
                    style={{
                        fontWeight: record.isRead ? 400 : 600,
                        color: '#1677ff',
                        cursor: 'pointer',
                    }}
                    onClick={(e) => { e.stopPropagation(); openDetail(record); }}
                >
                    {record.title}
                </a>
            ),
        },
        {
            columnKey: 'summary',
            columnTitle: '内容摘要',
            dataIndex: 'content',
            ellipsis: true,
            render: (_: any, record: SiteMessage) => {
                // 从 html content 中提取纯文本作为摘要
                const text = record.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                const summary = text.length > 60 ? text.substring(0, 60) + '…' : text;
                return (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {summary}
                    </Text>
                );
            },
        },
        {
            columnKey: 'date',
            columnTitle: '时间',
            dataIndex: 'date',
            width: 110,
            sorter: true,
            render: (_: any, record: SiteMessage) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.date}
                </Text>
            ),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            fixedColumn: true,
            width: 50,
            render: (_: any, record: SiteMessage) => (
                !record.isRead ? (
                    <Tooltip title="标记已读">
                        <Button
                            type="link" size="small" icon={<CheckOutlined />}
                            onClick={async (e) => {
                                e.stopPropagation();
                                await markAsRead([record.id]);
                                message.success('已标记');
                                triggerRefresh();
                            }}
                        />
                    </Tooltip>
                ) : null
            ),
        },
    ];

    /* ========== 数据请求 ========== */
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const res = await getSiteMessages({
            page: params.page,
            page_size: params.pageSize,
        });
        const items = res?.data || [];
        const total = res?.total ?? 0;
        return { data: items, total };
    }, []);

    /* ========== 头部图标 ========== */
    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 4C17.4 4 12 9.4 12 16v8l-4 4v2h32v-2l-4-4v-8c0-6.6-5.4-12-12-12z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 34c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="36" cy="10" r="4" fill="currentColor" opacity="0.3" />
        </svg>
    );

    /* ========== 工具栏额外操作 ========== */
    const extraActions = (
        <>
            <Tooltip title="标记已读">
                <Button
                    icon={<CheckOutlined />}
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleBatchMarkRead}
                />
            </Tooltip>
            <Tooltip title="全部已读">
                <Button
                    icon={<CheckCircleOutlined />}
                    onClick={handleMarkAllRead}
                />
            </Tooltip>
        </>
    );

    return (
        <>
            <StandardTable<SiteMessage>
                tabs={[{ key: 'list', label: '全部消息' }]}
                title="站内通知"
                description="系统消息与通知管理。查看、管理系统推送的通知消息，支持批量标记已读操作。"
                headerIcon={headerIcon}
                searchFields={searchFields}
                extraToolbarActions={extraActions}
                columns={columns}
                rowKey="id"
                onRowClick={(record) => openDetail(record)}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys, rows) => {
                        setSelectedRowKeys(keys);
                        setSelectedRows(rows);
                    },
                }}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="site_messages"
                refreshTrigger={refreshTrigger}
            />

            {/* 消息详情 Drawer */}
            <Drawer
                title={null}
                width={520}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                styles={{ header: { display: 'none' }, body: { padding: 0 } }}
            >
                {currentMsg && (
                    <>
                        {/* 头部 */}
                        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: '50%',
                                    background: '#e6f4ff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <MailOutlined style={{ fontSize: 20, color: '#1677ff' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                                        {currentMsg.title}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {currentMsg.category}
                                    </Text>
                                </div>
                                <Badge
                                    status={currentMsg.isRead ? 'default' : 'processing'}
                                    text={currentMsg.isRead ? '已读' : '未读'}
                                />
                            </div>
                            {!currentMsg.isRead && (
                                <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={async () => {
                                        await markAsRead([currentMsg.id]);
                                        message.success('已标记为已读');
                                        setCurrentMsg({ ...currentMsg, isRead: true });
                                        triggerRefresh();
                                    }}
                                >
                                    标记已读
                                </Button>
                            )}
                        </div>

                        {/* 详细信息 */}
                        <div style={{ padding: '16px 24px' }}>
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />消息时间
                                </Text>
                            </div>
                            <Text style={{ fontSize: 13 }}>
                                {currentMsg.date} {currentMsg.time}
                            </Text>

                            <div style={{ margin: '16px 0 8px' }}>
                                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    消息内容
                                </Text>
                            </div>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    background: '#fafafa',
                                    borderRadius: 6,
                                    lineHeight: 1.8,
                                    fontSize: 14,
                                    color: '#333',
                                }}
                                dangerouslySetInnerHTML={{ __html: currentMsg.content }}
                            />
                        </div>
                    </>
                )}
            </Drawer>
        </>
    );
};

export default SystemMessages;
