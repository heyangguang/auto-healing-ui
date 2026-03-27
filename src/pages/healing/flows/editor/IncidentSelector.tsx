import React from 'react';
import { Modal, Table, Input, Select, Space, Button, Tag, Typography, Row, Col, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, AlertOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useIncidentSelectorState } from './useIncidentSelectorState';

const { Text } = Typography;

interface IncidentSelectorProps {
    open: boolean;
    value?: string;
    onSelect: (id: string, incident: AutoHealing.Incident) => void;
    onCancel: () => void;
}

import {
    INCIDENT_SEVERITY_MAP,
    INCIDENT_STATUS_MAP,
    INCIDENT_HEALING_MAP,
    getSeverityOptions,
    getIncidentStatusOptions,
    getHealingStatusOptions,
} from '@/constants/incidentDicts';

/** 从 INCIDENT_SEVERITY_MAP 提取颜色用于 Tag */
const severityColors: Record<string, string> = Object.fromEntries(
    Object.entries(INCIDENT_SEVERITY_MAP).map(([k, v]) => [k, v.tagColor]),
);

const healingStatusMap: Record<string, { text: string; color: string }> = Object.fromEntries(
    Object.entries(INCIDENT_HEALING_MAP).map(([k, v]) => [k, { text: v.text, color: v.color }]),
);

const statusMap = INCIDENT_STATUS_MAP;

const IncidentSelector: React.FC<IncidentSelectorProps> = ({
    open,
    value,
    onSelect,
    onCancel
}) => {
    const {
        data,
        handleManualSelect,
        handlePageChange,
        handleReset,
        healingStatus,
        loading,
        page,
        pageSize,
        search,
        selectedIncident,
        selectedRowKey,
        setHealingStatus,
        setPage,
        setSearch,
        setSeverity,
        setSourcePlugin,
        setStatus,
        severity,
        sourcePlugin,
        status,
        total,
    } = useIncidentSelectorState({
        open,
        value,
    });

    const handleConfirm = () => {
        if (selectedRowKey && selectedIncident) {
            onSelect(selectedRowKey, selectedIncident);
        }
    };

    const columns = [
        {
            title: '工单信息',
            dataIndex: 'title',
            key: 'title',
            width: 250,
            ellipsis: true,
            render: (text: string, record: AutoHealing.Incident) => (
                <Space orientation="vertical" size={0}>
                    <Text strong style={{ fontSize: 13 }}>{text}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {record.external_id || record.id.slice(0, 8)}
                    </Text>
                </Space>
            ),
        },
        {
            title: '严重程度',
            dataIndex: 'severity',
            key: 'severity',
            width: 80,
            render: (sev: string) => (
                <Tag color={severityColors[sev] || 'default'} style={{ fontSize: 11 }}>
                    {sev === '1' ? '紧急' : sev === '2' ? '高' : sev === '3' ? '中' : sev === '4' ? '低' : sev}
                </Tag>
            ),
        },
        {
            title: '工单状态',
            dataIndex: 'status',
            key: 'status',
            width: 80,
            render: (s: string) => {
                const info = statusMap[s] || { text: s, color: 'default' };
                return <Tag color={info.color} style={{ fontSize: 11 }}>{info.text}</Tag>;
            },
        },
        {
            title: '自愈状态',
            dataIndex: 'healing_status',
            key: 'healing_status',
            width: 90,
            render: (hs: string) => {
                const info = healingStatusMap[hs] || { text: hs, color: 'default' };
                return <Tag color={info.color} style={{ fontSize: 11 }}>{info.text}</Tag>;
            },
        },
        {
            title: '受影响CI',
            dataIndex: 'affected_ci',
            key: 'affected_ci',
            width: 120,
            ellipsis: true,
            render: (ci: string) => <Text type="secondary" style={{ fontSize: 11 }}>{ci || '-'}</Text>,
        },
        {
            title: '来源',
            dataIndex: 'source_plugin_name',
            key: 'source_plugin_name',
            width: 100,
            ellipsis: true,
            render: (name: string) => <Text code style={{ fontSize: 10 }}>{name || '-'}</Text>,
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 100,
            render: (t: string) => (
                <Text type="secondary" style={{ fontSize: 11 }}>
                    {t ? dayjs(t).format('MM-DD HH:mm') : '-'}
                </Text>
            ),
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <AlertOutlined style={{ color: '#fa8c16' }} />
                    选择工单
                </Space>
            }
            open={open}
            onCancel={onCancel}
            width={1000}
            footer={[
                <Button key="cancel" onClick={onCancel}>取消</Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={handleConfirm}
                    disabled={!selectedRowKey}
                >
                    确定选择
                </Button>
            ]}
            destroyOnHidden
        >
            {/* Filters */}
            <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
                <Row gutter={[12, 12]}>
                    <Col span={6}>
                        <Input
                            placeholder="搜索标题/ID/CI"
                            prefix={<SearchOutlined />}
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            allowClear
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder="严重程度"
                            value={severity}
                            onChange={(v) => { setSeverity(v); setPage(1); }}
                            allowClear
                            style={{ width: '100%' }}
                            options={getSeverityOptions()}
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder="工单状态"
                            value={status}
                            onChange={(v) => { setStatus(v); setPage(1); }}
                            allowClear
                            style={{ width: '100%' }}
                            options={getIncidentStatusOptions()}
                        />
                    </Col>
                    <Col span={4}>
                        <Select
                            placeholder="自愈状态"
                            value={healingStatus}
                            onChange={(v) => { setHealingStatus(v); setPage(1); }}
                            allowClear
                            style={{ width: '100%' }}
                            options={getHealingStatusOptions()}
                        />
                    </Col>
                    <Col span={6}>
                        <Input
                            placeholder="来源插件名称"
                            value={sourcePlugin}
                            onChange={(e) => { setSourcePlugin(e.target.value); setPage(1); }}
                            allowClear
                        />
                    </Col>
                </Row>
                <Row style={{ marginTop: 12 }}>
                    <Col span={24} style={{ textAlign: 'right' }}>
                        <Space>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                共 {total} 条工单
                            </Text>
                        </Space>
                    </Col>
                </Row>
            </div>

            {/* Table */}
            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={loading}
                size="small"
                pagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: handlePageChange,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条`,
                    showQuickJumper: true,
                    size: 'small',
                }}
                rowSelection={{
                    type: 'radio',
                    selectedRowKeys: selectedRowKey ? [selectedRowKey] : [],
                    onChange: (keys, rows) => {
                        if (keys[0]) {
                            handleManualSelect(rows[0] as AutoHealing.Incident);
                        }
                    },
                }}
                onRow={(record) => ({
                    onClick: () => handleManualSelect(record),
                    style: { cursor: 'pointer' },
                })}
                locale={{
                    emptyText: <Empty description="暂无工单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
                scroll={{ y: 300 }}
            />

            {/* Selected info */}
            {selectedIncident && (
                <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: '#fff7e6',
                    borderRadius: 6,
                    border: '1px solid #ffd591'
                }}>
                    <Text strong>已选择：</Text> {selectedIncident.title}
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                        严重程度: {selectedIncident.severity} | 状态: {statusMap[selectedIncident.status]?.text || selectedIncident.status}
                    </Text>
                </div>
            )}
        </Modal>
    );
};

export default IncidentSelector;
