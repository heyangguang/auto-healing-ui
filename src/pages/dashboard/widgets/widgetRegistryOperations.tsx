import React from 'react';
import {
  ApiOutlined,
  BellOutlined,
  BranchesOutlined,
  BugOutlined,
  DashboardOutlined,
  FileTextOutlined,
  ForkOutlined,
  KeyOutlined,
  LineChartOutlined,
  MailOutlined,
  PieChartOutlined,
  SyncOutlined,
  TeamOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import DashboardPieChart from './charts/DashboardPieChart';
import DashboardTrendChart from './charts/DashboardTrendChart';
import DashboardListWidget from './lists/DashboardListWidget';
import ListRecentNotifications from './lists/ListRecentNotifications';
import StatusGitRepos from './status/StatusGitRepos';
import StatusPlugins from './status/StatusPlugins';
import StatusQuickActions from './status/StatusQuickActions';
import StatGitRepos from './stats/StatGitRepos';
import StatNotifChannels from './stats/StatNotifChannels';
import StatNotifDeliveryRate from './stats/StatNotifDeliveryRate';
import StatPlaybooks from './stats/StatPlaybooks';
import StatPluginCount from './stats/StatPluginCount';
import StatPluginError from './stats/StatPluginError';
import StatPluginSyncRate from './stats/StatPluginSyncRate';
import StatSecrets from './stats/StatSecrets';
import StatUsers from './stats/StatUsers';
import ChartPluginHealth from './charts/ChartPluginHealth';
import type { WidgetDefinition } from './widgetRegistryTypes';

export const OPERATIONS_WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'stat-plugin-count': {
    id: 'stat-plugin-count', name: '插件数量', description: '已注册的插件总数和活跃比率',
    category: 'stat', section: 'plugins', icon: <ApiOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatPluginCount,
  },
  'stat-plugin-error': {
    id: 'stat-plugin-error', name: '异常插件', description: '当前处于异常状态的插件',
    category: 'stat', section: 'plugins', icon: <BugOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatPluginError,
  },
  'stat-plugin-sync-rate': {
    id: 'stat-plugin-sync-rate', name: '同步成功率', description: '插件同步操作的成功比率',
    category: 'stat', section: 'plugins', icon: <SyncOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatPluginSyncRate,
  },
  'chart-plugin-status': {
    id: 'chart-plugin-status', name: '插件状态分布', description: '插件按状态分组的饼图',
    category: 'chart', section: 'plugins', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="plugins" field="by_status" title="插件状态分布" {...props} />,
  },
  'chart-plugin-type': {
    id: 'chart-plugin-type', name: '插件类型分布', description: '插件按类型分组的饼图',
    category: 'chart', section: 'plugins', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="plugins" field="by_type" title="插件类型分布" {...props} />,
  },
  'chart-plugin-health': {
    id: 'chart-plugin-health', name: '插件健康状态', description: '插件按活跃/异常/停用的分布',
    category: 'chart', section: 'plugins', icon: <DashboardOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartPluginHealth,
  },
  'chart-plugin-sync-trend': {
    id: 'chart-plugin-sync-trend', name: '近7天同步趋势', description: '最近7天插件同步趋势',
    category: 'chart', section: 'plugins', icon: <LineChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardTrendChart section="plugins" field="sync_trend_7d" title="近7天同步趋势" color="#52c41a" {...props} />,
  },
  'list-plugin-syncs': {
    id: 'list-plugin-syncs', name: '最近同步记录', description: '最近的插件同步操作',
    category: 'list', section: 'plugins', icon: <SyncOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="plugins" field="recent_syncs" title="最近同步记录" icon={<SyncOutlined />} {...props} />,
  },
  'list-plugin-errors': {
    id: 'list-plugin-errors', name: '异常插件列表', description: '当前异常状态的插件',
    category: 'list', section: 'plugins', icon: <BugOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="plugins" field="error_plugins" title="异常插件列表" icon={<BugOutlined />} {...props} />,
  },
  'status-plugins': {
    id: 'status-plugins', name: '插件状态一览', description: '所有插件的实时状态和同步情况',
    category: 'status', section: 'plugins', icon: <ApiOutlined />,
    defaultLayout: { w: 12, h: 4, minW: 6, minH: 3 }, component: StatusPlugins,
  },
  'stat-notif-channels': {
    id: 'stat-notif-channels', name: '通知渠道', description: '通知渠道和模板统计',
    category: 'stat', section: 'notifications', icon: <BellOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatNotifChannels,
  },
  'stat-notif-delivery-rate': {
    id: 'stat-notif-delivery-rate', name: '通知送达率', description: '通知成功送达的比率',
    category: 'stat', section: 'notifications', icon: <MailOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatNotifDeliveryRate,
  },
  'chart-notif-channel-type': {
    id: 'chart-notif-channel-type', name: '渠道类型分布', description: '通知渠道按类型分组',
    category: 'chart', section: 'notifications', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="notifications" field="by_channel_type" title="渠道类型分布" {...props} />,
  },
  'chart-notif-status': {
    id: 'chart-notif-status', name: '通知状态分布', description: '通知日志按状态分组',
    category: 'chart', section: 'notifications', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="notifications" field="by_log_status" title="通知状态分布" {...props} />,
  },
  'chart-notif-trend-7d': {
    id: 'chart-notif-trend-7d', name: '近7天通知趋势', description: '最近7天通知发送趋势',
    category: 'chart', section: 'notifications', icon: <LineChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardTrendChart section="notifications" field="trend_7d" title="近7天通知趋势" color="#eb2f96" {...props} />,
  },
  'list-recent-notifications': {
    id: 'list-recent-notifications', name: '最近通知', description: '最近发送的通知记录',
    category: 'list', section: 'notifications', icon: <BellOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListRecentNotifications,
  },
  'list-notif-failed': {
    id: 'list-notif-failed', name: '失败通知列表', description: '发送失败的通知记录',
    category: 'list', section: 'notifications', icon: <WarningOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="notifications" field="failed_logs" title="失败通知列表" icon={<WarningOutlined />} {...props} />,
  },
  'stat-git-repos': {
    id: 'stat-git-repos', name: 'Git 仓库', description: 'Git 仓库总数和同步率',
    category: 'stat', section: 'git', icon: <BranchesOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatGitRepos,
  },
  'status-git-repos': {
    id: 'status-git-repos', name: 'Git 仓库状态', description: 'Git 仓库的同步状态和最近提交',
    category: 'status', section: 'git', icon: <ForkOutlined />,
    defaultLayout: { w: 6, h: 4, minW: 4, minH: 3 }, component: StatusGitRepos,
  },
  'list-git-repos': {
    id: 'list-git-repos', name: '仓库列表', description: '全部 Git 仓库和状态',
    category: 'list', section: 'git', icon: <BranchesOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="git" field="repos" title="仓库列表" icon={<BranchesOutlined />} {...props} />,
  },
  'list-git-syncs': {
    id: 'list-git-syncs', name: '最近同步', description: '最近的 Git 同步记录',
    category: 'list', section: 'git', icon: <SyncOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="git" field="recent_syncs" title="最近同步" icon={<SyncOutlined />} {...props} />,
  },
  'stat-playbooks': {
    id: 'stat-playbooks', name: 'Playbook 总数', description: 'Playbook 模板总数和就绪数',
    category: 'stat', section: 'playbooks', icon: <FileTextOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatPlaybooks,
  },
  'chart-playbook-status': {
    id: 'chart-playbook-status', name: 'Playbook 状态分布', description: 'Playbook 按状态分组',
    category: 'chart', section: 'playbooks', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="playbooks" field="by_status" title="Playbook 状态分布" {...props} />,
  },
  'list-playbook-scans': {
    id: 'list-playbook-scans', name: '最近扫描记录', description: '最近的 Playbook 变量扫描',
    category: 'list', section: 'playbooks', icon: <FileTextOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="playbooks" field="recent_scans" title="最近扫描记录" icon={<FileTextOutlined />} {...props} />,
  },
  'stat-secrets': {
    id: 'stat-secrets', name: '密钥源', description: '密钥源总数和活跃数',
    category: 'stat', section: 'secrets', icon: <KeyOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatSecrets,
  },
  'chart-secrets-type': {
    id: 'chart-secrets-type', name: '密钥源类型分布', description: '按类型分组的饼图',
    category: 'chart', section: 'secrets', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="secrets" field="by_type" title="密钥源类型分布" {...props} />,
  },
  'chart-secrets-auth-type': {
    id: 'chart-secrets-auth-type', name: '认证方式分布', description: '按认证方式分组的饼图',
    category: 'chart', section: 'secrets', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardPieChart section="secrets" field="by_auth_type" title="认证方式分布" {...props} />,
  },
  'stat-users': {
    id: 'stat-users', name: '用户总数', description: '系统用户总数和活跃数',
    category: 'stat', section: 'users', icon: <TeamOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatUsers,
  },
  'list-recent-logins': {
    id: 'list-recent-logins', name: '最近登录', description: '最近登录的用户',
    category: 'list', section: 'users', icon: <TeamOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: any) => <DashboardListWidget section="users" field="recent_logins" title="最近登录" icon={<TeamOutlined />} {...props} />,
  },
  'status-quick-actions': {
    id: 'status-quick-actions', name: '快速操作', description: '常用操作的快捷入口',
    category: 'status', icon: <ToolOutlined />,
    defaultLayout: { w: 6, h: 3, minW: 3, minH: 3 }, component: StatusQuickActions,
  },
};
