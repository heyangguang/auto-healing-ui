import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal, Input, Typography, Tag, Empty, Spin, Space, Row, Col,
    Select, Badge, Tooltip, Pagination,
} from 'antd';
import {
    SearchOutlined, BranchesOutlined, CheckCircleOutlined, PauseCircleOutlined,
    ThunderboltOutlined, AuditOutlined, BellOutlined, ForkOutlined,
    EyeOutlined, ApiOutlined, NodeIndexOutlined, ClockCircleOutlined,
    LoadingOutlined,
} from '@ant-design/icons';
import { getFlows } from '@/services/auto-healing/healing';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ==================== Types ====================
interface FlowSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, flow: AutoHealing.HealingFlow) => void;
    onCancel: () => void;
}

import { NODE_TYPE_COLORS } from '../nodeConfig';

// ==================== Node Type Metadata ====================
const NODE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    execution: { label: '执行', icon: <ThunderboltOutlined />, color: NODE_TYPE_COLORS.execution },
    approval: { label: '审批', icon: <AuditOutlined />, color: NODE_TYPE_COLORS.approval },
    condition: { label: '条件', icon: <ForkOutlined />, color: NODE_TYPE_COLORS.condition },
    notification: { label: '通知', icon: <BellOutlined />, color: NODE_TYPE_COLORS.notification },
    host_extractor: { label: '主机提取', icon: <ApiOutlined />, color: NODE_TYPE_COLORS.host_extractor },
    cmdb_validator: { label: 'CMDB验证', icon: <EyeOutlined />, color: NODE_TYPE_COLORS.cmdb_validator },
    compute: { label: '计算', icon: <NodeIndexOutlined />, color: NODE_TYPE_COLORS.compute },
};

/** 统计流程中有意义的节点 (排除 start/end) */
const countNodes = (nodes: AutoHealing.FlowNode[]) => {
    const counts: Record<string, number> = {};
    let functional = 0;
    for (const n of nodes) {
        if (n.type === 'start' || n.type === 'end') continue;
        counts[n.type] = (counts[n.type] || 0) + 1;
        functional++;
    }
    return { counts, functional };
};

const PAGE_SIZE = 15;

// ==================== Component ====================
const FlowSelector: React.FC<FlowSelectorProps> = ({ open, value, onSelect, onCancel }) => {
    // Data
    const [flows, setFlows] = useState<AutoHealing.HealingFlow[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // Selection
    const [selectedId, setSelectedId] = useState<string | undefined>(value);
    const [selectedFlow, setSelectedFlow] = useState<AutoHealing.HealingFlow | null>(null);

    // Debounce ref
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // ==================== Load (server-side) ====================
    const loadFlows = useCallback(async (p: number, q: string, status?: string) => {
        setLoading(true);
        try {
            const params: any = { page: p, page_size: PAGE_SIZE };
            if (status === 'active') params.is_active = true;
            else if (status === 'inactive') params.is_active = false;
            if (q.trim()) params.name = q.trim();
            const res = await getFlows(params);
            setFlows(res.data || []);
            setTotal(res.total || 0);
        } catch { /* */ } finally {
            setLoading(false);
        }
    }, []);

    // Initial load & filter changes
    useEffect(() => {
        if (open) {
            loadFlows(page, search, statusFilter);
        } else {
            // Reset on close
            setSearch('');
            setStatusFilter(undefined);
            setPage(1);
        }
    }, [open, page, statusFilter]);

    // Debounced search
    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            loadFlows(1, val, statusFilter);
        }, 300);
    };

    // Sync value prop
    useEffect(() => {
        setSelectedId(value);
    }, [value]);

    // Pre-select flow from value
    useEffect(() => {
        if (value && flows.length > 0) {
            const found = flows.find(f => f.id === value);
            if (found) {
                setSelectedFlow(found);
                setSelectedId(value);
            }
        }
    }, [value, flows]);

    // ==================== Handlers ====================
    const handleSelect = (flow: AutoHealing.HealingFlow) => {
        setSelectedId(flow.id);
        setSelectedFlow(flow);
    };

    const handleConfirm = () => {
        if (selectedId && selectedFlow) {
            onSelect(selectedId, selectedFlow);
        }
    };

    const handleStatusChange = (val: string | undefined) => {
        setStatusFilter(val);
        setPage(1);
    };

    const handlePageChange = (p: number) => {
        setPage(p);
    };

    // ==================== Render ====================
    return (
        <Modal
            title={
                <Space>
                    <BranchesOutlined />
                    选择自愈流程
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="确定选择"
            okButtonProps={{ disabled: !selectedId || !selectedFlow }}
            width={720}
            destroyOnHidden
        >
            {/* ===== Search & Filter Bar ===== */}
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={14}>
                    <Input
                        placeholder="搜索流程名称或描述"
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={10}>
                    <Select
                        placeholder="状态筛选"
                        value={statusFilter}
                        onChange={handleStatusChange}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '仅启用', value: 'active' },
                            { label: '仅停用', value: 'inactive' },
                        ]}
                    />
                </Col>
            </Row>

            {/* ===== Count ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <NodeIndexOutlined style={{ marginRight: 4 }} />自愈流程列表
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {total} 个
                </Text>
            </div>

            {/* ===== Flow List ===== */}
            <div style={{ height: 380, overflow: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" tip="加载流程..."><div /></Spin>
                    </div>
                ) : flows.length === 0 ? (
                    <Empty
                        description={search ? '没有匹配的流程' : '暂无自愈流程'}
                        style={{ marginTop: 100 }}
                    />
                ) : (
                    <div>
                        {flows.map(flow => {
                            const isSelected = flow.id === selectedId;
                            const { counts: nodeCounts, functional: functionalCount } = countNodes(flow.nodes || []);
                            const nodeTypes = Object.entries(nodeCounts);
                            const totalEdges = (flow.edges || []).length;

                            return (
                                <div
                                    key={flow.id}
                                    onClick={() => handleSelect(flow)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? '#e6f7ff' : 'transparent',
                                        opacity: flow.is_active ? 1 : 0.6,
                                        borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                        padding: '10px 12px',
                                        marginBottom: 4,
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ width: '100%' }}>
                                        {/* Row 1: Status + Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            {flow.is_active ? (
                                                <Badge status="success" />
                                            ) : (
                                                <Badge status="default" />
                                            )}
                                            <Text strong style={{ fontSize: 13 }}>
                                                {flow.name}
                                            </Text>
                                            {!flow.is_active && (
                                                <Tooltip title="此流程已停用，选中后规则无法自动触发">
                                                    <Tag color="default" style={{ fontSize: 10 }}>已停用</Tag>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* Row 2: Description */}
                                        {flow.description && (
                                            <div style={{ marginLeft: 14, marginBottom: 6 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {flow.description}
                                                </Text>
                                            </div>
                                        )}

                                        {/* Row 3: Node tags + time */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginLeft: 14,
                                            flexWrap: 'wrap',
                                            gap: 4,
                                        }}>
                                            <Space size={4} wrap>
                                                {nodeTypes.map(([type, count]) => {
                                                    const meta = NODE_TYPE_META[type] || {
                                                        label: type, icon: <NodeIndexOutlined />, color: '#8c8c8c',
                                                    };
                                                    return (
                                                        <Tag
                                                            key={type}
                                                            icon={meta.icon}
                                                            style={{
                                                                fontSize: 10,
                                                                lineHeight: '16px',
                                                                padding: '0 4px',
                                                                margin: 0,
                                                                color: meta.color,
                                                                borderColor: meta.color,
                                                                background: 'transparent',
                                                            }}
                                                        >
                                                            {meta.label}×{count}
                                                        </Tag>
                                                    );
                                                })}
                                                {nodeTypes.length === 0 && (
                                                    <Tag style={{ fontSize: 10, margin: 0, color: '#bfbfbf' }}>
                                                        空流程
                                                    </Tag>
                                                )}
                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                    ({functionalCount}节点 · {totalEdges}连线)
                                                </Text>
                                            </Space>

                                            <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                                                <ClockCircleOutlined style={{ marginRight: 2 }} />
                                                {flow.updated_at
                                                    ? dayjs(flow.updated_at).fromNow()
                                                    : dayjs(flow.created_at).fromNow()}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ===== Pagination ===== */}
            {total > PAGE_SIZE && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Pagination
                        size="small"
                        current={page}
                        pageSize={PAGE_SIZE}
                        total={total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showTotal={(t) => `共 ${t} 条`}
                    />
                </div>
            )}

            {/* ===== Selected Hint ===== */}
            {selectedFlow && (
                <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: '#e6f7ff',
                    border: '1px solid #91d5ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}>
                    <CheckCircleOutlined style={{ color: '#1890ff' }} />
                    <Text strong>已选择：</Text>
                    <Text>{selectedFlow.name}</Text>
                    {!selectedFlow.is_active && (
                        <Tag color="warning" style={{ margin: 0 }}>已停用</Tag>
                    )}
                </div>
            )}
        </Modal>
    );
};

export default FlowSelector;
