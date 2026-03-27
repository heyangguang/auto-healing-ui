import React, { useMemo } from 'react';
import {
  Button,
  Typography,
  Empty,
  Pagination,
  Row,
  Spin,
} from 'antd';
import { CheckCircleOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import StandardTable from '@/components/StandardTable';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import PlatformUserCard from './PlatformUserCard';
import PlatformUserDetailDrawer from './PlatformUserDetailDrawer';
import ResetPlatformPasswordModal from './ResetPlatformPasswordModal';
import { usePlatformUsersController } from './usePlatformUsersController';
import type {
  PlatformUserRecord,
} from './platformUserManagementTypes';
import './users.css';
import '../../../pages/execution/git-repos/index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const searchFields: SearchField[] = [
  { key: 'username', label: '用户名' },
  { key: 'display_name', label: '显示名' },
];

const advancedSearchFields: AdvancedSearchField[] = [
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '活跃', value: 'active' },
      { label: '锁定', value: 'locked' },
      { label: '停用', value: 'inactive' },
    ],
  },
  { key: 'email', label: '邮箱', type: 'input', placeholder: '搜索邮箱' },
  { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

const headerIcon = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <title>平台用户图标</title>
    <circle cx="20" cy="18" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M34 10l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PlatformUsersPage: React.FC = () => {
  const access = useAccess();
  const {
    data,
    drawerLoading,
    drawerOpen,
    drawerUser,
    handleDelete,
    handlePageChange,
    handleResetPassword,
    handleSearch,
    handleToggleStatus,
    isLastPlatformAdmin,
    loading,
    openDrawer,
    openResetPasswordModal,
    page,
    pageSize,
    resetPwdForm,
    resetPwdOpen,
    closeDrawer,
    closeResetPasswordModal,
    stats,
    submitting,
    total,
  } = usePlatformUsersController();

  const statsBar = useMemo(() => {
    const items = [
      { icon: <UserOutlined />, cls: 'total', val: stats.total, lbl: '全部' },
      { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '启用' },
      { icon: <UserOutlined />, cls: 'error', val: stats.inactive, lbl: '禁用' },
    ];
    return (
      <div className="git-stats-bar">
        {items.map((item, index) => (
          <React.Fragment key={item.lbl}>
            {index > 0 && <div className="git-stat-divider" />}
            <div className="git-stat-item">
              <span className={`git-stat-icon git-stat-icon-${item.cls}`}>{item.icon}</span>
              <div className="git-stat-content">
                <div className="git-stat-value">{item.val}</div>
                <div className="git-stat-label">{item.lbl}</div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }, [stats]);

  return (
    <>
      <StandardTable<PlatformUserRecord>
        tabs={[{ key: 'list', label: '平台用户' }]}
        title="平台用户"
        description="管理平台级用户账号，可分配不同平台角色（管理员、运维、审计员等）。租户内普通用户由租户管理员自行管理。"
        headerIcon={headerIcon}
        headerExtra={statsBar}
        searchFields={searchFields}
        advancedSearchFields={advancedSearchFields}
        onSearch={handleSearch}
        primaryActionLabel="新建用户"
        primaryActionIcon={<PlusOutlined />}
        onPrimaryAction={access.canCreatePlatformUser ? () => history.push('/platform/users/create') : undefined}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" tip="加载用户..."><div /></Spin>
          </div>
        ) : data.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">暂无平台用户</Text>}
          >
            <Button
              type="dashed"
              disabled={!access.canCreatePlatformUser}
              onClick={() => history.push('/platform/users/create')}
            >
              新建第一个用户
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[20, 20]} className="users-grid">
              {data.map((user) => (
                <PlatformUserCard
                  key={user.id}
                  user={user}
                  isLastAdmin={isLastPlatformAdmin(user)}
                  canUpdatePlatformUser={access.canUpdatePlatformUser}
                  canDeletePlatformUser={access.canDeletePlatformUser}
                  onOpen={openDrawer}
                  onEdit={(record) => history.push(`/platform/users/${record.id}/edit`)}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </Row>
            <div className="users-pagination">
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={['16', '24', '48']}
                showQuickJumper
                showTotal={(currentTotal) => `共 ${currentTotal} 条`}
              />
            </div>
          </>
        )}
      </StandardTable>

      <PlatformUserDetailDrawer
        open={drawerOpen}
        user={drawerUser}
        loading={drawerLoading}
        onClose={closeDrawer}
        canUpdatePlatformUser={access.canUpdatePlatformUser}
        canResetPlatformPassword={access.canResetPlatformPassword}
        canDeletePlatformUser={access.canDeletePlatformUser}
        protectLastAdmin={isLastPlatformAdmin}
        onEdit={(user) => {
          closeDrawer();
          history.push(`/platform/users/${user.id}/edit`);
        }}
        onResetPassword={openResetPasswordModal}
        onDelete={handleDelete}
        onToggleStatus={(user) => handleToggleStatus(user)}
      />

      <ResetPlatformPasswordModal
        open={resetPwdOpen}
        user={drawerUser}
        form={resetPwdForm}
        submitting={submitting}
        onCancel={closeResetPasswordModal}
        onSubmit={handleResetPassword}
      />
    </>
  );
};

export default PlatformUsersPage;
