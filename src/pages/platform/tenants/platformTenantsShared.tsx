import React from 'react';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import {
  AlertOutlined,
  ApartmentOutlined,
  ApiOutlined,
  AppstoreOutlined,
  AuditOutlined,
  BankOutlined,
  BuildOutlined,
  BulbOutlined,
  CloudOutlined,
  ClusterOutlined,
  CodeOutlined,
  ControlOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  FireOutlined,
  FolderOpenOutlined,
  FundOutlined,
  GlobalOutlined,
  HomeOutlined,
  MonitorOutlined,
  ProductOutlined,
  RocketOutlined,
  SafetyOutlined,
  SendOutlined,
  ShopOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

export type TenantStats = {
  total: number;
  active: number;
  inactive: number;
};

export type TenantsAdvancedSearch = {
  keyword?: string;
  name?: string;
  code?: string;
  status?: 'active' | 'disabled';
};

export type TenantsSearchParams = {
  searchField?: string;
  searchValue?: string;
  advancedSearch?: TenantsAdvancedSearch;
  filters?: { field: string; value: string }[];
};

export type TenantsQuery = {
  page: number;
  page_size: number;
  keyword?: string;
  name?: string;
  code?: string;
  status?: 'active' | 'disabled';
};

export const searchFields: SearchField[] = [{ key: 'keyword', label: '名称/代码' }];

export const advancedSearchFields: AdvancedSearchField[] = [
  { key: 'name', label: '租户名称', type: 'input', placeholder: '搜索名称' },
  { key: 'code', label: '租户代码', type: 'input', placeholder: '搜索代码' },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '启用', value: 'active' },
      { label: '停用', value: 'disabled' },
    ],
  },
];

export const headerIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <title>租户列表图标</title>
    <rect x="4" y="20" width="40" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M12 20V14a12 12 0 0 1 24 0v6" stroke="currentColor" strokeWidth="2" fill="none" />
    <rect x="18" y="28" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const ICON_MAP: Record<string, React.ReactNode> = {
  alert: <AlertOutlined />,
  apartment: <ApartmentOutlined />,
  api: <ApiOutlined />,
  audit: <AuditOutlined />,
  bank: <BankOutlined />,
  build: <BuildOutlined />,
  bulb: <BulbOutlined />,
  cloud: <CloudOutlined />,
  cluster: <ClusterOutlined />,
  code: <CodeOutlined />,
  control: <ControlOutlined />,
  dashboard: <DashboardOutlined />,
  database: <DatabaseOutlined />,
  deployment: <DeploymentUnitOutlined />,
  experiment: <ExperimentOutlined />,
  fire: <FireOutlined />,
  folder: <FolderOpenOutlined />,
  fund: <FundOutlined />,
  global: <GlobalOutlined />,
  home: <HomeOutlined />,
  monitor: <MonitorOutlined />,
  product: <ProductOutlined />,
  rocket: <RocketOutlined />,
  safety: <SafetyOutlined />,
  send: <SendOutlined />,
  service: <CustomerServiceOutlined />,
  shop: <ShopOutlined />,
  star: <StarOutlined />,
  team: <TeamOutlined />,
  thunder: <ThunderboltOutlined />,
  tool: <ToolOutlined />,
  total: <AppstoreOutlined />,
  trophy: <TrophyOutlined />,
};
