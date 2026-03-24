import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    Button, message, Space, Typography, Switch, Popconfirm, Drawer, Badge, Tooltip,
    Row, Col, Spin, Empty, Pagination, Tag,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, EditOutlined, DeploymentUnitOutlined,
    CheckCircleOutlined, CloseCircleOutlined,
    CodeOutlined, BellOutlined, AuditOutlined, CloudServerOutlined,
    SafetyCertificateOutlined, FunctionOutlined, ClockCircleOutlined,
    PartitionOutlined, BranchesOutlined, SettingOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { SearchField, AdvancedSearchField } from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import { getFlows, deleteFlow, updateFlow, getFlowStats } from '@/services/auto-healing/healing';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import './flows.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;
import { NODE_TYPE_COLORS, NODE_TYPE_LABELS as _NODE_TYPE_LABELS } from '../nodeConfig';

// ==================== Constants ====================
// 组合 nodeConfig 的标签和颜色，供流程卡片、Detail Drawer 使用
const NODE_TYPE_LABELS: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(_NODE_TYPE_LABELS)
        .filter(([k]) => k !== 'start' && k !== 'end')
        .map(([k, label]) => [k, { label, color: NODE_TYPE_COLORS[k] || '#8c8c8c' }])
);

// ==================== Search Fields ====================
const searchFields: SearchField[] = [
    { key: 'name', label: '名称', placeholder: '输入流程名称搜索' },
    { key: 'description', label: '描述', placeholder: '输入描述关键字搜索' },
    {
        key: '__enum__is_active', label: '流程状态',
        description: '筛选流程启用/停用状态',
        options: [
            { label: '已启用', value: 'true' },
            { label: '已停用', value: 'false' },
        ],
    },
    {
        key: '__enum__node_type', label: '节点类型',
        description: '筛选包含指定节点类型的流程',
        options: [
            { label: '执行节点', value: 'execution' },
            { label: '审批节点', value: 'approval' },
            { label: '通知节点', value: 'notification' },
            { label: '条件节点', value: 'condition' },
            { label: '主机提取', value: 'host_extractor' },
            { label: 'CMDB校验', value: 'cmdb_validator' },
            { label: '变量设置', value: 'set_variable' },
        ],
    },
    {
        key: '__enum__node_count', label: '节点数量',
        description: '按流程包含的节点数量范围筛选',
        options: [
            { label: '少量 (≤3)', value: 'few' },
            { label: '中等 (4-6)', value: 'medium' },
            { label: '大量 (≥7)', value: 'many' },
        ],
    },
];

// ==================== Advanced Search Fields ====================
const advancedSearchFields: AdvancedSearchField[] = [
    {
        key: 'node_type', label: '节点类型', type: 'select',
        description: '筛选包含指定节点类型的流程',
        options: [
            { label: '执行节点', value: 'execution' },
            { label: '审批节点', value: 'approval' },
            { label: '通知节点', value: 'notification' },
            { label: '条件节点', value: 'condition' },
            { label: '主机提取', value: 'host_extractor' },
            { label: 'CMDB校验', value: 'cmdb_validator' },
            { label: '变量设置', value: 'set_variable' },
        ],
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
    { key: 'updated_at', label: '更新时间', type: 'dateRange' },
];

// ==================== Sort Options ====================
const SORT_OPTIONS = [
    { value: 'created_at', label: '创建时间' },
    { value: 'updated_at', label: '更新时间' },
    { value: 'name', label: '名称' },
];

// ==================== Helpers ====================
const getNodeIcon = (type: string) => {
    const style = { fontSize: 13 };
    const color = NODE_TYPE_LABELS[type]?.color || '#595959';
    switch (type) {
        case 'execution': return <CodeOutlined style={{ ...style, color }} />;
        case 'approval': return <AuditOutlined style={{ ...style, color }} />;
        case 'notification': return <BellOutlined style={{ ...style, color }} />;
        case 'host_extractor': return <CloudServerOutlined style={{ ...style, color }} />;
        case 'cmdb_validator': return <SafetyCertificateOutlined style={{ ...style, color }} />;
        case 'condition': return <BranchesOutlined style={{ ...style, color }} />;
        case 'set_variable': return <SettingOutlined style={{ ...style, color }} />;
        default: return <FunctionOutlined style={{ ...style, color }} />;
    }
};

// ==================== Main Page ====================
const HealingFlowsPage: React.FC = () => {
    const access = useAccess();

    // Data
    const [flows, setFlows] = useState<AutoHealing.HealingFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(16);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState<{
        total: number; active_count: number; inactive_count: number;
    } | null>(null);

    // Sort
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Search/Filter
    const searchParamsRef = useRef<Record<string, any>>({});

    // Detail Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [selectedFlow, setSelectedFlow] = useState<AutoHealing.HealingFlow | null>(null);

    // ==================== Stats ====================
    const loadStats = useCallback(async () => {
        try {
            const res = await getFlowStats();
            setStats(res?.data || null);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadStats(); }, [loadStats]);

    // ==================== Param Builder ====================
    const buildApiParams = useCallback((sp: Record<string, any>, p: number, ps: number) => {
        const params: any = { page: p, page_size: ps, sort_by: sortBy, sort_order: sortOrder };
        if (sp.name) params.name = sp.name;
        if (sp.name__exact) params.name__exact = sp.name__exact;
        if (sp.description) params.description = sp.description;
        if (sp.description__exact) params.description__exact = sp.description__exact;
        if (sp.is_active !== undefined && sp.is_active !== '') {
            params.is_active = sp.is_active === 'true';
        }
        if (sp.node_type) params.node_type = sp.node_type;
        // 节点数量范围 (enum → min_nodes/max_nodes)
        if (sp.node_count) {
            if (sp.node_count === 'few') { params.max_nodes = 3; }
            else if (sp.node_count === 'medium') { params.min_nodes = 4; params.max_nodes = 6; }
            else if (sp.node_count === 'many') { params.min_nodes = 7; }
        }
        if (sp.created_at) {
            const [from, to] = sp.created_at;
            if (from) params.created_from = toDayRangeStartISO(from);
            if (to) params.created_to = toDayRangeEndISO(to);
        }
        if (sp.updated_at) {
            const [from, to] = sp.updated_at;
            if (from) params.updated_from = toDayRangeStartISO(from);
            if (to) params.updated_to = toDayRangeEndISO(to);
        }
        return params;
    }, [sortBy, sortOrder]);

    // ==================== Data Loading ====================
    const loadFlows = useCallback(async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const params = buildApiParams(searchParamsRef.current, p, ps);
            const res = await getFlows(params);
            setFlows(res.data || []);
            setTotal(res.total || 0);
        } catch {
            // handled by global handler
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, buildApiParams]);

    useEffect(() => { loadFlows(); }, [loadFlows]);

    // ==================== Search callback ====================
    const handleSearch = useCallback((params: any) => {
        const merged: Record<string, any> = {};
        if (params.advancedSearch) {
            Object.assign(merged, params.advancedSearch);
        }
        if (params.filters) {
            for (const f of params.filters) {
                const key = f.field.replace(/^__enum__/, '');
                merged[key] = f.value;
            }
        }
        searchParamsRef.current = merged;
        setPage(1);
        (async () => {
            setLoading(true);
            try {
                const apiParams = buildApiParams(merged, 1, pageSize);
                const res = await getFlows(apiParams);
                setFlows(res.data || []);
                setTotal(res.total || 0);
            } catch { /* */ } finally { setLoading(false); }
        })();
    }, [pageSize, buildApiParams]);

    // ==================== Actions ====================
    const handleToggle = async (flow: AutoHealing.HealingFlow, checked: boolean) => {
        const originalActive = flow.is_active;
        setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, is_active: checked } : f));
        setActionLoading(flow.id);
        try {
            await updateFlow(flow.id, { is_active: checked });
            message.success(checked ? '流程已启用' : '流程已停用');
        } catch {
            setFlows(prev => prev.map(f => f.id === flow.id ? { ...f, is_active: originalActive } : f));
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    const handleDelete = async (e: React.MouseEvent | undefined, flow: AutoHealing.HealingFlow) => {
        e?.stopPropagation();
        const prevFlows = flows;
        const prevTotal = total;
        setFlows(prev => prev.filter(f => f.id !== flow.id));
        setTotal(prev => prev - 1);
        if (selectedFlow?.id === flow.id) {
            setDrawerOpen(false);
            setSelectedFlow(null);
        }
        setActionLoading(flow.id);
        try {
            await deleteFlow(flow.id);
            message.success('流程已删除');
        } catch {
            setFlows(prevFlows);
            setTotal(prevTotal);
        } finally {
            setActionLoading(null);
            loadStats();
        }
    };

    // ==================== Card Click → Detail Drawer ====================
    const handleCardClick = (flow: AutoHealing.HealingFlow) => {
        setSelectedFlow(flow);
        setDrawerOpen(true);
    };

    // ==================== Node Preview (核心特色 - 保留) ====================
    const renderNodePreview = (nodes: AutoHealing.FlowNode[]) => {
        const allNodes = (nodes || []).filter(n => n.type !== 'start' && n.type !== 'end');

        let displayNodes = allNodes;
        let hiddenCount = 0;

        if (allNodes.length > 5) {
            displayNodes = [...allNodes.slice(0, 3), ...allNodes.slice(-1)];
            hiddenCount = allNodes.length - 4;
        }

        return (
            <div className="flow-card-node-preview">
                {displayNodes.map((node, idx) => (
                    <React.Fragment key={idx}>
                        <Tooltip title={`${NODE_TYPE_LABELS[node.type]?.label || node.type}: ${node.name || node.config?.label || ''}`}>
                            <div className="flow-card-node-icon">
                                {getNodeIcon(node.type)}
                            </div>
                        </Tooltip>
                        {idx === 2 && hiddenCount > 0 && (
                            <span className="flow-card-node-more">+{hiddenCount}</span>
                        )}
                        {idx < displayNodes.length - 1 && idx !== 2 && (
                            <div className="flow-card-node-connector" />
                        )}
                    </React.Fragment>
                ))}
                {allNodes.length === 0 && <Text type="secondary" style={{ fontSize: 11 }}>暂无节点</Text>}
            </div>
        );
    };

    // ==================== Node Type Summary ====================
    const getNodeTypeSummary = (nodes: AutoHealing.FlowNode[]) => {
        const types = (nodes || []).filter(n => n.type !== 'start' && n.type !== 'end');
        const counts: Record<string, number> = {};
        for (const n of types) {
            counts[n.type] = (counts[n.type] || 0) + 1;
        }
        return counts;
    };

    // ==================== Flow Card ====================
    const renderFlowCard = (flow: AutoHealing.HealingFlow) => {
        const nodeCount = (flow.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end').length;
        const edgeCount = (flow.edges || []).length;

        const cardClass = [
            'flow-card',
            flow.is_active ? 'flow-card-active' : 'flow-card-inactive',
        ].filter(Boolean).join(' ');

        return (
            <Col key={flow.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                <div className={cardClass} onClick={() => handleCardClick(flow)}>
                    <div className="flow-card-body">
                        {/* 标题 + 状态 */}
                        <div className="flow-card-header">
                            <div className="flow-card-title">
                                {flow.name || '未命名流程'}
                            </div>
                            <Space size={4}>
                                {flow.is_active ? (
                                    <span className="flow-card-status-active">
                                        <CheckCircleOutlined /> 启用
                                    </span>
                                ) : (
                                    <span className="flow-card-status-inactive">已停用</span>
                                )}
                            </Space>
                        </div>

                        {/* 描述 */}
                        <div className="flow-card-desc">
                            {flow.description || '未添加描述'}
                        </div>

                        {/* 节点管线预览 — 核心特色 */}
                        {renderNodePreview(flow.nodes || [])}

                        {/* 2x2 信息网格 */}
                        <div className="flow-card-info-grid">
                            <span className="flow-card-info-item">
                                <PartitionOutlined />
                                <span className="info-value">{nodeCount}</span> 节点
                            </span>
                            <span className="flow-card-info-item">
                                <BranchesOutlined />
                                <span className="info-value">{edgeCount}</span> 连线
                            </span>
                            <span className="flow-card-info-item">
                                <ClockCircleOutlined />
                                创建 {flow.created_at
                                    ? dayjs(flow.created_at).format('MM/DD')
                                    : '-'}
                            </span>
                            <span className="flow-card-info-item">
                                <ClockCircleOutlined />
                                更新 {flow.updated_at
                                    ? dayjs(flow.updated_at).fromNow()
                                    : '-'}
                            </span>
                        </div>

                        {/* 底部 */}
                        <div className="flow-card-footer">
                            <span className="flow-card-footer-left">
                                ID: {flow.id?.substring(0, 8)}...
                            </span>
                            <Space size={0} onClick={e => e.stopPropagation()}>
                                <Tooltip title={flow.is_active ? '停用' : '启用'}>
                                    <Switch
                                        size="small"
                                        checked={flow.is_active}
                                        loading={actionLoading === flow.id}
                                        onChange={(c) => handleToggle(flow, c)}
                                        disabled={!access.canUpdateFlow}
                                    />
                                </Tooltip>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    disabled={!access.canUpdateFlow}
                                    onClick={() => history.push(`/healing/flows/editor/${flow.id}`)}
                                />
                                <Popconfirm
                                    title="确定删除此流程？"
                                    description="删除后无法恢复"
                                    onConfirm={(e) => handleDelete(e as any, flow)}
                                >
                                    <Button
                                        type="text"
                                        danger
                                        size="small"
                                        icon={<DeleteOutlined />}
                                        loading={actionLoading === flow.id}
                                        disabled={!access.canDeleteFlow}
                                    />
                                </Popconfirm>
                            </Space>
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    // ==================== Detail Drawer ====================

    const renderDetailDrawer = () => {
        if (!selectedFlow) return null;
        const nodeTypes = getNodeTypeSummary(selectedFlow.nodes);
        const allNodes = (selectedFlow.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end');

        return (
            <Drawer
                title={
                    <Space>
                        <DeploymentUnitOutlined />
                        {selectedFlow.name}
                        {selectedFlow.is_active
                            ? <Badge status="processing" text={<Text style={{ fontSize: 12 }}>运行中</Text>} />
                            : <Tag>已停用</Tag>
                        }
                    </Space>
                }
                size={600}
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelectedFlow(null); }}
                destroyOnHidden
                extra={
                    <Button
                        icon={<EditOutlined />}
                        disabled={!access.canUpdateFlow}
                        onClick={() => {
                            setDrawerOpen(false);
                            history.push(`/healing/flows/editor/${selectedFlow.id}`);
                        }}
                    >
                        编辑
                    </Button>
                }
            >
                {/* 基础信息 */}
                <div className="flow-detail-card">
                    <h4><DeploymentUnitOutlined />基础信息</h4>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">流程名称</span>
                        <span className="flow-detail-value">{selectedFlow.name}</span>
                    </div>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">描述</span>
                        <span className="flow-detail-value">{selectedFlow.description || '-'}</span>
                    </div>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">状态</span>
                        <span className="flow-detail-value">
                            {selectedFlow.is_active
                                ? <Badge status="success" text="启用" />
                                : <Badge status="default" text="停用" />}
                        </span>
                    </div>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">节点总数</span>
                        <span className="flow-detail-value">{(selectedFlow.nodes || []).length}</span>
                    </div>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">连线总数</span>
                        <span className="flow-detail-value">{(selectedFlow.edges || []).length}</span>
                    </div>
                    <div className="flow-detail-row">
                        <span className="flow-detail-label">创建时间</span>
                        <span className="flow-detail-value">{dayjs(selectedFlow.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                    </div>
                    {selectedFlow.updated_at && (
                        <div className="flow-detail-row">
                            <span className="flow-detail-label">更新时间</span>
                            <span className="flow-detail-value">{dayjs(selectedFlow.updated_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                        </div>
                    )}
                </div>

                {/* 节点类型概要 */}
                <div className="flow-detail-card">
                    <h4><PartitionOutlined />节点类型概要</h4>
                    {Object.keys(nodeTypes).length === 0 ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>无功能节点</Text>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(nodeTypes).map(([type, count]) => (
                                <Tag key={type} icon={getNodeIcon(type)} style={{ margin: 0 }}>
                                    {NODE_TYPE_LABELS[type]?.label || type} × {count}
                                </Tag>
                            ))}
                        </div>
                    )}
                </div>

                {/* 节点详情 */}
                <div className="flow-detail-card">
                    <h4><BranchesOutlined />节点详情 ({allNodes.length})</h4>
                    <div className="flow-detail-node-list">
                        {allNodes.map((node, idx) => {
                            const cfg = node.config || {};
                            const typeInfo = NODE_TYPE_LABELS[node.type];
                            return (
                                <div key={idx} className="flow-node-detail-card">
                                    {/* 节点头部 */}
                                    <div className="flow-node-detail-header">
                                        <span className="flow-node-detail-icon" style={{ color: typeInfo?.color || '#8c8c8c' }}>
                                            {getNodeIcon(node.type)}
                                        </span>
                                        <div className="flow-node-detail-title">
                                            <span className="flow-node-detail-name">{node.name || cfg.label || node.id}</span>
                                            <Tag color={typeInfo?.color} style={{ margin: 0, fontSize: 10 }}>{typeInfo?.label || node.type}</Tag>
                                        </div>
                                    </div>

                                    {/* 按类型展示配置详情 */}
                                    <div className="flow-node-detail-content">
                                        {node.type === 'execution' && (
                                            <>
                                                <div className="flow-node-detail-row">
                                                    <span className="flow-node-detail-label">任务模板</span>
                                                    <span className="flow-node-detail-val">
                                                        {cfg.task_template_id ? (
                                                            cfg.task_template_name ? (
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); history.push(`/execution/templates/${cfg.task_template_id}`); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {cfg.task_template_name}
                                                                </a>
                                                            ) : (
                                                                <Tag color="error" style={{ margin: 0, fontSize: 10 }}>已删除</Tag>
                                                            )
                                                        ) : (
                                                            <span style={{ color: '#faad14', fontSize: 11 }}>⚠ 未配置</span>
                                                        )}
                                                    </span>
                                                </div>
                                                {cfg.task_template_id && (
                                                    <>
                                                        {cfg.executor_type && (
                                                            <div className="flow-node-detail-row">
                                                                <span className="flow-node-detail-label">执行器类型</span>
                                                                <span className="flow-node-detail-val">{cfg.executor_type}</span>
                                                            </div>
                                                        )}
                                                        {cfg.hosts_key && (
                                                            <div className="flow-node-detail-row">
                                                                <span className="flow-node-detail-label">主机变量</span>
                                                                <span className="flow-node-detail-val"><code>{cfg.hosts_key}</code></span>
                                                            </div>
                                                        )}
                                                        {cfg.extra_vars && Object.keys(cfg.extra_vars).length > 0 && (
                                                            <div className="flow-node-detail-row">
                                                                <span className="flow-node-detail-label">额外参数</span>
                                                                <span className="flow-node-detail-val">
                                                                    {Object.entries(cfg.extra_vars).map(([k, v]) => (
                                                                        <Tag key={k} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{k}={String(v)}</Tag>
                                                                    ))}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {cfg.variable_mappings && Object.keys(cfg.variable_mappings).length > 0 && (
                                                            <div className="flow-node-detail-row">
                                                                <span className="flow-node-detail-label">变量映射</span>
                                                                <span className="flow-node-detail-val">
                                                                    {Object.entries(cfg.variable_mappings).map(([k, v]) => (
                                                                        <span key={k} style={{ display: 'block', fontSize: 11 }}>
                                                                            <code>{k}</code> ← <code>{String(v)}</code>
                                                                        </span>
                                                                    ))}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {node.type === 'approval' && (
                                            <>
                                                {cfg.title && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">审批标题</span>
                                                        <span className="flow-node-detail-val">{cfg.title}</span>
                                                    </div>
                                                )}
                                                {cfg.description && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">描述</span>
                                                        <span className="flow-node-detail-val">{cfg.description}</span>
                                                    </div>
                                                )}
                                                {cfg.approvers && cfg.approvers.length > 0 && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">审批人</span>
                                                        <span className="flow-node-detail-val">
                                                            {cfg.approvers.map((a: string) => <Tag key={a} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{a}</Tag>)}
                                                        </span>
                                                    </div>
                                                )}
                                                {cfg.approver_roles && cfg.approver_roles.length > 0 && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">审批角色</span>
                                                        <span className="flow-node-detail-val">
                                                            {cfg.approver_roles.map((r: string) => <Tag key={r} color="blue" style={{ margin: '0 4px 2px 0', fontSize: 10 }}>{r}</Tag>)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flow-node-detail-row">
                                                    <span className="flow-node-detail-label">超时时间</span>
                                                    <span className="flow-node-detail-val">{cfg.timeout_hours || 24} 小时</span>
                                                </div>
                                            </>
                                        )}

                                        {node.type === 'notification' && (
                                            <>
                                                {cfg.template_id && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">通知模板</span>
                                                        <span className="flow-node-detail-val">
                                                            {cfg.template_name ? (
                                                                <a
                                                                    onClick={(e) => { e.stopPropagation(); history.push(`/notification/templates`); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    {cfg.template_name}
                                                                </a>
                                                            ) : (
                                                                <Tag color="error" style={{ margin: 0, fontSize: 10 }}>已删除</Tag>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                                {cfg.channel_ids && cfg.channel_ids.length > 0 && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">通知渠道</span>
                                                        <span className="flow-node-detail-val">
                                                            {cfg.channel_ids.map((chId: string) => (
                                                                <Tag key={chId} color={cfg.channel_names?.[chId] ? undefined : 'error'} style={{ margin: '0 4px 2px 0', fontSize: 10 }}>
                                                                    {cfg.channel_names?.[chId] || '已删除'}
                                                                </Tag>
                                                            ))}
                                                        </span>
                                                    </div>
                                                )}
                                                {!cfg.template_id && !cfg.channel_ids && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-val" style={{ color: '#faad14', fontSize: 11 }}>⚠ 未配置通知模板和通道</span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {node.type === 'condition' && (
                                            <>
                                                {cfg.condition && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">表达式</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.condition}</code></span>
                                                    </div>
                                                )}
                                                {cfg.true_target && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">✓ 分支</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.true_target}</code></span>
                                                    </div>
                                                )}
                                                {cfg.false_target && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">✗ 分支</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.false_target}</code></span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {node.type === 'host_extractor' && (
                                            <>
                                                <div className="flow-node-detail-row">
                                                    <span className="flow-node-detail-label">源字段</span>
                                                    <span className="flow-node-detail-val"><code>{cfg.source_field || '-'}</code></span>
                                                </div>
                                                <div className="flow-node-detail-row">
                                                    <span className="flow-node-detail-label">提取模式</span>
                                                    <span className="flow-node-detail-val">{cfg.extract_mode === 'regex' ? '正则表达式' : '分隔符拆分'}</span>
                                                </div>
                                                {cfg.split_by && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">分隔符</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.split_by}</code></span>
                                                    </div>
                                                )}
                                                {cfg.output_key && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">输出变量</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.output_key}</code></span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {node.type === 'cmdb_validator' && (
                                            <>
                                                {cfg.input_key && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">输入变量</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.input_key}</code></span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {node.type === 'compute' && cfg.operations && (
                                            <div className="flow-node-detail-row">
                                                <span className="flow-node-detail-label">运算</span>
                                                <span className="flow-node-detail-val">
                                                    {cfg.operations.map((op: any, i: number) => (
                                                        <span key={i} style={{ display: 'block', fontSize: 11 }}>
                                                            <code>{op.output_key}</code> = <code>{op.expression}</code>
                                                        </span>
                                                    ))}
                                                </span>
                                            </div>
                                        )}

                                        {node.type === 'set_variable' && (
                                            <>
                                                {cfg.key && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">变量名</span>
                                                        <span className="flow-node-detail-val"><code>{cfg.key}</code></span>
                                                    </div>
                                                )}
                                                {cfg.value !== undefined && (
                                                    <div className="flow-node-detail-row">
                                                        <span className="flow-node-detail-label">值</span>
                                                        <span className="flow-node-detail-val"><code>{typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : String(cfg.value)}</code></span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* start/end 不展示额外信息 */}
                                    </div>
                                </div>
                            );
                        })}
                        {allNodes.length === 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>暂无功能节点</Text>
                        )}
                    </div>
                </div>
            </Drawer>
        );
    };

    // ==================== Stats Bar ====================
    const statsBar = useMemo(() => {
        if (!stats) return null;
        const items = [
            { icon: <DeploymentUnitOutlined />, cls: 'total', val: stats.total, lbl: '总流程' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active_count, lbl: '启用' },
            { icon: <CloseCircleOutlined />, cls: 'error', val: stats.inactive_count, lbl: '停用' },
        ];
        return (
            <div className="git-stats-bar">
                {items.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="git-stat-divider" />}
                        <div className="git-stat-item">
                            <span className={`git-stat-icon git-stat-icon-${s.cls}`}>{s.icon}</span>
                            <div className="git-stat-content">
                                <div className="git-stat-value">{s.val}</div>
                                <div className="git-stat-label">{s.lbl}</div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    }, [stats]);

    // ==================== Sort Toolbar ====================
    const sortToolbar = useMemo(() => (
        <SortToolbar
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            options={SORT_OPTIONS}
        />
    ), [sortBy, sortOrder]);

    // ==================== Render ====================
    return (
        <>
            <StandardTable<AutoHealing.HealingFlow>
                tabs={[{ key: 'list', label: '流程列表' }]}
                title="自愈流程"
                description="可视化编排自动化修复流程，使用 DAG 引擎驱动执行节点、条件分支、审批和通知"
                headerIcon={
                    <DeploymentUnitOutlined style={{ fontSize: 28 }} />
                }
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                searchSchemaUrl="/api/v1/tenant/healing/flows/search-schema"
                onSearch={handleSearch}
                primaryActionLabel="新建流程"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateFlow}
                onPrimaryAction={() => history.push('/healing/flows/editor')}
                extraToolbarActions={sortToolbar}
            >
                {/* ===== Card Grid ===== */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 80 }}>
                        <Spin size="large" tip="加载自愈流程..."><div /></Spin>
                    </div>
                ) : flows.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无自愈流程</Text>}
                    >
                        <Button type="dashed" disabled={!access.canCreateFlow} onClick={() => history.push('/healing/flows/editor')}>
                            创建第一个流程
                        </Button>
                    </Empty>
                ) : (
                    <>
                        <Row gutter={[20, 20]} className="flows-grid">
                            {flows.map(renderFlowCard)}
                        </Row>

                        {/* ===== Pagination ===== */}
                        <div className="flows-pagination">
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={pageSize}
                                onChange={(p, size) => {
                                    setPage(p);
                                    setPageSize(size);
                                }}
                                showSizeChanger={{ showSearch: false }}
                                pageSizeOptions={['16', '24', '48']}
                                showQuickJumper
                                showTotal={t => `共 ${t} 条`}
                            />
                        </div>
                    </>
                )}
            </StandardTable>
            {renderDetailDrawer()}
        </>
    );
};

export default HealingFlowsPage;
