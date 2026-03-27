import React from 'react';
import {
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  ForkOutlined,
  FundOutlined,
  LineChartOutlined,
  NodeIndexOutlined,
  OrderedListOutlined,
  PieChartOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  SendOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ChartExecStatus from './charts/ChartExecStatus';
import ChartInstanceStatus from './charts/ChartInstanceStatus';
import DashboardPieChart from './charts/DashboardPieChart';
import DashboardRankChart from './charts/DashboardRankChart';
import DashboardTrendChart from './charts/DashboardTrendChart';
import ListPendingApprovals from './lists/ListPendingApprovals';
import ListPendingTriggers from './lists/ListPendingTriggers';
import DashboardListWidget from './lists/DashboardListWidget';
import ListRecentInstances from './lists/ListRecentInstances';
import ListRecentRuns from './lists/ListRecentRuns';
import ListSchedules from './lists/ListSchedules';
import StatActiveFlows from './stats/StatActiveFlows';
import StatActiveRules from './stats/StatActiveRules';
import StatExecAvgDuration from './stats/StatExecAvgDuration';
import StatExecRunning from './stats/StatExecRunning';
import StatExecSchedules from './stats/StatExecSchedules';
import StatExecSuccess from './stats/StatExecSuccess';
import StatExecTotal from './stats/StatExecTotal';
import StatHealingFlows from './stats/StatHealingFlows';
import StatHealingInstancesRunning from './stats/StatHealingInstancesRunning';
import StatHealingPendingApprovals from './stats/StatHealingPendingApprovals';
import StatHealingPendingTriggers from './stats/StatHealingPendingTriggers';
import StatHealingRulesTotal from './stats/StatHealingRulesTotal';
import StatInstanceTotal from './stats/StatInstanceTotal';
import StatPendingItems from './stats/StatPendingItems';
import type { WidgetComponentProps, WidgetDefinition } from './widgetRegistryTypes';

export const HEALING_EXECUTION_WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'stat-healing-flows': {
    id: 'stat-healing-flows', name: '流程总数', description: '自愈流程总数和活跃数',
    category: 'stat', section: 'healing', icon: <NodeIndexOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingFlows,
  },
  'stat-active-flows': {
    id: 'stat-active-flows', name: '活跃流程数', description: '已激活的自愈流程',
    category: 'stat', section: 'healing', icon: <ForkOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatActiveFlows,
  },
  'stat-healing-rules-total': {
    id: 'stat-healing-rules-total', name: '规则总数', description: '自愈规则总数和活跃数',
    category: 'stat', section: 'healing', icon: <SafetyOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingRulesTotal,
  },
  'stat-active-rules': {
    id: 'stat-active-rules', name: '活跃规则数', description: '已激活的自愈规则',
    category: 'stat', section: 'healing', icon: <SafetyOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatActiveRules,
  },
  'stat-instance-total': {
    id: 'stat-instance-total', name: '自愈实例总数', description: '自愈流程实例的历史总数',
    category: 'stat', section: 'healing', icon: <DeploymentUnitOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatInstanceTotal,
  },
  'stat-instances-running': {
    id: 'stat-instances-running', name: '运行中实例', description: '当前正在执行的自愈实例',
    category: 'stat', section: 'healing', icon: <PlayCircleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingInstancesRunning,
  },
  'stat-pending-approvals': {
    id: 'stat-pending-approvals', name: '待审批任务', description: '等待人工审批的任务数',
    category: 'stat', section: 'healing', icon: <AuditOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingPendingApprovals,
  },
  'stat-pending-triggers': {
    id: 'stat-pending-triggers', name: '待触发工单', description: '等待手动触发的工单数',
    category: 'stat', section: 'healing', icon: <SendOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatHealingPendingTriggers,
  },
  'stat-pending-items': {
    id: 'stat-pending-items', name: '待办事项', description: '待审批和待触发的事项总数',
    category: 'stat', section: 'healing', icon: <ScheduleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatPendingItems,
  },
  'chart-instance-status': {
    id: 'chart-instance-status', name: '实例状态分布', description: '自愈实例按状态分组的分布图',
    category: 'chart', section: 'healing', icon: <FundOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartInstanceStatus,
  },
  'chart-instance-trend-7d': {
    id: 'chart-instance-trend-7d', name: '近7天实例趋势', description: '最近7天实例创建趋势',
    category: 'chart', section: 'healing', icon: <LineChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardTrendChart section="healing" field="instance_trend_7d" title="近7天实例趋势" color="#722ed1" {...props} />,
  },
  'chart-approval-status': {
    id: 'chart-approval-status', name: '审批状态分布', description: '审批任务按状态分组',
    category: 'chart', section: 'healing', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="healing" field="approvals_by_status" title="审批状态分布" {...props} />,
  },
  'chart-rule-trigger-mode': {
    id: 'chart-rule-trigger-mode', name: '规则触发模式', description: '规则按触发模式分组',
    category: 'chart', section: 'healing', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="healing" field="rules_by_trigger_mode" title="规则触发模式" {...props} />,
  },
  'chart-flow-top10': {
    id: 'chart-flow-top10', name: '流程触发排行 TOP10', description: '按触发次数排序的流程排行榜',
    category: 'chart', section: 'healing', icon: <OrderedListOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardRankChart section="healing" field="flow_top10" title="流程触发排行 TOP10" {...props} />,
  },
  'list-recent-instances': {
    id: 'list-recent-instances', name: '最近自愈实例', description: '最新的自愈流程实例列表',
    category: 'list', section: 'healing', icon: <NodeIndexOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListRecentInstances,
  },
  'list-pending-approvals': {
    id: 'list-pending-approvals', name: '待审批列表', description: '当前等待审批的任务',
    category: 'list', section: 'healing', icon: <ClockCircleOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListPendingApprovals,
  },
  'list-pending-triggers': {
    id: 'list-pending-triggers', name: '待触发列表', description: '等待手动触发的工单',
    category: 'list', section: 'healing', icon: <RocketOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListPendingTriggers,
  },
  'stat-exec-total': {
    id: 'stat-exec-total', name: '执行记录总数', description: 'Ansible 执行记录的总数',
    category: 'stat', section: 'execution', icon: <ThunderboltOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatExecTotal,
  },
  'stat-exec-success': {
    id: 'stat-exec-success', name: '执行成功率', description: '执行记录的成功比率',
    category: 'stat', section: 'execution', icon: <CheckCircleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatExecSuccess,
  },
  'stat-exec-running': {
    id: 'stat-exec-running', name: '运行中任务', description: '当前正在执行的任务数',
    category: 'stat', section: 'execution', icon: <ThunderboltOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatExecRunning,
  },
  'stat-exec-avg-duration': {
    id: 'stat-exec-avg-duration', name: '平均执行时长', description: '已完成任务的平均执行时间',
    category: 'stat', section: 'execution', icon: <ClockCircleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatExecAvgDuration,
  },
  'stat-exec-schedules': {
    id: 'stat-exec-schedules', name: '定时任务', description: '定时调度任务总数和启用数',
    category: 'stat', section: 'execution', icon: <ScheduleOutlined />,
    defaultLayout: { w: 3, h: 2, minW: 2, minH: 2 }, component: StatExecSchedules,
  },
  'chart-exec-status': {
    id: 'chart-exec-status', name: '执行状态分布', description: '执行记录按状态分组',
    category: 'chart', section: 'execution', icon: <ExperimentOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ChartExecStatus,
  },
  'chart-exec-trend-7d': {
    id: 'chart-exec-trend-7d', name: '近7天执行趋势', description: '最近7天执行记录趋势',
    category: 'chart', section: 'execution', icon: <LineChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardTrendChart section="execution" field="trend_7d" title="近7天执行趋势" color="#52c41a" {...props} />,
  },
  'chart-exec-trend-30d': {
    id: 'chart-exec-trend-30d', name: '近30天执行趋势', description: '最近30天执行记录趋势',
    category: 'chart', section: 'execution', icon: <FundOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardTrendChart section="execution" field="trend_30d" title="近30天执行趋势" chartType="area" color="#13c2c2" {...props} />,
  },
  'chart-exec-schedule-type': {
    id: 'chart-exec-schedule-type', name: '定时任务类型', description: '按调度类型分组的饼图',
    category: 'chart', section: 'execution', icon: <PieChartOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardPieChart section="execution" field="schedules_by_type" title="定时任务类型" {...props} />,
  },
  'chart-exec-task-top10': {
    id: 'chart-exec-task-top10', name: '任务执行排行 TOP10', description: '按执行次数排序的任务排行榜',
    category: 'chart', section: 'execution', icon: <OrderedListOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardRankChart section="execution" field="task_top10" title="任务执行排行 TOP10" color="#1677ff" {...props} />,
  },
  'list-recent-runs': {
    id: 'list-recent-runs', name: '最近执行记录', description: '最新的执行记录列表',
    category: 'list', section: 'execution', icon: <FileTextOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListRecentRuns,
  },
  'list-failed-runs': {
    id: 'list-failed-runs', name: '失败执行记录', description: '最近失败的执行记录',
    category: 'list', section: 'execution', icon: <WarningOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    component: (props: WidgetComponentProps) => <DashboardListWidget section="execution" field="failed_runs" title="失败执行记录" icon={<WarningOutlined />} {...props} />,
  },
  'list-schedules': {
    id: 'list-schedules', name: '定时任务列表', description: '当前配置的定时调度任务',
    category: 'list', section: 'execution', icon: <ScheduleOutlined />,
    defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListSchedules,
  },
};
