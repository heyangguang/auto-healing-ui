import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useAccess } from '@umijs/max';
import {
  Button,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import { getRoles } from '@/services/auto-healing/roles';
import { deleteUser } from '@/services/auto-healing/users';
import UserDetailDrawer from './UserDetailDrawer';
import { requestUsersPage } from './userManagementHelpers';
import { createUserColumns } from './userManagementColumns';
import type {
  UserRecord,
  UsersRequestParams,
} from './userManagementTypes';

const searchFields: SearchField[] = [
  { key: 'username', label: '用户名' },
  { key: 'email', label: '邮箱' },
  { key: 'display_name', label: '显示名称' },
  { key: 'user_id', label: '用户 ID' },
];

const advancedSearchFields: AdvancedSearchField[] = [
  { key: 'username', label: '用户名', type: 'input', placeholder: '输入用户名' },
  { key: 'email', label: '邮箱', type: 'input', placeholder: '输入邮箱' },
  { key: 'display_name', label: '显示名称', type: 'input', placeholder: '输入显示名称' },
  { key: 'user_id', label: '用户 ID', type: 'input', placeholder: '输入用户 ID' },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

const headerIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path
      d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <circle cx="36" cy="14" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M39 36c0-5-3-9-7-11" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
  </svg>
);

const UsersPage: React.FC = () => {
  const access = useAccess();
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [roleOptionsLoadFailed, setRoleOptionsLoadFailed] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<UserRecord | null>(null);
  const refreshCountRef = useRef(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    getRoles()
      .then((items) => {
        setRoleOptionsLoadFailed(false);
        setRoleOptions(items.map((role) => ({ label: role.display_name || role.name, value: role.id })));
      })
      .catch(() => {
        setRoleOptions([]);
        setRoleOptionsLoadFailed(true);
        message.error('角色筛选加载失败，请刷新页面重试');
      });
  }, []);

  const triggerRefresh = useCallback(() => {
    refreshCountRef.current += 1;
    forceUpdate((value) => value + 1);
  }, []);

  const openDetailDrawer = useCallback((record: UserRecord) => {
    setDetailUser(record);
    setDetailDrawerOpen(true);
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerOpen(false);
    setDetailUser(null);
  }, []);

  const handleDeleteUser = useCallback(async (user: UserRecord) => {
    try {
      await deleteUser(user.id);
      message.success('删除成功');
      closeDetailDrawer();
      triggerRefresh();
    } catch {
      /* global error handler */
    }
  }, [closeDetailDrawer, triggerRefresh]);

  const handleRequest = useCallback((params: UsersRequestParams) => requestUsersPage(params), []);

  const columns = createUserColumns({
    canDeleteUser: access.canDeleteUser,
    canUpdateUser: access.canUpdateUser,
    onDelete: handleDeleteUser,
    onOpenDetail: openDetailDrawer,
    onUpdate: (user) => history.push(`/system/users/${user.id}/edit`),
    roleOptions: roleOptionsLoadFailed ? [] : roleOptions,
  });

  return (
    <>
      <StandardTable<UserRecord>
        key={refreshCountRef.current}
        tabs={[{ key: 'list', label: '用户列表' }]}
        title="用户管理"
        description="管理当前租户内的成员与租户角色分配。支持创建成员、调整角色以及将成员移出租户。"
        headerIcon={headerIcon}
        searchFields={searchFields}
        advancedSearchFields={advancedSearchFields}
        primaryActionLabel="创建用户"
        primaryActionIcon={<PlusOutlined />}
        primaryActionDisabled={!access.canCreateUser}
        onPrimaryAction={() => history.push('/system/users/create')}
        columns={columns}
        rowKey="id"
        onRowClick={(record) => openDetailDrawer(record)}
        request={handleRequest}
        defaultPageSize={10}
        preferenceKey="user_list"
      />

      <UserDetailDrawer
        open={detailDrawerOpen}
        user={detailUser}
        onClose={closeDetailDrawer}
        canUpdateUser={access.canUpdateUser}
        canDeleteUser={access.canDeleteUser}
        onEdit={(user) => {
          closeDetailDrawer();
          history.push(`/system/users/${user.id}/edit`);
        }}
        onDelete={handleDeleteUser}
      />
    </>
  );
};

export default UsersPage;
