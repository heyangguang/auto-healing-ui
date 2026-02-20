import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Modal, Input, Typography, Tag, Empty, Spin, Space, Row, Col,
    Select, Badge, Tooltip, Pagination,
} from 'antd';
import {
    SearchOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined,
    LoadingOutlined, DatabaseOutlined, DesktopOutlined, UserOutlined,
} from '@ant-design/icons';
import { getIncidents } from '@/services/auto-healing/incidents';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

// ==================== Types ====================
interface IncidentSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (incident: AutoHealing.Incident) => void;
    onCancel: () => void;
}

// ==================== Severity Metadata ====================
const SEVERITY_META: Record<string, { label: string; color: string }> = {
    critical: { label: '严重', color: '#cf1322' },
    high: { label: '高', color: '#fa541c' },
    medium: { label: '中', color: '#faad14' },
    low: { label: '低', color: '#1890ff' },
    info: { label: '信息', color: '#8c8c8c' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
    open: { label: '打开', color: 'blue' },
    in_progress: { label: '处理中', color: 'processing' },
    resolved: { label: '已解决', color: 'success' },
    closed: { label: '已关闭', color: 'default' },
};

const HEALING_STATUS_META: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'default' },
    matched: { label: '已匹配', color: 'processing' },
    healing: { label: '自愈中', color: 'blue' },
    healed: { label: '已自愈', color: 'success' },
    failed: { label: '自愈失败', color: 'error' },
    skipped: { label: '已跳过', color: 'default' },
};

const PAGE_SIZE = 15;

// ==================== Component ====================
const IncidentSelector: React.FC<IncidentSelectorProps> = ({ open, value, onSelect, onCancel }) => {
    // Data
    const [incidents, setIncidents] = useState<AutoHealing.Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Filters
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // Selection
    const [selectedId, setSelectedId] = useState<string | undefined>(value);
    const [selectedIncident, setSelectedIncident] = useState<AutoHealing.Incident | null>(null);

    // Debounce ref
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // ==================== Load (server-side) ====================
    const loadIncidents = useCallback(async (p: number, q: string, severity?: string, status?: string) => {
        setLoading(true);
        try {
            const params: any = { page: p, page_size: PAGE_SIZE };
            if (q.trim()) params.search = q.trim();
            if (severity) params.severity = severity;
            if (status) params.status = status;
            const res = await getIncidents(params);
            setIncidents(res.data || []);
            setTotal(res.total || 0);
        } catch { /* */ } finally {
            setLoading(false);
        }
    }, []);

    // Initial load & filter changes
    useEffect(() => {
        if (open) {
            loadIncidents(page, search, severityFilter, statusFilter);
        } else {
            setSearch('');
            setSeverityFilter(undefined);
            setStatusFilter(undefined);
            setPage(1);
        }
    }, [open, page, severityFilter, statusFilter]);

    // Debounced search
    const handleSearchChange = (val: string) => {
        setSearch(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            loadIncidents(1, val, severityFilter, statusFilter);
        }, 300);
    };

    // Sync value prop
    useEffect(() => {
        setSelectedId(value);
    }, [value]);

    // Pre-select from value
    useEffect(() => {
        if (value && incidents.length > 0) {
            const found = incidents.find(i => i.id === value);
            if (found) {
                setSelectedIncident(found);
                setSelectedId(value);
            }
        }
    }, [value, incidents]);

    // ==================== Handlers ====================
    const handleSelect = (incident: AutoHealing.Incident) => {
        setSelectedId(incident.id);
        setSelectedIncident(incident);
    };

    const handleConfirm = () => {
        if (selectedIncident) {
            onSelect(selectedIncident);
        }
    };

    const handleFilterChange = (type: 'severity' | 'status', val: string | undefined) => {
        if (type === 'severity') setSeverityFilter(val);
        else setStatusFilter(val);
        setPage(1);
    };

    // ==================== Render ====================
    return (
        <Modal
            title={
                <Space>
                    <DatabaseOutlined />
                    选择工单
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="确定选择"
            okButtonProps={{ disabled: !selectedIncident }}
            width={780}
            destroyOnHidden
        >
            {/* ===== Search & Filter Bar ===== */}
            <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={10}>
                    <Input
                        placeholder="搜索工单标题、描述..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        allowClear
                    />
                </Col>
                <Col span={7}>
                    <Select
                        placeholder="严重级别"
                        value={severityFilter}
                        onChange={v => handleFilterChange('severity', v)}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '严重 (Critical)', value: 'critical' },
                            { label: '高 (High)', value: 'high' },
                            { label: '中 (Medium)', value: 'medium' },
                            { label: '低 (Low)', value: 'low' },
                        ]}
                    />
                </Col>
                <Col span={7}>
                    <Select
                        placeholder="工单状态"
                        value={statusFilter}
                        onChange={v => handleFilterChange('status', v)}
                        allowClear
                        style={{ width: '100%' }}
                        options={[
                            { label: '打开', value: 'open' },
                            { label: '处理中', value: 'in_progress' },
                            { label: '已解决', value: 'resolved' },
                            { label: '已关闭', value: 'closed' },
                        ]}
                    />
                </Col>
            </Row>

            {/* ===== Count ===== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <AlertOutlined style={{ marginRight: 4 }} />工单列表
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {total} 条
                </Text>
            </div>

            {/* ===== Incident List ===== */}
            <div style={{ height: 400, overflow: 'auto' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin size="large" tip="加载工单..."><div /></Spin>
                    </div>
                ) : incidents.length === 0 ? (
                    <Empty
                        description={search ? '没有匹配的工单' : '暂无工单'}
                        style={{ marginTop: 100 }}
                    />
                ) : (
                    <div>
                        {incidents.map(incident => {
                            const isSelected = incident.id === selectedId;
                            const sevMeta = SEVERITY_META[incident.severity] || { label: incident.severity, color: '#8c8c8c' };
                            const statusMeta = STATUS_META[incident.status] || { label: incident.status, color: 'default' };
                            const healMeta = HEALING_STATUS_META[incident.healing_status] || null;

                            return (
                                <div
                                    key={incident.id}
                                    onClick={() => handleSelect(incident)}
                                    style={{
                                        cursor: 'pointer',
                                        background: isSelected ? '#e6f7ff' : 'transparent',
                                        borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                        padding: '8px 12px',
                                        marginBottom: 4,
                                        borderBottom: '1px solid #f0f0f0',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ width: '100%' }}>
                                        {/* Row 1: Severity + Title + Status */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                            <Tag
                                                color={sevMeta.color}
                                                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 0 }}
                                            >
                                                {sevMeta.label}
                                            </Tag>
                                            <Text
                                                strong
                                                style={{ fontSize: 13, flex: 1 }}
                                                ellipsis={{ tooltip: incident.title }}
                                            >
                                                {incident.title}
                                            </Text>
                                            <Tag
                                                color={statusMeta.color}
                                                style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 0 }}
                                            >
                                                {statusMeta.label}
                                            </Tag>
                                            {healMeta && (
                                                <Tag
                                                    color={healMeta.color}
                                                    style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0, borderRadius: 0 }}
                                                >
                                                    {healMeta.label}
                                                </Tag>
                                            )}
                                        </div>

                                        {/* Row 2: Description */}
                                        {incident.description && (
                                            <div style={{ marginLeft: 14, marginBottom: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: incident.description }}>
                                                    {incident.description}
                                                </Text>
                                            </div>
                                        )}

                                        {/* Row 3: Meta — CI / Category / Source / Time */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginLeft: 14,
                                            flexWrap: 'wrap',
                                            gap: 4,
                                        }}>
                                            <Space size={8} wrap style={{ fontSize: 10, color: '#8c8c8c' }}>
                                                {incident.affected_ci && (
                                                    <span>
                                                        <DesktopOutlined style={{ marginRight: 2 }} />
                                                        {incident.affected_ci}
                                                    </span>
                                                )}
                                                {incident.category && (
                                                    <Tag style={{ fontSize: 10, margin: 0, padding: '0 3px', lineHeight: '14px' }}>
                                                        {incident.category}
                                                    </Tag>
                                                )}
                                                {incident.source_plugin_name && (
                                                    <span style={{ color: '#bfbfbf' }}>
                                                        来源: {incident.source_plugin_name}
                                                    </span>
                                                )}
                                            </Space>

                                            <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>
                                                <ClockCircleOutlined style={{ marginRight: 2 }} />
                                                {dayjs(incident.created_at).fromNow()}
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
                        onChange={p => setPage(p)}
                        showSizeChanger={false}
                        showTotal={(t) => `共 ${t} 条`}
                    />
                </div>
            )}

            {/* ===== Selected Hint ===== */}
            {selectedIncident && (
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
                    <Text ellipsis style={{ flex: 1 }}>{selectedIncident.title}</Text>
                    <Tag
                        color={(SEVERITY_META[selectedIncident.severity] || { color: '#8c8c8c' }).color}
                        style={{ margin: 0, fontSize: 10, borderRadius: 0 }}
                    >
                        {(SEVERITY_META[selectedIncident.severity] || { label: selectedIncident.severity }).label}
                    </Tag>
                </div>
            )}
        </Modal>
    );
};

export default IncidentSelector;
