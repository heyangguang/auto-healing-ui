import React, { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import { Button, message, Space, Tag, Typography, Input, Empty, Spin, Modal, Drawer, Descriptions, Popconfirm, Select, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, AlertOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, CheckOutlined, CloseOutlined, ClearOutlined, DashboardOutlined } from '@ant-design/icons';
import { getPendingTriggers, getPendingApprovals, triggerHealing, approveTask, rejectTask } from '@/services/auto-healing/healing';
import './index.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 200;

const PendingCenter: React.FC = () => {
    const access = useAccess();
    // 延迟渲染以避免页面切换时阻塞主线程
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // 全局日期范围
    const [globalDateRange, setGlobalDateRange] = useState<[any, any] | null>(null);

    // 各面板独立搜索
    const [triggerSearch, setTriggerSearch] = useState('');
    const [triggerSeverity, setTriggerSeverity] = useState<string | undefined>(undefined);

    const [approvalSearch, setApprovalSearch] = useState('');

    // Data with pagination
    const [triggerData, setTriggerData] = useState<AutoHealing.Incident[]>([]);
    const [triggerTotal, setTriggerTotal] = useState(0);
    const [triggerPage, setTriggerPage] = useState(1);
    const [triggerHasMore, setTriggerHasMore] = useState(true);
    const [triggerLoading, setTriggerLoading] = useState(false);

    const [approvalData, setApprovalData] = useState<AutoHealing.ApprovalTask[]>([]);
    const [approvalTotal, setApprovalTotal] = useState(0);
    const [approvalPage, setApprovalPage] = useState(1);
    const [approvalHasMore, setApprovalHasMore] = useState(true);
    const [approvalLoading, setApprovalLoading] = useState(false);

    // Detail drawer
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<any>(null);
    const [detailType, setDetailType] = useState<'trigger' | 'approval'>('trigger');

    // Debounce refs
    const triggerDebounceRef = useRef<NodeJS.Timeout>();
    const approvalDebounceRef = useRef<NodeJS.Timeout>();

    const fetchTriggers = useCallback(async (page: number, reset = false, search?: string, severity?: string) => {
        setTriggerLoading(true);
        try {
            const res = await getPendingTriggers({
                page,
                page_size: PAGE_SIZE,
                search: search !== undefined ? search : (triggerSearch || undefined),
                severity: severity !== undefined ? severity : triggerSeverity,
                date_from: globalDateRange?.[0]?.format('YYYY-MM-DD'),
                date_to: globalDateRange?.[1]?.format('YYYY-MM-DD'),
            });
            const newData = res.data || [];
            setTriggerData(prev => reset ? newData : [...prev, ...newData]);
            setTriggerTotal(res.total || 0);
            setTriggerHasMore(newData.length === PAGE_SIZE);
        } catch (error) {
            // Silent fail for debounced searches
        } finally {
            setTriggerLoading(false);
        }
    }, [triggerSearch, triggerSeverity, globalDateRange]);

    const fetchApprovals = useCallback(async (page: number, reset = false, search?: string) => {
        setApprovalLoading(true);
        try {
            const res = await getPendingApprovals({
                page,
                page_size: PAGE_SIZE,
                search: search !== undefined ? search : (approvalSearch || undefined),
                date_from: globalDateRange?.[0]?.format('YYYY-MM-DD'),
                date_to: globalDateRange?.[1]?.format('YYYY-MM-DD'),
            });
            const newData = res.data || [];
            setApprovalData(prev => reset ? newData : [...prev, ...newData]);
            setApprovalTotal(res.total || 0);
            setApprovalHasMore(newData.length === PAGE_SIZE);
        } catch (error) {
            // Silent fail for debounced searches
        } finally {
            setApprovalLoading(false);
        }
    }, [approvalSearch, globalDateRange]);

    // 首次加载
    const loadAll = useCallback(async () => {
        setLoading(true);
        setTriggerPage(1);
        setApprovalPage(1);
        await Promise.all([fetchTriggers(1, true), fetchApprovals(1, true)]);
        setLoading(false);
    }, []);

    // 延迟挂载：让页面切换动画先完成，避免阻塞菜单 hover 效果
    useEffect(() => {
        // 使用 requestIdleCallback 或 setTimeout 延迟渲染重内容
        const timer = requestAnimationFrame(() => {
            startTransition(() => {
                setMounted(true);
            });
        });
        return () => cancelAnimationFrame(timer);
    }, []);

    // 数据加载在挂载后进行
    useEffect(() => {
        if (mounted) {
            loadAll();
        }
    }, [mounted]);

    // Debounced trigger search
    useEffect(() => {
        if (triggerDebounceRef.current) clearTimeout(triggerDebounceRef.current);
        triggerDebounceRef.current = setTimeout(() => {
            setTriggerPage(1);
            fetchTriggers(1, true, triggerSearch || undefined, triggerSeverity);
        }, DEBOUNCE_MS);
        return () => clearTimeout(triggerDebounceRef.current);
    }, [triggerSearch, triggerSeverity, globalDateRange]);

    // Debounced approval search
    useEffect(() => {
        if (approvalDebounceRef.current) clearTimeout(approvalDebounceRef.current);
        approvalDebounceRef.current = setTimeout(() => {
            setApprovalPage(1);
            fetchApprovals(1, true, approvalSearch || undefined);
        }, DEBOUNCE_MS);
        return () => clearTimeout(approvalDebounceRef.current);
    }, [approvalSearch, globalDateRange]);

    // Load more handlers
    const loadMoreTriggers = () => {
        if (!triggerHasMore || triggerLoading) return;
        const nextPage = triggerPage + 1;
        setTriggerPage(nextPage);
        fetchTriggers(nextPage);
    };

    const loadMoreApprovals = () => {
        if (!approvalHasMore || approvalLoading) return;
        const nextPage = approvalPage + 1;
        setApprovalPage(nextPage);
        fetchApprovals(nextPage);
    };

    // 重置所有筛选条件
    const handleReset = () => {
        setTriggerSearch('');
        setTriggerSeverity(undefined);
        setApprovalSearch('');
        setGlobalDateRange(null);
    };

    const getSeverityConfig = (severity: string | number) => {
        const s = String(severity).toLowerCase();
        if (s === '1' || s === 'critical') return { color: '#ff4d4f', label: '严重', icon: <AlertOutlined style={{ fontSize: 16, color: '#ff4d4f' }} /> };
        if (s === '2' || s === 'high') return { color: '#fa8c16', label: '高', icon: <WarningOutlined style={{ fontSize: 16, color: '#fa8c16' }} /> };
        if (s === '3' || s === 'medium') return { color: '#1890ff', label: '中', icon: <InfoCircleOutlined style={{ fontSize: 16, color: '#1890ff' }} /> };
        return { color: '#52c41a', label: '低', icon: <CheckCircleOutlined style={{ fontSize: 16, color: '#52c41a' }} /> };
    };

    const handleTrigger = async (item: AutoHealing.Incident) => {
        setActionLoading(item.id);
        try {
            await triggerHealing(item.id);
            message.success('已启动自愈流程');
            fetchTriggers(1, true);
        } catch {
            message.error('启动失败');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = async (item: AutoHealing.ApprovalTask) => {
        setActionLoading(item.id);
        try {
            await approveTask(item.id, { comment: '' });
            message.success('已批准');
            fetchApprovals(1, true);
        } catch {
            message.error('操作失败');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (item: AutoHealing.ApprovalTask) => {
        let comment = '';
        Modal.confirm({
            title: '拒绝任务',
            content: <Input.TextArea placeholder="拒绝原因（必填）" onChange={(e) => comment = e.target.value} />,
            okText: '拒绝',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: async () => {
                if (!comment) { message.error('请输入拒绝原因'); return Promise.reject(); }
                setActionLoading(item.id);
                try {
                    await rejectTask(item.id, { comment });
                    message.success('已拒绝');
                    fetchApprovals(1, true);
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const openDetail = (item: any, type: 'trigger' | 'approval') => {
        setDetailItem(item);
        setDetailType(type);
        setDetailOpen(true);
    };

    // 未挂载时返回最小化 UI，避免阻塞主线程
    if (!mounted) {
        return (
            <PageContainer header={{ title: <><DashboardOutlined /> 待办中心 / PENDING CENTER</> }} ghost>
                <div style={{ textAlign: 'center', padding: 100 }}>
                    <Spin size="large" />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            header={{
                title: <><DashboardOutlined /> 待办中心 / PENDING CENTER</>,
                subTitle: `${triggerTotal + approvalTotal} 条待处理`,
            }}
            ghost
        >
            <div className="mission-control-container" style={{ height: 'auto', overflow: 'visible' }}>
                <div className="launchpad-grid" style={{ height: 'auto', overflow: 'visible' }}>
                    {/* Toolbar */}
                    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <Space wrap>
                            <RangePicker
                                placeholder={['开始日期', '结束日期']}
                                value={globalDateRange}
                                onChange={(dates) => setGlobalDateRange(dates as [any, any])}
                            />
                            <Button icon={<ClearOutlined />} onClick={handleReset}>重置</Button>
                            <Button icon={<ReloadOutlined />} onClick={() => { fetchTriggers(1, true); fetchApprovals(1, true); }} loading={loading}>刷新</Button>
                        </Space>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                    ) : (
                        /* 左右分栏：左=审批，右=触发 */
                        <div style={{ display: 'flex', gap: 16 }}>
                            {/* 左侧：待审批任务 */}
                            <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px dashed #d9d9d9', padding: 16 }}>
                                {/* 标题栏 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #e8e8e8' }}>
                                    <ClockCircleOutlined style={{ color: '#faad14', fontSize: 18 }} />
                                    <Text strong style={{ fontSize: 15 }}>待审批任务</Text>
                                    <Tag color="orange">{approvalTotal}</Tag>
                                    {approvalLoading && <Spin size="small" />}
                                </div>
                                {/* 搜索栏 - 异步搜索 */}
                                <div style={{ marginBottom: 12 }}>
                                    <Input
                                        placeholder="搜索节点名称、流程ID..."
                                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                        value={approvalSearch}
                                        onChange={e => setApprovalSearch(e.target.value)}
                                        allowClear
                                    />
                                </div>
                                {/* 列表 */}
                                {approvalData.length === 0 ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待审批任务" />
                                ) : (
                                    <>
                                        {approvalData.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => openDetail(item, 'approval')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '12px 14px',
                                                    background: '#fff',
                                                    border: '1px dashed #e8e8e8',
                                                    borderLeft: '3px dashed #faad14',
                                                    marginBottom: 8,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#fffbe6'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                            >
                                                <ClockCircleOutlined style={{ fontSize: 16, color: '#faad14', marginRight: 12, flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Text strong style={{ fontSize: 13, display: 'block' }} ellipsis>{item.node_name || '审批节点'}</Text>
                                                    <Text style={{ fontSize: 11, color: '#8c8c8c' }}>FLOW-{item.flow_instance_id?.substring(0, 8)} | {item.created_at?.split('T')[0]}</Text>
                                                </div>
                                                <Space size={4} onClick={e => e.stopPropagation()}>
                                                    <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(item)} loading={actionLoading === item.id} disabled={!access.canApprove}>批准</Button>
                                                    <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleReject(item)} loading={actionLoading === item.id} disabled={!access.canApprove}>拒绝</Button>
                                                </Space>
                                            </div>
                                        ))}
                                        {approvalHasMore && (
                                            <div style={{ textAlign: 'center', padding: 12 }}>
                                                <Button type="link" onClick={loadMoreApprovals} loading={approvalLoading}>加载更多...</Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* 右侧：待触发工单 */}
                            <div style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px dashed #d9d9d9', padding: 16 }}>
                                {/* 标题栏 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed #e8e8e8' }}>
                                    <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                                    <Text strong style={{ fontSize: 15 }}>待触发工单</Text>
                                    <Tag color="blue">{triggerTotal}</Tag>
                                    {triggerLoading && <Spin size="small" />}
                                </div>
                                {/* 搜索栏 - 异步搜索 */}
                                <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                                    <Input
                                        placeholder="搜索标题、工单ID、影响CI..."
                                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                        value={triggerSearch}
                                        onChange={e => setTriggerSearch(e.target.value)}
                                        allowClear
                                        style={{ flex: 1 }}
                                    />
                                    <Select
                                        placeholder="级别"
                                        allowClear
                                        style={{ width: 80 }}
                                        value={triggerSeverity}
                                        onChange={setTriggerSeverity}
                                        options={[
                                            { label: '严重', value: 'critical' },
                                            { label: '高', value: 'high' },
                                            { label: '中', value: 'medium' },
                                            { label: '低', value: 'low' },
                                        ]}
                                    />
                                </div>
                                {/* 列表 */}
                                {triggerData.length === 0 ? (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待触发工单" />
                                ) : (
                                    <>
                                        {triggerData.map(item => {
                                            const config = getSeverityConfig(item.severity);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => openDetail(item, 'trigger')}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '12px 14px',
                                                        background: '#fff',
                                                        border: '1px dashed #e8e8e8',
                                                        borderLeft: `3px dashed ${config.color} `,
                                                        marginBottom: 8,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9ff'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                                                >
                                                    {config.icon}
                                                    <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                                                        <Text strong style={{ fontSize: 13, display: 'block' }} ellipsis>{item.title}</Text>
                                                        <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{item.external_id} | {item.affected_ci} | {item.created_at?.split('T')[0]}</Text>
                                                    </div>
                                                    <Tag color={config.color} style={{ marginRight: 8 }}>{config.label}</Tag>
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <Popconfirm title="确认启动自愈？" onConfirm={() => handleTrigger(item)} okText="启动" cancelText="取消">
                                                            <Button type="primary" size="small" icon={<ThunderboltOutlined />} loading={actionLoading === item.id} disabled={!access.canTriggerHealing}>启动</Button>
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {triggerHasMore && (
                                            <div style={{ textAlign: 'center', padding: 12 }}>
                                                <Button type="link" onClick={loadMoreTriggers} loading={triggerLoading}>加载更多...</Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer - 全局遮盖 */}
            <Drawer
                title={detailType === 'trigger' ? '工单详情' : '审批任务详情'}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                width={480}
                afterOpenChange={(open) => {
                    // 强制修复 body 的 padding-right，防止抖动
                    if (open) {
                        document.body.style.paddingRight = '0px';
                        document.body.style.overflow = 'auto';
                    }
                }}
            >
                {detailItem && detailType === 'trigger' && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="标题">{detailItem.title}</Descriptions.Item>
                        <Descriptions.Item label="工单ID">{detailItem.external_id}</Descriptions.Item>
                        <Descriptions.Item label="等级"><Tag color={getSeverityConfig(detailItem.severity).color}>{getSeverityConfig(detailItem.severity).label}</Tag></Descriptions.Item>
                        <Descriptions.Item label="影响CI">{detailItem.affected_ci}</Descriptions.Item>
                        <Descriptions.Item label="影响服务">{detailItem.affected_service}</Descriptions.Item>
                        <Descriptions.Item label="描述">{detailItem.description || '-'}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{detailItem.created_at}</Descriptions.Item>
                    </Descriptions>
                )}
                {detailItem && detailType === 'approval' && (
                    <Descriptions column={1} bordered size="small">
                        <Descriptions.Item label="节点名称">{detailItem.node_name || '审批节点'}</Descriptions.Item>
                        <Descriptions.Item label="流程实例">FLOW-{detailItem.flow_instance_id?.substring(0, 8)}</Descriptions.Item>
                        <Descriptions.Item label="状态"><Tag color="orange">待审批</Tag></Descriptions.Item>
                        <Descriptions.Item label="审批人">{(detailItem.approvers || []).join(', ') || '-'}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{detailItem.created_at}</Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </PageContainer>
    );
};

export default PendingCenter;
