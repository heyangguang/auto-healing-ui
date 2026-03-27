import React from 'react';
import {
  EyeOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import {
  INCIDENT_HEALING_MAP as HEALING_MAP,
  INCIDENT_SEVERITY_MAP as SEVERITY_MAP,
  INCIDENT_STATUS_MAP as STATUS_MAP,
  getHealingStatusOptions,
  getIncidentStatusOptions,
  getSeverityOptions,
} from '@/constants/incidentDicts';

const { Text } = Typography;

type ColumnHandlers = {
  canResetScan: boolean;
  onOpenDetail: (record: AutoHealing.Incident) => void;
  onResetScan: (record: AutoHealing.Incident) => void;
};

export function createIncidentColumns({
  canResetScan,
  onOpenDetail,
  onResetScan,
}: ColumnHandlers): StandardColumnDef<AutoHealing.Incident>[] {
  return [
    {
      columnKey: 'title',
      columnTitle: '工单标题',
      fixedColumn: true,
      dataIndex: 'title',
      width: 240,
      sorter: true,
      render: (_: unknown, record: AutoHealing.Incident) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a
            style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail(record);
            }}
          >
            {record.title || '无标题'}
          </a>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
              color: '#8590a6',
              letterSpacing: '0.02em',
            }}
          >
            {record.external_id}
          </span>
        </div>
      ),
    },
    {
      columnKey: 'source_plugin_name',
      columnTitle: '来源',
      dataIndex: 'source_plugin_name',
      width: 110,
      sorter: true,
      render: (_: unknown, record: AutoHealing.Incident) =>
        record.source_plugin_name ? (
          <Tag style={{ margin: 0 }}>{record.source_plugin_name}</Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
          </Text>
        ),
    },
    {
      columnKey: 'severity',
      columnTitle: '级别',
      dataIndex: 'severity',
      width: 80,
      sorter: true,
      headerFilters: getSeverityOptions(),
      render: (_: unknown, record: AutoHealing.Incident) => {
        const info = SEVERITY_MAP[record.severity] || {
          text: record.severity,
          tagColor: 'default',
        };
        return (
          <Tag color={info.tagColor} style={{ margin: 0 }}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      columnKey: 'status',
      columnTitle: '工单状态',
      dataIndex: 'status',
      width: 90,
      sorter: true,
      headerFilters: getIncidentStatusOptions(),
      render: (_: unknown, record: AutoHealing.Incident) => {
        const info = STATUS_MAP[record.status] || {
          text: record.status,
          color: 'default',
        };
        return (
          <Tag color={info.color} style={{ margin: 0 }}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      columnKey: 'healing_status',
      columnTitle: '自愈状态',
      dataIndex: 'healing_status',
      width: 100,
      sorter: true,
      headerFilters: getHealingStatusOptions(),
      render: (_: unknown, record: AutoHealing.Incident) => {
        const info = HEALING_MAP[record.healing_status] || {
          text: record.healing_status,
          badge: 'default' as const,
        };
        return <Badge status={info.badge} text={info.text} />;
      },
    },
    {
      columnKey: 'scanned',
      columnTitle: '扫描',
      dataIndex: 'scanned',
      width: 70,
      headerFilters: [
        { label: '已扫描', value: 'true' },
        { label: '待扫描', value: 'false' },
      ],
      render: (_: unknown, record: AutoHealing.Incident) => (
        <Tag color={record.scanned ? 'green' : 'default'} style={{ margin: 0 }}>
          {record.scanned ? '已扫描' : '待扫描'}
        </Tag>
      ),
    },
    {
      columnKey: 'category',
      columnTitle: '分类',
      dataIndex: 'category',
      width: 100,
      sorter: true,
      defaultVisible: false,
      ellipsis: true,
      render: (_: unknown, record: AutoHealing.Incident) =>
        record.category || <Text type="secondary">-</Text>,
    },
    {
      columnKey: 'affected_ci',
      columnTitle: '影响 CI',
      dataIndex: 'affected_ci',
      width: 120,
      defaultVisible: false,
      ellipsis: true,
      render: (_: unknown, record: AutoHealing.Incident) =>
        record.affected_ci || <Text type="secondary">-</Text>,
    },
    {
      columnKey: 'assignee',
      columnTitle: '指派人',
      dataIndex: 'assignee',
      width: 100,
      sorter: true,
      defaultVisible: false,
      ellipsis: true,
      render: (_: unknown, record: AutoHealing.Incident) =>
        record.assignee || <Text type="secondary">-</Text>,
    },
    {
      columnKey: 'created_at',
      columnTitle: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      sorter: true,
      render: (_: unknown, record: AutoHealing.Incident) =>
        record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      columnKey: 'actions',
      columnTitle: '操作',
      fixedColumn: true,
      width: 90,
      render: (_: unknown, record: AutoHealing.Incident) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail(record);
              }}
            />
          </Tooltip>
          <Tooltip title="重置扫描">
            <Button
              type="link"
              size="small"
              icon={<UndoOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onResetScan(record);
              }}
              disabled={!canResetScan}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
}
