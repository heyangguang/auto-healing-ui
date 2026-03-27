import React from 'react';
import {
  AlertOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DisconnectOutlined,
  EyeInvisibleOutlined,
  FundOutlined,
  HeartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { INCIDENT_CHART_LABELS } from '@/constants/incidentDicts';
import ChartCMDBEnv from './charts/ChartCMDBEnv';
import ChartCMDBStatus from './charts/ChartCMDBStatus';
import ChartIncidentStatus from './charts/ChartIncidentStatus';
import DashboardBarChart from './charts/DashboardBarChart';
import DashboardPieChart from './charts/DashboardPieChart';
import DashboardTrendChart from './charts/DashboardTrendChart';
import DashboardListWidget from './lists/DashboardListWidget';
import StatCMDBActive from './stats/StatCMDBActive';
import StatCMDBMaintenance from './stats/StatCMDBMaintenance';
import StatCMDBOffline from './stats/StatCMDBOffline';
import StatCMDBTotal from './stats/StatCMDBTotal';
import StatHealingRate from './stats/StatHealingRate';
import StatIncidentPending from './stats/StatIncidentPending';
import StatIncidentToday from './stats/StatIncidentToday';
import StatIncidentTotal from './stats/StatIncidentTotal';
import StatIncidentUnscanned from './stats/StatIncidentUnscanned';
import type { WidgetComponentProps, WidgetDefinition } from './widgetRegistryTypes';

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
  info: '信息',
};

const HEALING_STATUS_LABELS: Record<string, string> = {
  ...INCIDENT_CHART_LABELS,
  pending_trigger: '待触发',
  no_match: '未匹配',
  rejected: '已拒绝',
};

export const INCIDENTS_CMDB_WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'stat-incident-total': {
    id: 'stat-incident-total', name: '工单总数', description: 'ITSM 工单总数和处理进度',
    category: 'stat', section: 'incidents', icon: <AlertOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatIncidentTotal,
  },
  'stat-incident-today': {
    id: 'stat-incident-today', name: '今日新增工单', description: '今日创建的工单数量',
    category: 'stat', section: 'incidents', icon: <CalendarOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatIncidentToday,
  },
  'stat-healing-rate': {
    id: 'stat-healing-rate', name: '自愈成功率', description: '基于工单自愈状态计算的成功率',
    category: 'stat', section: 'incidents', icon: <HeartOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingRate,
  },
  'stat-incident-pending': {
    id: 'stat-incident-pending', name: '待处理工单', description: '当前等待自愈处理的工单',
    category: 'stat', section: 'incidents', icon: <WarningOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatIncidentPending,
  },
  'stat-incident-unscanned': {
    id: 'stat-incident-unscanned', name: '未扫描工单', description: '尚未被规则引擎扫描的工单',
    category: 'stat', section: 'incidents', icon: <EyeInvisibleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatIncidentUnscanned,
  },
  'chart-incident-healing-status': {
    id: 'chart-incident-healing-status', name: '工单自愈状态分布', description: '按自愈处理状态分组的饼图',
    category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="incidents" field="by_healing_status" title="工单自愈状态分布" labelMap={HEALING_STATUS_LABELS} {...props} />,
  },
  'chart-incident-severity': {
    id: 'chart-incident-severity', name: '工单严重等级分布', description: '按严重等级分组的饼图',
    category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="incidents" field="by_severity" title="工单严重等级分布" labelMap={SEVERITY_LABELS} {...props} />,
  },
  'chart-incident-category': {
    id: 'chart-incident-category', name: '工单分类统计', description: '按分类分组的柱状图',
    category: 'chart', section: 'incidents', icon: <BarChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardBarChart section="incidents" field="by_category" title="工单分类统计" {...props} />,
  },
  'chart-incident-source': {
    id: 'chart-incident-source', name: '工单来源分布', description: '按来源插件分组的饼图',
    category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="incidents" field="by_source" title="工单来源分布" {...props} />,
  },
  'chart-incident-trend-7d': {
    id: 'chart-incident-trend-7d', name: '近7天工单趋势', description: '最近7天工单创建趋势',
    category: 'chart', section: 'incidents', icon: <LineChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardTrendChart section="incidents" field="trend_7d" title="近7天工单趋势" {...props} />,
  },
  'chart-incident-trend-30d': {
    id: 'chart-incident-trend-30d', name: '近30天工单趋势', description: '最近30天工单创建趋势',
    category: 'chart', section: 'incidents', icon: <FundOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardTrendChart section="incidents" field="trend_30d" title="近30天工单趋势" chartType="area" color="#fa8c16" {...props} />,
  },
  'chart-incident-status': {
    id: 'chart-incident-status', name: '工单原始状态分布', description: '按原始状态分组的饼图',
    category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartIncidentStatus,
  },
  'list-incident-recent': {
    id: 'list-incident-recent', name: '最近工单', description: '最新创建的工单列表',
    category: 'list', section: 'incidents', icon: <AlertOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardListWidget section="incidents" field="recent_incidents" title="最近工单" icon={<AlertOutlined />} {...props} />,
  },
  'list-incident-critical': {
    id: 'list-incident-critical', name: '紧急工单', description: 'severity=critical 的工单列表',
    category: 'list', section: 'incidents', icon: <WarningOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardListWidget section="incidents" field="critical_incidents" title="紧急工单" icon={<WarningOutlined />} {...props} />,
  },
  'stat-cmdb-total': {
    id: 'stat-cmdb-total', name: '资产总数', description: 'CMDB 配置项总数',
    category: 'stat', section: 'cmdb', icon: <DatabaseOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatCMDBTotal,
  },
  'stat-cmdb-active': {
    id: 'stat-cmdb-active', name: '资产活跃率', description: '活跃/总数的比率',
    category: 'stat', section: 'cmdb', icon: <DatabaseOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatCMDBActive,
  },
  'stat-cmdb-maintenance': {
    id: 'stat-cmdb-maintenance', name: '维护中资产', description: '当前处于维护状态的资产',
    category: 'stat', section: 'cmdb', icon: <ToolOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatCMDBMaintenance,
  },
  'stat-cmdb-offline': {
    id: 'stat-cmdb-offline', name: '离线资产', description: '当前离线状态的资产',
    category: 'stat', section: 'cmdb', icon: <DisconnectOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatCMDBOffline,
  },
  'chart-cmdb-status': {
    id: 'chart-cmdb-status', name: 'CMDB 状态分布', description: '按状态分组的饼图',
    category: 'chart', section: 'cmdb', icon: <CloudServerOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartCMDBStatus,
  },
  'chart-cmdb-env': {
    id: 'chart-cmdb-env', name: 'CMDB 环境分布', description: '按环境分组的柱状图',
    category: 'chart', section: 'cmdb', icon: <BarChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartCMDBEnv,
  },
  'chart-cmdb-type': {
    id: 'chart-cmdb-type', name: '资产类型分布', description: '按设备类型分组的柱状图',
    category: 'chart', section: 'cmdb', icon: <BarChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardBarChart section="cmdb" field="by_type" title="资产类型分布" color="#722ed1" {...props} />,
  },
  'chart-cmdb-os': {
    id: 'chart-cmdb-os', name: '操作系统分布', description: '按 OS 分组的饼图',
    category: 'chart', section: 'cmdb', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="cmdb" field="by_os" title="操作系统分布" {...props} />,
  },
  'chart-cmdb-department': {
    id: 'chart-cmdb-department', name: '部门资产分布', description: '按部门分组的柱状图',
    category: 'chart', section: 'cmdb', icon: <BarChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardBarChart section="cmdb" field="by_department" title="部门资产分布" {...props} />,
  },
  'chart-cmdb-manufacturer': {
    id: 'chart-cmdb-manufacturer', name: '厂商分布', description: '按厂商分组的饼图',
    category: 'chart', section: 'cmdb', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="cmdb" field="by_manufacturer" title="厂商分布" {...props} />,
  },
  'list-cmdb-maintenance': {
    id: 'list-cmdb-maintenance', name: '最近维护记录', description: '最近的维护操作日志',
    category: 'list', section: 'cmdb', icon: <ToolOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardListWidget section="cmdb" field="recent_maintenance" title="最近维护记录" icon={<ToolOutlined />} {...props} />,
  },
  'list-cmdb-offline': {
    id: 'list-cmdb-offline', name: '离线资产列表', description: '当前离线的资产',
    category: 'list', section: 'cmdb', icon: <DisconnectOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardListWidget section="cmdb" field="offline_assets" title="离线资产列表" icon={<DisconnectOutlined />} {...props} />,
  },
};
