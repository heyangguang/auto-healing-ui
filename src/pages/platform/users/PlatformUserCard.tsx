import React from 'react';
import { Button, Col, Popconfirm, Space, Switch, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPlatformUserInitial, getPlatformUserName, getPlatformUserStatusInfo, getUserRoles } from './platformUserHelpers';
import type { PlatformUserRecord } from './platformUserManagementTypes';

const { Text } = Typography;

type PlatformUserCardProps = {
  canDeletePlatformUser: boolean;
  canUpdatePlatformUser: boolean;
  isLastAdmin: boolean;
  onDelete: (user: PlatformUserRecord) => Promise<void> | void;
  onEdit: (user: PlatformUserRecord) => void;
  onOpen: (user: PlatformUserRecord) => void;
  onToggleStatus: (
    user: PlatformUserRecord,
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) => Promise<void> | void;
  user: PlatformUserRecord;
};

const PlatformUserRoles: React.FC<{ user: PlatformUserRecord }> = ({ user }) => {
  const roles = getUserRoles(user);
  if (roles.length === 0) {
    return <Text type="secondary" style={{ fontSize: 11 }}>暂无角色</Text>;
  }
  return (
    <>
      {roles.map((role) => (
        <span
          key={role.id}
          className={[
            'user-card-role-tag',
            role.name === 'platform_admin' ? 'user-card-role-tag-admin' : '',
            role.is_system ? 'user-card-role-tag-system' : '',
          ].filter(Boolean).join(' ')}
        >
          {role.name === 'platform_admin' && <CrownOutlined style={{ fontSize: 10 }} />}
          {role.display_name || role.name}
        </span>
      ))}
    </>
  );
};

const PlatformUserCardActions: React.FC<Omit<PlatformUserCardProps, 'onOpen'>> = ({
  canDeletePlatformUser,
  canUpdatePlatformUser,
  isLastAdmin,
  onDelete,
  onEdit,
  onToggleStatus,
  user,
}) => (
  <Space size={0} onClick={(event) => event.stopPropagation()}>
    <Tooltip title={isLastAdmin ? '最后一个平台管理员，无法禁用' : user.status === 'active' ? '禁用' : '启用'}>
      <Switch
        size="small"
        checked={user.status === 'active'}
        disabled={isLastAdmin || !canUpdatePlatformUser}
        onChange={(_, event) => onToggleStatus(user, event)}
      />
    </Tooltip>
    {canUpdatePlatformUser && (
      <Tooltip title={isLastAdmin ? '最后一个平台管理员，无法编辑' : '编辑'}>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          disabled={isLastAdmin}
          onClick={() => onEdit(user)}
        />
      </Tooltip>
    )}
    {canDeletePlatformUser && (
      isLastAdmin ? (
        <Tooltip title="最后一个平台管理员，无法删除">
          <Button type="text" danger size="small" icon={<DeleteOutlined />} disabled />
        </Tooltip>
      ) : (
        <Popconfirm
          title="确认删除该平台用户？"
          description="删除后不可恢复。"
          onConfirm={() => onDelete(user)}
          okText="删除"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="删除">
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      )
    )}
  </Space>
);

const PlatformUserCard: React.FC<PlatformUserCardProps> = (props) => {
  const isActive = props.user.status === 'active';
  const statusInfo = getPlatformUserStatusInfo(props.user.status);
  const displayName = getPlatformUserName(props.user);
  return (
    <Col key={props.user.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
      <div
        className={`user-card ${isActive ? 'user-card-active' : 'user-card-inactive'}`}
        onClick={() => props.onOpen(props.user)}
      >
        <div className="user-card-body">
          <div className="user-card-header">
            <div className="user-card-title-area">
              <div className="user-card-avatar">{getPlatformUserInitial(props.user)}</div>
              <div className="user-card-title">{displayName}</div>
            </div>
            <Space size={4}>
              {isActive ? (
                <span className="user-card-status-active">
                  <CheckCircleOutlined /> {statusInfo.label}
                </span>
              ) : props.user.status === 'locked' ? (
                <span style={{ color: '#fa8c16', fontSize: 12 }}>
                  <LockOutlined /> {statusInfo.label}
                </span>
              ) : (
                <span className="user-card-status-inactive">{statusInfo.label}</span>
              )}
            </Space>
          </div>

          <div className="user-card-desc">@{props.user.username} · {props.user.email || '未设置邮箱'}</div>
          <div className="user-card-preview">
            <PlatformUserRoles user={props.user} />
          </div>

          <div className="user-card-info-grid">
            <span className="user-card-info-item">
              <UserOutlined />
              <span className="info-value">{props.user.username}</span>
            </span>
            <span className="user-card-info-item">
              <MailOutlined />
              <span className="info-value">{props.user.email || '—'}</span>
            </span>
            <span className="user-card-info-item">
              <ClockCircleOutlined />
              创建 {props.user.created_at ? dayjs(props.user.created_at).format('MM/DD') : '-'}
            </span>
            <span className="user-card-info-item">
              <ClockCircleOutlined />
              更新 {props.user.updated_at ? dayjs(props.user.updated_at).fromNow() : '-'}
            </span>
          </div>

          <div className="user-card-footer">
            <span className="user-card-footer-left">{props.user.id?.substring(0, 8)}</span>
            <PlatformUserCardActions {...props} />
          </div>
        </div>
      </div>
    </Col>
  );
};

export default PlatformUserCard;
