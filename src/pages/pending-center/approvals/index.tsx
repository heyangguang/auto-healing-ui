import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useAccess } from '@umijs/max';
import { Button, message, Space, Tag, Modal, Input, Drawer, Descriptions, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import StandardTable, { type StandardColumnDef, type SearchField, type AdvancedSearchField } from '@/components/StandardTable';
import { getPendingApprovals, approveTask, rejectTask } from '@/services/auto-healing/healing';
import { getSimpleUsers } from '@/services/auto-healing/users';
import dayjs from 'dayjs';

const { Text } = Typography;

/* ============================== 工具函数 ============================== */

const formatTime = (t: string | null | undefined) => {
    if (!t) return '-';
    return dayjs(t).format('YYYY-MM-DD HH:mm:ss');
};

/* ============================== 搜索字段 ============================== */

const searchFields: SearchField[] = [
    { key: 'node_name', label: '关键字', placeholder: '搜索节点ID/流程ID' },
];

const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

/* ============================== 组件 ============================== */

const PendingApprovals: React.FC = () => {
    const access = useAccess();
    const refreshCountRef = useRef(0);

    /* ------------ 用户名映射 ------------ */
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    useEffect(() => {
        getSimpleUsers().then((res) => {
            const map: Record<string, string> = {};
            (res?.data || []).forEach((u: any) => {
                map[u.id] = u.display_name || u.username || u.id;
                map[u.username] = u.display_name || u.username || u.id;
            });
            setUserMap(map);
        }).catch(() => { });
    }, []);

    /** 将审批人UUID数组解析为用户名 */
    const resolveApprovers = useCallback((record: any): string => {
        const ids: string[] = record.approvers || [];
        if (ids.length === 0) return '-';
        // 也利用 record.initiator 补充映射
        const localMap = { ...userMap };
        if (record.initiator?.id || record.initiator?.username) {
            const name = record.initiator.display_name || record.initiator.username || record.initiator.id;
            if (record.initiator.id) localMap[record.initiator.id] = name;
            if (record.initiator.username) localMap[record.initiator.username] = name;
        }
        return ids.map((id: string) => localMap[id] || id.substring(0, 8) + '...').join(', ');
    }, [userMap]);

    /* ------------ 详情 Drawer ------------ */
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [detail, setDetail] = useState<any>(null);

    const openDetail = useCallback((record: any) => {
        setDetail(record);
        setDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setDrawerOpen(false);
        setDetail(null);
    }, []);

    /* ------------ 审批操作 ------------ */
    const [, setRefreshKey] = useState(0);
    const handleApprove = useCallback((id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `批准任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入审批意见（可选）"
                        onChange={(e) => { comment = e.target.value; }}
                    />
                </div>
            ),
            okText: '批准',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await approveTask(id, { comment });
                    message.success('已批准');
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                } catch {
                    /* global error handler */
                }
            },
        });
    }, []);

    const handleReject = useCallback((id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `拒绝任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入拒绝原因（必填）"
                        onChange={(e) => { comment = e.target.value; }}
                    />
                </div>
            ),
            okText: '拒绝',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                if (!comment.trim()) {
                    message.error('请输入拒绝原因');
                    return Promise.reject();
                }
                try {
                    await rejectTask(id, { comment });
                    message.success('已拒绝');
                    refreshCountRef.current += 1;
                    setRefreshKey(prev => prev + 1);
                } catch {
                    /* global error handler */
                }
            },
        });
    }, []);

    /* ============================== 列定义 ============================== */

    const columns: StandardColumnDef<any>[] = useMemo(() => [
        {
            columnKey: 'node_name',
            columnTitle: '节点名称',
            dataIndex: 'node_name',
            ellipsis: true,
            fixedColumn: true,
            render: (_: any, record: any) => record.node_name || record.node_id || '审批节点',
        },
        {
            columnKey: 'flow_instance_id',
            columnTitle: '流程实例',
            dataIndex: 'flow_instance_id',
            width: 200,
            render: (_: any, record: any) => (
                <Tag>FLOW-{record.flow_instance_id?.substring(0, 8)}</Tag>
            ),
        },
        {
            columnKey: 'status',
            columnTitle: '状态',
            dataIndex: 'status',
            width: 100,
            render: () => <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>,
        },
        {
            columnKey: 'approvers',
            columnTitle: '审批人',
            dataIndex: 'approvers',
            width: 200,
            render: (_: any, record: any) => resolveApprovers(record),
        },
        {
            columnKey: 'created_at',
            columnTitle: '创建时间',
            dataIndex: 'created_at',
            width: 180,
            sorter: true,
            render: (_: any, record: any) => formatTime(record.created_at),
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 160,
            fixedColumn: true,
            fixed: 'right',
            render: (_: any, record: any) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleApprove(record.id, record.node_name || record.node_id || '节点')}
                        disabled={!access.canApprove}
                    >
                        批准
                    </Button>
                    <Button
                        danger
                        size="small"
                        onClick={() => handleReject(record.id, record.node_name || record.node_id || '节点')}
                        disabled={!access.canApprove}
                    >
                        拒绝
                    </Button>
                </Space>
            ),
        },
    ], [handleApprove, handleReject, resolveApprovers]);

    /* ============================== 数据请求 ============================== */

    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const apiParams: Record<string, any> = {
            page: params.page,
            page_size: params.pageSize,
        };

        // 快速搜索 → 后端 node_name 参数
        if (params.searchValue) {
            apiParams.node_name = params.searchValue;
        }

        // 高级搜索 — 通用字段传递（支持 __exact 后缀）
        if (params.advancedSearch) {
            Object.entries(params.advancedSearch).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return;
                // dateRange 类型拆分为 date_from/date_to
                if (key === 'created_at' && Array.isArray(value) && value.length === 2) {
                    if (value[0]) apiParams.date_from = dayjs(value[0]).format('YYYY-MM-DD');
                    if (value[1]) apiParams.date_to = dayjs(value[1]).format('YYYY-MM-DD');
                    return;
                }
                apiParams[key] = value;
            });
        }

        if (params.sorter) {
            apiParams.sort_by = params.sorter.field;
            apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getPendingApprovals(apiParams);
        const items = res?.data || [];
        const total = Number(res?.total ?? 0);
        return { data: items, total };
    }, []);

    /* ============================== Header Icon ============================== */

    const headerIcon = useMemo(() => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="6" y="10" width="24" height="30" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M14 10V8a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 20l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="22" y1="20" x2="28" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 28l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="22" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="36" cy="36" r="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M33 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
    ), []);

    /* ============================== 详情 Drawer 内容 ============================== */

    const renderDetail = () => {
        if (!detail) return null;
        return (
            <>
                {/* 顶部状态横幅 */}
                <div style={{
                    padding: '12px 16px', marginBottom: 16,
                    background: '#fff7e6', border: '1px solid #ffd591',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <Text strong style={{ color: '#d46b08' }}>待审批</Text>
                </div>

                {/* 基本信息 */}
                <Descriptions
                    column={2}
                    size="small"
                    labelStyle={{ color: '#8c8c8c', width: 90 }}
                    style={{ marginBottom: 16 }}
                >
                    <Descriptions.Item label="节点名称" span={2}>
                        <Text strong>{detail.node_name || '审批节点'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="流程实例" span={2}>
                        <Text code>{detail.flow_instance_id || '-'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="审批人">
                        {resolveApprovers(detail)}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                        {formatTime(detail.created_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                        {formatTime(detail.updated_at)}
                    </Descriptions.Item>
                </Descriptions>

                {/* 底部 ID */}
                <div style={{
                    padding: '8px 0', borderTop: '1px solid #f0f0f0',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                        ID: {detail.id}
                    </Text>
                </div>
            </>
        );
    };

    /* ============================== 渲染 ============================== */

    return (
        <>
            <StandardTable<any>
                key={`approvals-${refreshCountRef.current}`}
                tabs={[{ key: 'list', label: '审批列表' }]}
                title="任务审批"
                description="查看待审批的流程任务，执行批准或拒绝操作。"
                headerIcon={headerIcon}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                columns={columns}
                rowKey="id"
                onRowClick={openDetail}
                request={handleRequest}
                defaultPageSize={10}
                preferenceKey="pending_approvals"
            />

            {/* 详情抽屉 */}
            <Drawer
                title="审批任务详情"
                open={drawerOpen}
                onClose={closeDrawer}
                size={600}
                extra={detail ? (
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => { closeDrawer(); handleApprove(detail.id, detail.node_name || '节点'); }}
                            disabled={!access.canApprove}
                        >
                            批准
                        </Button>
                        <Button
                            danger
                            onClick={() => { closeDrawer(); handleReject(detail.id, detail.node_name || '节点'); }}
                            disabled={!access.canApprove}
                        >
                            拒绝
                        </Button>
                    </Space>
                ) : undefined}
            >
                {renderDetail()}
            </Drawer>
        </>
    );
};

export default PendingApprovals;
