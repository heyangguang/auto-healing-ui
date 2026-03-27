import type { ReactNode } from 'react';
import {
  AlertOutlined,
  ApiOutlined,
  ApartmentOutlined,
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

export type TenantIconOption = {
  label: string;
  value: string;
  icon: ReactNode;
};

export const TENANT_ICON_OPTIONS: TenantIconOption[] = [
  { label: '银行', value: 'bank', icon: <BankOutlined /> },
  { label: '商店', value: 'shop', icon: <ShopOutlined /> },
  { label: '团队', value: 'team', icon: <TeamOutlined /> },
  { label: '云服务', value: 'cloud', icon: <CloudOutlined /> },
  { label: '企业', value: 'apartment', icon: <ApartmentOutlined /> },
  { label: '工具', value: 'tool', icon: <ToolOutlined /> },
  { label: '全球', value: 'global', icon: <GlobalOutlined /> },
  { label: '火箭', value: 'rocket', icon: <RocketOutlined /> },
  { label: '主页', value: 'home', icon: <HomeOutlined /> },
  { label: '灯泡', value: 'bulb', icon: <BulbOutlined /> },
  { label: '安全', value: 'safety', icon: <SafetyOutlined /> },
  { label: '闪电', value: 'thunder', icon: <ThunderboltOutlined /> },
  { label: '数据库', value: 'database', icon: <DatabaseOutlined /> },
  { label: 'API', value: 'api', icon: <ApiOutlined /> },
  { label: '部署', value: 'deployment', icon: <DeploymentUnitOutlined /> },
  { label: '集群', value: 'cluster', icon: <ClusterOutlined /> },
  { label: '仪表盘', value: 'dashboard', icon: <DashboardOutlined /> },
  { label: '实验', value: 'experiment', icon: <ExperimentOutlined /> },
  { label: '监控', value: 'monitor', icon: <MonitorOutlined /> },
  { label: '代码', value: 'code', icon: <CodeOutlined /> },
  { label: '构建', value: 'build', icon: <BuildOutlined /> },
  { label: '基金', value: 'fund', icon: <FundOutlined /> },
  { label: '奖杯', value: 'trophy', icon: <TrophyOutlined /> },
  { label: '星级', value: 'star', icon: <StarOutlined /> },
  { label: '产品', value: 'product', icon: <ProductOutlined /> },
  { label: '告警', value: 'alert', icon: <AlertOutlined /> },
  { label: '审计', value: 'audit', icon: <AuditOutlined /> },
  { label: '火焰', value: 'fire', icon: <FireOutlined /> },
  { label: '客服', value: 'service', icon: <CustomerServiceOutlined /> },
  { label: '控制', value: 'control', icon: <ControlOutlined /> },
  { label: '发送', value: 'send', icon: <SendOutlined /> },
  { label: '文件夹', value: 'folder', icon: <FolderOpenOutlined /> },
];

export const findTenantIconOption = (value?: string) =>
  TENANT_ICON_OPTIONS.find((option) => option.value === value);
