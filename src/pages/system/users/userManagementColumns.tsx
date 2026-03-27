import React from 'react';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import { USER_STATUS_MAP, USER_STATUS_OPTIONS } from '@/constants/commonDicts';
import { getUserIdentifier, getUserRoles } from './userManagementHelpers';
import type { UserRecord } from './userManagementTypes';

const { Text } = Typography;

type UserColumnsOptions = {
  canDeleteUser: boolean;
  canUpdateUser: boolean;
  onDelete: (user: UserRecord) => Promise<void> | void;
  onOpenDetail: (user: UserRecord) => void;
  onUpdate: (user: UserRecord) => void;
  roleOptions: { label: string; value: string }[];
};

export const createUserColumns = ({
  canDeleteUser,
  canUpdateUser,
  onDelete,
  onOpenDetail,
  onUpdate,
  roleOptions,
}: UserColumnsOptions): StandardColumnDef<UserRecord>[] => [
  {
    columnKey: 'username',
    columnTitle: '用户名 / ID',
    fixedColumn: true,
    dataIndex: 'username',
    width: 160,
    sorter: true,
    render: (_, record) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <a
          style={{ fontWeight: 500, color: '#1677ff', cursor: 'pointer' }}
          onClick={(event) => {
            event.stopPropagation();
            onOpenDetail(record);
          }}
        >
          {record.username}
        </a>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
            color: '#8590a6',
            letterSpacing: '0.02em',
          }}
        >
          {getUserIdentifier(record) || '-'}
        </span>
      </div>
    ),
  },
  {
    columnKey: 'display_name',
    columnTitle: '显示名称',
    dataIndex: 'display_name',
    width: 120,
    sorter: true,
    ellipsis: true,
    render: (_, record) => record.display_name || <Text type="secondary">-</Text>,
  },
  {
    columnKey: 'email',
    columnTitle: '邮箱',
    dataIndex: 'email',
    width: 200,
    sorter: true,
    ellipsis: true,
  },
  {
    columnKey: 'roles',
    columnTitle: '角色',
    dataIndex: 'roles',
    width: 180,
    headerFilters: roleOptions,
    render: (_, record) => {
      const roles = getUserRoles(record);
      if (roles.length === 0) {
        return <Text type="secondary">无角色</Text>;
      }
      return (
        <Space size={[4, 4]} wrap>
          {roles.map((role) => (
            <Tag key={role.id} color={role.is_system ? 'blue' : 'default'}>
              {role.display_name || role.name}
            </Tag>
          ))}
        </Space>
      );
    },
  },
  {
    columnKey: 'status',
    columnTitle: '状态',
    dataIndex: 'status',
    width: 80,
    sorter: true,
    headerFilters: USER_STATUS_OPTIONS,
    render: (_, record) => {
      const info = USER_STATUS_MAP[record.status] || USER_STATUS_MAP.inactive;
      return <Tag color={info.tagColor}>{info.label}</Tag>;
    },
  },
  {
    columnKey: 'created_at',
    columnTitle: '创建时间',
    dataIndex: 'created_at',
    width: 170,
    sorter: true,
    render: (_, record) =>
      record.created_at ? dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    columnKey: 'actions',
    columnTitle: '操作',
    fixedColumn: true,
    width: 96,
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="编辑">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            disabled={!canUpdateUser}
            onClick={() => onUpdate(record)}
          />
        </Tooltip>
        <Popconfirm title="确定要删除此用户吗？" onConfirm={() => onDelete(record)}>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              disabled={!canDeleteUser}
              icon={<DeleteOutlined />}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    ),
  },
];
