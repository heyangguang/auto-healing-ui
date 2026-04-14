import React from 'react';
import { ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { Alert, Collapse, Empty, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { IncidentWritebackLog } from '@/services/auto-healing/incidents';

const { Paragraph, Text } = Typography;

type IncidentWritebackLogsCardProps = {
  logs: IncidentWritebackLog[];
  loading: boolean;
};

function formatDateTime(value?: string | null) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';
}

function renderStatus(status: string) {
  switch (status) {
    case 'success':
      return <Tag color="success">成功</Tag>;
    case 'failed':
      return <Tag color="error">失败</Tag>;
    case 'skipped':
      return <Tag>已跳过</Tag>;
    default:
      return <Tag color="processing">处理中</Tag>;
  }
}

function prettyJSON(value: unknown) {
  if (value == null) {
    return '-';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function renderLogDescription(log: IncidentWritebackLog) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="incidents-detail-grid">
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">触发来源</span>
          <div className="incidents-detail-field-value">{log.trigger_source}</div>
        </div>
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">操作者</span>
          <div className="incidents-detail-field-value">{log.operator_name || log.operator_user_id || '-'}</div>
        </div>
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">请求地址</span>
          <div className="incidents-detail-field-value incidents-detail-field-value-mono">{log.request_url || '-'}</div>
        </div>
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">返回状态码</span>
          <div className="incidents-detail-field-value">{log.response_status_code ?? '-'}</div>
        </div>
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">开始时间</span>
          <div className="incidents-detail-field-value">{formatDateTime(log.started_at)}</div>
        </div>
        <div className="incidents-detail-field">
          <span className="incidents-detail-field-label">结束时间</span>
          <div className="incidents-detail-field-value">{formatDateTime(log.finished_at)}</div>
        </div>
      </div>

      {log.error_message ? (
        <Alert
          type={log.status === 'failed' ? 'error' : 'warning'}
          showIcon
          message={log.error_message}
        />
      ) : null}

      <div>
        <Text strong>请求体</Text>
        <pre className="incidents-raw-data" style={{ marginTop: 8 }}>{prettyJSON(log.request_payload)}</pre>
      </div>
      {log.response_body ? (
        <div>
          <Text strong>响应体</Text>
          <pre className="incidents-raw-data" style={{ marginTop: 8 }}>{log.response_body}</pre>
        </div>
      ) : null}
    </div>
  );
}

export const IncidentWritebackLogsCard: React.FC<IncidentWritebackLogsCardProps> = ({
  logs,
  loading,
}) => {
  return (
    <div className="incidents-detail-card">
      <div className="incidents-detail-card-header">
        <LinkOutlined className="incidents-detail-card-header-icon" />
        <span className="incidents-detail-card-header-title">回写记录</span>
      </div>
      <div className="incidents-detail-card-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <Spin />
          </div>
        ) : null}
        {!loading && logs.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无回写记录" />
        ) : null}
        {!loading && logs.length > 0 ? (
          <Collapse
            ghost
            items={logs.map((log) => ({
              key: log.id,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text strong>{log.action === 'close' ? '关闭工单' : '更新工单'}</Text>
                  {renderStatus(log.status)}
                  <Text type="secondary">
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {formatDateTime(log.created_at)}
                  </Text>
                </div>
              ),
              children: renderLogDescription(log),
            }))}
          />
        ) : null}
        {!loading ? (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            这里会记录每次回写到源 ITSM 的请求、返回结果和错误信息，便于排错。
          </Paragraph>
        ) : null}
      </div>
    </div>
  );
};
