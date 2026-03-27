import React from 'react';
import { Button, Col, Popconfirm, Space, Switch, Tooltip } from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  TagOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { PlatformTenantRecord } from '@/services/auto-healing/platform/tenants';
import { ICON_MAP } from './platformTenantsShared';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type AccessLike = {
  canManagePlatformTenants?: boolean;
};

type PlatformTenantCardProps = {
  access: AccessLike;
  actionLoading: string | null;
  onDelete: (event: React.MouseEvent | undefined, tenant: PlatformTenantRecord) => Promise<void>;
  onOpen: (tenant: PlatformTenantRecord) => void;
  onToggle: (tenant: PlatformTenantRecord, checked: boolean) => Promise<void>;
  tenant: PlatformTenantRecord;
};

const PlatformTenantCard: React.FC<PlatformTenantCardProps> = ({
  access,
  actionLoading,
  onDelete,
  onOpen,
  onToggle,
  tenant,
}) => {
  const isActive = tenant.status === 'active' || !tenant.status;
  const icon = ICON_MAP[tenant.icon ?? ''] ?? <BankOutlined />;

  return (
    <Col xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
      <div
        className={`tenant-card ${isActive ? 'tenant-card-active' : 'tenant-card-inactive'}`}
        onClick={() => onOpen(tenant)}
      >
        <div className="tenant-card-body">
          <div className="tenant-card-header">
            <div className="tenant-card-title-area">
              <div className="tenant-card-icon">{icon}</div>
              <div className="tenant-card-title">{tenant.name || '未命名租户'}</div>
            </div>
            {isActive ? (
              <span className="tenant-card-status-active">
                <CheckCircleOutlined /> 启用
              </span>
            ) : (
              <span className="tenant-card-status-inactive">已停用</span>
            )}
          </div>

          <div className="tenant-card-desc">{tenant.description || '暂无描述'}</div>

          <div className="tenant-card-preview">
            <div className="tenant-card-admin-avatar">{icon}</div>
            <span style={{ fontSize: 11, color: '#595959', fontFamily: '"SFMono-Regular", Consolas, monospace' }}>
              {tenant.code}
            </span>
            <span className="tenant-card-preview-label">租户编码</span>
          </div>

          <div className="tenant-card-info-grid">
            <span className="tenant-card-info-item">
              <TagOutlined />
              <span className="info-value">{tenant.code}</span>
            </span>
            <span className="tenant-card-info-item">
              <TeamOutlined />
              <span className="info-value">{tenant.member_count ?? '—'}</span> 成员
            </span>
            <span className="tenant-card-info-item">
              <ClockCircleOutlined />
              创建 {tenant.created_at ? dayjs(tenant.created_at).format('MM/DD') : '-'}
            </span>
            <span className="tenant-card-info-item">
              <ClockCircleOutlined />
              更新 {tenant.updated_at ? dayjs(tenant.updated_at).fromNow() : '-'}
            </span>
          </div>

          <div className="tenant-card-footer">
            <span className="tenant-card-footer-left">{tenant.id?.substring(0, 8)}</span>
            <Space size={0} onClick={(event) => event.stopPropagation()}>
              {access.canManagePlatformTenants && (
                <Tooltip title={isActive ? '停用' : '启用'}>
                  <Switch
                    size="small"
                    checked={isActive}
                    loading={actionLoading === tenant.id}
                    onChange={(checked) => onToggle(tenant, checked)}
                  />
                </Tooltip>
              )}
              <Tooltip title="成员管理">
                <Button
                  type="text"
                  size="small"
                  icon={<CrownOutlined />}
                  onClick={() => history.push(`/platform/tenants/${tenant.id}/members`)}
                />
              </Tooltip>
              {access.canManagePlatformTenants && (
                <>
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => history.push(`/platform/tenants/${tenant.id}/edit`)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除此租户？"
                    description="删除后无法恢复"
                    onConfirm={() => onDelete(undefined, tenant)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      loading={actionLoading === tenant.id}
                    />
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>
        </div>
      </div>
    </Col>
  );
};

export default PlatformTenantCard;
