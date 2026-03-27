import React, { useMemo } from 'react';
import {
    Modal, Input, Typography, Tag, Empty, Spin, Space, Row, Col,
    Select, Pagination,
} from 'antd';
import {
    SearchOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined,DatabaseOutlined, DesktopOutlined, 
} from '@ant-design/icons';
import { getIncident, getIncidents, type IncidentQueryParams } from '@/services/auto-healing/incidents';
import { useAsyncModalSelector } from '@/hooks/useAsyncModalSelector';
import { INCIDENT_SEVERITY_MAP, INCIDENT_STATUS_MAP, INCIDENT_HEALING_MAP, getSeverityOptions, getIncidentStatusOptions } from '@/constants/incidentDicts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;
interface IncidentSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (incident: AutoHealing.Incident) => void;
    onCancel: () => void;
}
const SEVERITY_META: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(INCIDENT_SEVERITY_MAP).map(([k, v]) => [k, { label: v.text, color: v.color }])
);
const STATUS_META: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(INCIDENT_STATUS_MAP).map(([k, v]) => [k, { label: v.text, color: v.color }])
);
const HEALING_STATUS_META: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(INCIDENT_HEALING_MAP).map(([k, v]) => [k, { label: v.text, color: v.color }])
);

const PAGE_SIZE = 15;
const IncidentSelector: React.FC<IncidentSelectorProps> = ({ open, value, onSelect, onCancel }) => {
    const initialFilters = useMemo(() => ({
        severityFilter: undefined as string | undefined,
        statusFilter: undefined as string | undefined,
    }), []);
    const {
        items: incidents,
        loading,
        total,
        page,
        search,
        filters,
        selectedId,
        selectedItem: selectedIncident,
        handleSearchChange,
        handleFilterChange,
        handlePageChange,
        handleSelect,
    } = useAsyncModalSelector<AutoHealing.Incident, { severityFilter?: string; statusFilter?: string }>({
        open,
        value,
        initialFilters,
        loadList: async (p, q, currentFilters) => {
            const params: IncidentQueryParams = { page: p, page_size: PAGE_SIZE };
            if (q.trim()) params.title = q.trim();
            if (currentFilters.severityFilter) params.severity = currentFilters.severityFilter;
            if (currentFilters.statusFilter) params.status = currentFilters.statusFilter;
            const res = await getIncidents(params);
            return { items: res.data || [], total: res.total || 0 };
        },
        loadDetail: async (id) => {
            const incident = await getIncident(id);
            return incident || null;
        },
        getId: (item) => item.id,
    });
    const severityFilter = filters.severityFilter;
    const statusFilter = filters.statusFilter;

    const handleConfirm = () => {
        if (selectedIncident) {
            onSelect(selectedIncident);
        }
    };
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
                        onChange={(value) => handleFilterChange('severityFilter', value)}
                        allowClear
                        style={{ width: '100%' }}
                        options={getSeverityOptions()}
                    />
                </Col>
                <Col span={7}>
                    <Select
                        placeholder="工单状态"
                        value={statusFilter}
                        onChange={(value) => handleFilterChange('statusFilter', value)}
                        allowClear
                        style={{ width: '100%' }}
                        options={getIncidentStatusOptions()}
                    />
                </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <AlertOutlined style={{ marginRight: 4 }} />工单列表
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {total} 条
                </Text>
            </div>

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

                                        {incident.description && (
                                            <div style={{ marginLeft: 14, marginBottom: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 11 }} ellipsis={{ tooltip: incident.description }}>
                                                    {incident.description}
                                                </Text>
                                            </div>
                                        )}

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
