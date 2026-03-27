import React from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Descriptions, Drawer, Empty, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import {
  ACTION_COLORS,
  ACTION_LABELS,
  HTTP_METHOD_COLORS as METHOD_COLORS,
  PLATFORM_RESOURCE_LABELS as RESOURCE_LABELS,
} from '@/constants/auditDicts';
import {
  formatChangeValue,
  getDeletedChangeEntries,
  getUpdatedChangeEntries,
} from '@/pages/system/audit-logs/helpers';
import type { AuditLogRecord } from '@/pages/system/audit-logs/types';

const { Text } = Typography;

type PlatformAuditDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  loadFailed?: boolean;
  detail: AuditLogRecord | null;
  onClose: () => void;
};

const PlatformAuditDetailDrawer: React.FC<PlatformAuditDetailDrawerProps> = ({
  detail,
  loading,
  loadFailed,
  onClose,
  open,
}) => (
  <Drawer title="平台审计日志详情" open={open} onClose={onClose} size={640} loading={loading}>
    {detail ? (
      <div className="audit-detail">
        <div
          className={`audit-detail-banner ${detail.status === 'failed' ? 'audit-detail-banner-failed' : ''} ${
            detail.risk_level === 'high' || detail.risk_level === 'critical'
              ? 'audit-detail-banner-risk'
              : ''
          }`}
        >
          <div className="audit-detail-banner-row">
            <Tag
              color={detail.status === 'success' ? 'green' : 'red'}
              icon={detail.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            >
              {detail.status === 'success' ? '操作成功' : '操作失败'}
            </Tag>
            {(detail.risk_level === 'critical' || detail.risk_level === 'high') && (
              <Tag
                color={detail.risk_level === 'critical' ? 'red' : 'orange'}
                icon={<WarningOutlined />}
              >
                {detail.risk_level === 'critical' ? '极高' : '高危'} · {detail.risk_reason}
              </Tag>
            )}
            {detail.risk_level === 'medium' && <Tag color="blue">中风险 · {detail.risk_reason}</Tag>}
            <span className="audit-detail-time">
              {dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </span>
          </div>
        </div>

        <Descriptions
          column={2}
          size="small"
          className="audit-detail-desc"
          labelStyle={{ color: '#8c8c8c', width: 90 }}
        >
          <Descriptions.Item label="操作用户">
            <Space size={4}>
              <UserOutlined />
              {detail.username}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="IP 地址">
            <Text code>{detail.ip_address}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="操作类型">
            <Tag color={ACTION_COLORS[detail.action ?? ''] || 'default'}>
              {ACTION_LABELS[detail.action ?? ''] || detail.action}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="资源类型">
            {RESOURCE_LABELS[detail.resource_type ?? ''] || detail.resource_type}
          </Descriptions.Item>
          {detail.resource_type === 'impersonation' ? (
            <>
              <Descriptions.Item label="目标租户" span={2}>
                <Tag color="purple">{detail.resource_name}</Tag>
              </Descriptions.Item>
              {detail.resource_id && (
                <Descriptions.Item label="申请 ID" span={2}>
                  <Text code style={{ fontSize: 12 }}>
                    {detail.resource_id}
                  </Text>
                </Descriptions.Item>
              )}
            </>
          ) : (
            <>
              {detail.resource_name && (
                <Descriptions.Item label="资源名称" span={2}>
                  {detail.resource_name}
                </Descriptions.Item>
              )}
              {detail.resource_id && (
                <Descriptions.Item label="资源 ID" span={2}>
                  <Text code style={{ fontSize: 12 }}>
                    {detail.resource_id}
                  </Text>
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>

        <div className="audit-detail-section">
          <div className="audit-detail-section-title">请求信息</div>
          <div className="audit-detail-request-line">
            <span
              className="audit-method-badge audit-method-badge-lg"
              style={{ color: METHOD_COLORS[detail.request_method ?? ''] || '#999' }}
            >
              {detail.request_method}
            </span>
            <Text code className="audit-detail-path">
              {detail.request_path}
            </Text>
            <Tag style={{ marginLeft: 'auto' }}>HTTP {detail.response_status}</Tag>
          </div>
        </div>

        {detail.request_body != null && (
          <div className="audit-detail-section">
            <div className="audit-detail-section-title">请求体</div>
            <pre className="audit-detail-json">{JSON.stringify(detail.request_body, null, 2)}</pre>
          </div>
        )}

        {detail.changes && (
          <div className="audit-detail-section">
            <div className="audit-detail-section-title">
              {detail.changes.deleted ? '删除资源信息' : '变更内容'}
            </div>
            {detail.changes.deleted ? (
              <table className="audit-changes-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>属性</th>
                    <th>值</th>
                  </tr>
                </thead>
                <tbody>
                  {getDeletedChangeEntries(detail.changes).map(([key, value]) => (
                    <tr key={key}>
                      <td className="audit-changes-field">{key}</td>
                      <td className="audit-changes-deleted-val">{formatChangeValue(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="audit-changes-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>字段</th>
                    <th>旧值</th>
                    <th>新值</th>
                  </tr>
                </thead>
                <tbody>
                  {getUpdatedChangeEntries(detail.changes).map(([field, diff]) => (
                    <tr key={field}>
                      <td className="audit-changes-field">{field}</td>
                      <td className="audit-changes-old">{formatChangeValue(diff?.old)}</td>
                      <td className="audit-changes-new">{formatChangeValue(diff?.new)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {detail.error_message && (
          <div className="audit-detail-section">
            <div className="audit-detail-section-title" style={{ color: '#f5222d' }}>
              错误信息
            </div>
            <div className="audit-detail-error">{detail.error_message}</div>
          </div>
        )}

        <div className="audit-detail-section">
          <div className="audit-detail-section-title">客户端信息</div>
          <Text type="secondary" style={{ fontSize: 12, wordBreak: 'break-all' }}>
            {detail.user_agent}
          </Text>
        </div>

        <div className="audit-detail-footer">
          <SafetyCertificateOutlined style={{ marginRight: 4 }} />
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
            {detail.id}
          </Text>
        </div>
      </div>
    ) : loadFailed ? (
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="平台审计详情加载失败，请重试" style={{ padding: '48px 0' }} />
    ) : null}
  </Drawer>
);

export default PlatformAuditDetailDrawer;
