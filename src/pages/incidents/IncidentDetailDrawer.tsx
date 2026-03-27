import React from 'react';
import {
  AlertOutlined,
  CodeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  MedicineBoxOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Badge, Button, Drawer, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import {
  INCIDENT_HEALING_MAP as HEALING_MAP,
  INCIDENT_SEVERITY_MAP as SEVERITY_MAP,
  INCIDENT_STATUS_MAP as STATUS_MAP,
} from '@/constants/incidentDicts';

type IncidentDetailDrawerProps = {
  canTriggerHealing: boolean;
  detailLoading: boolean;
  incident: AutoHealing.Incident | null;
  onClose: () => void;
  onResetScan: (incident: AutoHealing.Incident) => void;
  open: boolean;
};

type DetailField = {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
};

type DetailCardProps = {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
};

const DetailCard: React.FC<DetailCardProps> = ({ children, icon, title }) => (
  <div className="incidents-detail-card">
    <div className="incidents-detail-card-header">
      {icon}
      <span className="incidents-detail-card-header-title">{title}</span>
    </div>
    <div className="incidents-detail-card-body">{children}</div>
  </div>
);

const DetailGrid: React.FC<{ fields: DetailField[] }> = ({ fields }) => (
  <div className="incidents-detail-grid">
    {fields.map((field) => (
      <div className="incidents-detail-field" key={field.label}>
        <span className="incidents-detail-field-label">{field.label}</span>
        <div
          className={[
            'incidents-detail-field-value',
            field.mono ? 'incidents-detail-field-value-mono' : '',
          ].join(' ').trim()}
        >
          {field.value}
        </div>
      </div>
    ))}
  </div>
);

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-';
}

function renderSeverityTag(severity?: AutoHealing.IncidentSeverity) {
  const info = severity ? SEVERITY_MAP[severity] : undefined;
  return info ? <Tag color={info.tagColor}>{info.text}</Tag> : <Tag>{severity || '-'}</Tag>;
}

function renderStatusTag(status?: AutoHealing.IncidentStatus) {
  const info = status ? STATUS_MAP[status] : undefined;
  return info ? <Tag color={info.color}>{info.text}</Tag> : <Tag>{status || '-'}</Tag>;
}

function renderHealingStatus(status?: AutoHealing.HealingStatus) {
  const info = status ? HEALING_MAP[status] : undefined;
  return info ? <Badge status={info.badge} text={info.text} /> : <span>{status || '-'}</span>;
}

function hasRawData(rawData: AutoHealing.Incident['raw_data']) {
  return Boolean(rawData && Object.keys(rawData as Record<string, unknown>).length > 0);
}

export const IncidentDetailDrawer: React.FC<IncidentDetailDrawerProps> = ({
  canTriggerHealing,
  detailLoading,
  incident,
  onClose,
  onResetScan,
  open,
}) => {
  const basicFields: DetailField[] = incident
    ? [
        { label: '工单状态', value: renderStatusTag(incident.status) },
        { label: '严重程度', value: renderSeverityTag(incident.severity) },
        { label: '优先级', value: incident.priority || '-' },
        { label: '分类', value: incident.category || '-' },
        { label: '影响 CI', value: incident.affected_ci || '-' },
        { label: '影响服务', value: incident.affected_service || '-' },
        { label: '指派人', value: incident.assignee || '-' },
        { label: '报告人', value: incident.reporter || '-' },
      ]
    : [];

  const healingFields: DetailField[] = incident
    ? [
        { label: '自愈状态', value: renderHealingStatus(incident.healing_status) },
        {
          label: '扫描状态',
          value: (
            <Tag color={incident.scanned ? 'green' : 'default'}>
              {incident.scanned ? '已扫描' : '待扫描'}
            </Tag>
          ),
        },
        { label: '匹配规则 ID', value: incident.matched_rule_id || '-', mono: true },
        { label: '自愈流程 ID', value: incident.healing_flow_instance_id || '-', mono: true },
      ]
    : [];

  const sourceFields: DetailField[] = incident
    ? [
        {
          label: '来源插件',
          value: incident.source_plugin_name ? <Tag style={{ margin: 0 }}>{incident.source_plugin_name}</Tag> : '-',
        },
        { label: '外部 ID', value: incident.external_id || '-', mono: true },
        { label: '源系统创建', value: formatDateTime(incident.source_created_at) },
        { label: '源系统更新', value: formatDateTime(incident.source_updated_at) },
        { label: '本地创建', value: formatDateTime(incident.created_at) },
        { label: '本地更新', value: formatDateTime(incident.updated_at) },
      ]
    : [];

  return (
    <Drawer
      title={null}
      size={560}
      open={open}
      onClose={onClose}
      styles={{ header: { display: 'none' }, body: { padding: 0 } }}
      loading={detailLoading}
      destroyOnHidden
    >
      {incident && (
        <>
          <div className="incidents-detail-header">
            <div className="incidents-detail-header-top">
              <div className="incidents-detail-header-icon">
                <AlertOutlined />
              </div>
              <div className="incidents-detail-header-info">
                <div className="incidents-detail-title">{incident.title || '无标题'}</div>
                <div className="incidents-detail-sub">{incident.external_id}</div>
              </div>
              {renderSeverityTag(incident.severity)}
            </div>
            <Space size="small">
              <Button
                size="small"
                icon={<UndoOutlined />}
                disabled={!canTriggerHealing}
                onClick={() => onResetScan(incident)}
              >
                重置扫描
              </Button>
            </Space>
          </div>

          <div className="incidents-detail-body">
            <DetailCard
              icon={<InfoCircleOutlined className="incidents-detail-card-header-icon" />}
              title="基本信息"
            >
              <DetailGrid fields={basicFields} />
            </DetailCard>

            {incident.description && (
              <DetailCard
                icon={<FileTextOutlined className="incidents-detail-card-header-icon" />}
                title="描述"
              >
                <div className="incidents-detail-desc">{incident.description}</div>
              </DetailCard>
            )}

            <DetailCard
              icon={<MedicineBoxOutlined className="incidents-detail-card-header-icon" />}
              title="自愈信息"
            >
              <DetailGrid fields={healingFields} />
            </DetailCard>

            <DetailCard
              icon={<LinkOutlined className="incidents-detail-card-header-icon" />}
              title="来源与时间"
            >
              <DetailGrid fields={sourceFields} />
            </DetailCard>

            {hasRawData(incident.raw_data) && (
              <div className="incidents-detail-card">
                <div className="incidents-detail-card-header">
                  <CodeOutlined className="incidents-detail-card-header-icon" />
                  <span className="incidents-detail-card-header-title">原始数据</span>
                </div>
                <div className="incidents-raw-data">
                  {JSON.stringify(incident.raw_data, null, 2)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
};
