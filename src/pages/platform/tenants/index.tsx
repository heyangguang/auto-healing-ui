import React from 'react';
import { Button, Empty, Pagination, Row, Spin, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import PlatformTenantCard from './PlatformTenantCard';
import PlatformTenantDetailDrawer from './PlatformTenantDetailDrawer';
import PlatformTenantsStatsBar from './PlatformTenantsStatsBar';
import {
  advancedSearchFields,
  headerIcon,
  searchFields,
} from './platformTenantsShared';
import { usePlatformTenantsPageState } from './usePlatformTenantsPageState';
import './index.css';
import '../../../pages/execution/git-repos/index.css';

const { Text } = Typography;

const TenantsPage: React.FC = () => {
  const {
    access,
    actionLoading,
    closeDrawer,
    data,
    drawerLoading,
    drawerOpen,
    drawerTenant,
    handleDelete,
    handlePageChange,
    handleSearch,
    handleToggle,
    loading,
    members,
    membersLoadFailed,
    membersLoading,
    openDrawer,
    page,
    pageSize,
    stats,
    total,
  } = usePlatformTenantsPageState();

  return (
    <>
      <StandardTable
        tabs={[{ key: 'list', label: '租户列表' }]}
        title="租户管理"
        description="管理平台下的所有租户，支持创建、编辑、禁用以及分配租户管理员。"
        headerIcon={headerIcon}
        headerExtra={<PlatformTenantsStatsBar stats={stats} />}
        searchFields={searchFields}
        advancedSearchFields={advancedSearchFields}
        onSearch={handleSearch}
        primaryActionLabel="创建租户"
        primaryActionIcon={<PlusOutlined />}
        onPrimaryAction={access.canManagePlatformTenants ? () => history.push('/platform/tenants/create') : undefined}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" tip="加载租户..."><div /></Spin>
          </div>
        ) : data.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<Text type="secondary">暂无租户数据</Text>}>
            <Button type="dashed" disabled={!access.canManagePlatformTenants} onClick={() => history.push('/platform/tenants/create')}>
              创建第一个租户
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[20, 20]} className="tenants-grid">
              {data.map((tenant) => (
                <PlatformTenantCard
                  key={tenant.id}
                  access={access}
                  actionLoading={actionLoading}
                  tenant={tenant}
                  onOpen={openDrawer}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </Row>
            <div className="tenants-pagination">
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

      <PlatformTenantDetailDrawer
        access={access}
        open={drawerOpen}
        tenant={drawerTenant}
        drawerLoading={drawerLoading}
        members={members}
        membersLoading={membersLoading}
        membersLoadFailed={membersLoadFailed}
        onClose={closeDrawer}
        onDelete={handleDelete}
      />
    </>
  );
};

export default TenantsPage;
