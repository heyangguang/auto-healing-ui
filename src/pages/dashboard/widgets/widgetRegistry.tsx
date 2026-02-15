/**
 * Dashboard Widget 注册表
 * 定义所有 90 个可用 Widget 的元数据和默认布局
 * 使用可复用的基础图表/列表组件配合 inline 配置减少独立文件数
 */

import {
    AlertOutlined, ApiOutlined, AuditOutlined, BarChartOutlined, BellOutlined,
    BranchesOutlined, BugOutlined, CalendarOutlined, CheckCircleOutlined,
    ClockCircleOutlined, CloudServerOutlined, DashboardOutlined, DatabaseOutlined,
    DeploymentUnitOutlined, DisconnectOutlined, ExperimentOutlined, EyeInvisibleOutlined,
    FileTextOutlined, ForkOutlined, FundOutlined, HeartOutlined, KeyOutlined,
    LineChartOutlined, MailOutlined, NodeIndexOutlined, OrderedListOutlined,
    PieChartOutlined, PlayCircleOutlined, RocketOutlined, SafetyOutlined,
    ScheduleOutlined, SendOutlined, SyncOutlined, TeamOutlined, ThunderboltOutlined,
    ToolOutlined, WarningOutlined,
} from '@ant-design/icons';
import React from 'react';

// ==================== 基础 Stat 组件 ====================
import StatActiveFlows from './stats/StatActiveFlows';
import StatActiveRules from './stats/StatActiveRules';
import StatCMDBActive from './stats/StatCMDBActive';
import StatCMDBMaintenance from './stats/StatCMDBMaintenance';
import StatCMDBOffline from './stats/StatCMDBOffline';
import StatCMDBTotal from './stats/StatCMDBTotal';
import StatExecAvgDuration from './stats/StatExecAvgDuration';
import StatExecRunning from './stats/StatExecRunning';
import StatExecSchedules from './stats/StatExecSchedules';
import StatExecSuccess from './stats/StatExecSuccess';
import StatExecTotal from './stats/StatExecTotal';
import StatGitRepos from './stats/StatGitRepos';
import StatHealingFlows from './stats/StatHealingFlows';
import StatHealingInstancesRunning from './stats/StatHealingInstancesRunning';
import StatHealingPendingApprovals from './stats/StatHealingPendingApprovals';
import StatHealingPendingTriggers from './stats/StatHealingPendingTriggers';
import StatHealingRate from './stats/StatHealingRate';
import StatHealingRulesTotal from './stats/StatHealingRulesTotal';
import StatIncidentPending from './stats/StatIncidentPending';
import StatIncidentToday from './stats/StatIncidentToday';
import StatIncidentTotal from './stats/StatIncidentTotal';
import StatIncidentUnscanned from './stats/StatIncidentUnscanned';
import StatInstanceTotal from './stats/StatInstanceTotal';
import StatNotifChannels from './stats/StatNotifChannels';
import StatNotifDeliveryRate from './stats/StatNotifDeliveryRate';
import StatPendingItems from './stats/StatPendingItems';
import StatPlaybooks from './stats/StatPlaybooks';
import StatPluginCount from './stats/StatPluginCount';
import StatPluginError from './stats/StatPluginError';
import StatPluginSyncRate from './stats/StatPluginSyncRate';
import StatSecrets from './stats/StatSecrets';
import StatUsers from './stats/StatUsers';

// ==================== 现有 Chart 组件 ====================
import ChartCMDBEnv from './charts/ChartCMDBEnv';
import ChartCMDBStatus from './charts/ChartCMDBStatus';
import ChartExecStatus from './charts/ChartExecStatus';
import ChartIncidentStatus from './charts/ChartIncidentStatus';
import ChartInstanceStatus from './charts/ChartInstanceStatus';
import ChartPluginHealth from './charts/ChartPluginHealth';

// ==================== 可复用 Chart 基础组件 ====================
import DashboardBarChart from './charts/DashboardBarChart';
import DashboardPieChart from './charts/DashboardPieChart';
import DashboardRankChart from './charts/DashboardRankChart';
import DashboardTrendChart from './charts/DashboardTrendChart';

// ==================== 现有 List 组件 ====================
import ListPendingApprovals from './lists/ListPendingApprovals';
import ListPendingTriggers from './lists/ListPendingTriggers';
import ListRecentInstances from './lists/ListRecentInstances';
import ListRecentNotifications from './lists/ListRecentNotifications';
import ListRecentRuns from './lists/ListRecentRuns';
import ListSchedules from './lists/ListSchedules';

// ==================== 通用 List 基础组件 ====================
import DashboardListWidget from './lists/DashboardListWidget';

// ==================== Status 组件 ====================
import StatusGitRepos from './status/StatusGitRepos';
import StatusPlugins from './status/StatusPlugins';
import StatusQuickActions from './status/StatusQuickActions';

// ==================== 类型定义 ====================

export interface WidgetComponentProps {
    widgetId: string;
    instanceId: string;
    isEditing?: boolean;
    onRemove?: () => void;
}

export interface WidgetDefinition {
    id: string;
    name: string;
    description: string;
    category: 'stat' | 'chart' | 'list' | 'status';
    section?: string; // 对应后端 section 名称
    icon: React.ReactNode;
    defaultLayout: { w: number; h: number; minW: number; minH: number };
    component: React.ComponentType<any>;
}

// ==================== Widget 注册表 ====================

const SEVERITY_LABELS: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低', info: '信息' };
const HEALING_STATUS_LABELS: Record<string, string> = {
    pending: '待处理', processing: '处理中', healed: '已自愈', failed: '失败',
    skipped: '已跳过', pending_trigger: '待触发', no_match: '未匹配', rejected: '已拒绝',
};

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
    // ======================================================================
    // S1: 工单/事件 (incidents) — 14 个
    // ======================================================================
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
        component: (props: any) => <DashboardPieChart section="incidents" field="by_healing_status" title="工单自愈状态分布" labelMap={HEALING_STATUS_LABELS} {...props} />,
    },
    'chart-incident-severity': {
        id: 'chart-incident-severity', name: '工单严重等级分布', description: '按严重等级分组的饼图',
        category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="incidents" field="by_severity" title="工单严重等级分布" labelMap={SEVERITY_LABELS} {...props} />,
    },
    'chart-incident-category': {
        id: 'chart-incident-category', name: '工单分类统计', description: '按分类分组的柱状图',
        category: 'chart', section: 'incidents', icon: <BarChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardBarChart section="incidents" field="by_category" title="工单分类统计" {...props} />,
    },
    'chart-incident-source': {
        id: 'chart-incident-source', name: '工单来源分布', description: '按来源插件分组的饼图',
        category: 'chart', section: 'incidents', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="incidents" field="by_source" title="工单来源分布" {...props} />,
    },
    'chart-incident-trend-7d': {
        id: 'chart-incident-trend-7d', name: '近7天工单趋势', description: '最近7天工单创建趋势',
        category: 'chart', section: 'incidents', icon: <LineChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardTrendChart section="incidents" field="trend_7d" title="近7天工单趋势" {...props} />,
    },
    'chart-incident-trend-30d': {
        id: 'chart-incident-trend-30d', name: '近30天工单趋势', description: '最近30天工单创建趋势',
        category: 'chart', section: 'incidents', icon: <FundOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardTrendChart section="incidents" field="trend_30d" title="近30天工单趋势" chartType="area" color="#fa8c16" {...props} />,
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
        component: (props: any) => <DashboardListWidget section="incidents" field="recent_incidents" title="最近工单" icon={<AlertOutlined />} {...props} />,
    },
    'list-incident-critical': {
        id: 'list-incident-critical', name: '紧急工单', description: 'severity=critical 的工单列表',
        category: 'list', section: 'incidents', icon: <WarningOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardListWidget section="incidents" field="critical_incidents" title="紧急工单" icon={<WarningOutlined />} {...props} />,
    },

    // ======================================================================
    // S2: 资产管理 (cmdb) — 12 个
    // ======================================================================
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
        component: (props: any) => <DashboardBarChart section="cmdb" field="by_type" title="资产类型分布" color="#722ed1" {...props} />,
    },
    'chart-cmdb-os': {
        id: 'chart-cmdb-os', name: '操作系统分布', description: '按 OS 分组的饼图',
        category: 'chart', section: 'cmdb', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="cmdb" field="by_os" title="操作系统分布" {...props} />,
    },
    'chart-cmdb-department': {
        id: 'chart-cmdb-department', name: '部门资产分布', description: '按部门分组的柱状图',
        category: 'chart', section: 'cmdb', icon: <BarChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardBarChart section="cmdb" field="by_department" title="部门资产分布" {...props} />,
    },
    'chart-cmdb-manufacturer': {
        id: 'chart-cmdb-manufacturer', name: '厂商分布', description: '按厂商分组的饼图',
        category: 'chart', section: 'cmdb', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="cmdb" field="by_manufacturer" title="厂商分布" {...props} />,
    },
    'list-cmdb-maintenance': {
        id: 'list-cmdb-maintenance', name: '最近维护记录', description: '最近的维护操作日志',
        category: 'list', section: 'cmdb', icon: <ToolOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardListWidget section="cmdb" field="recent_maintenance" title="最近维护记录" icon={<ToolOutlined />} {...props} />,
    },
    'list-cmdb-offline': {
        id: 'list-cmdb-offline', name: '离线资产列表', description: '当前离线的资产',
        category: 'list', section: 'cmdb', icon: <DisconnectOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardListWidget section="cmdb" field="offline_assets" title="离线资产列表" icon={<DisconnectOutlined />} {...props} />,
    },

    // ======================================================================
    // S3: 自愈引擎 (healing) — 16 个
    // ======================================================================
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
        component: (props: any) => <DashboardTrendChart section="healing" field="instance_trend_7d" title="近7天实例趋势" color="#722ed1" {...props} />,
    },
    'chart-approval-status': {
        id: 'chart-approval-status', name: '审批状态分布', description: '审批任务按状态分组',
        category: 'chart', section: 'healing', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="healing" field="approvals_by_status" title="审批状态分布" {...props} />,
    },
    'chart-rule-trigger-mode': {
        id: 'chart-rule-trigger-mode', name: '规则触发模式', description: '规则按触发模式分组',
        category: 'chart', section: 'healing', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="healing" field="rules_by_trigger_mode" title="规则触发模式" {...props} />,
    },
    'chart-flow-top10': {
        id: 'chart-flow-top10', name: '流程触发排行 TOP10', description: '按触发次数排序的流程排行榜',
        category: 'chart', section: 'healing', icon: <OrderedListOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardRankChart section="healing" field="flow_top10" title="流程触发排行 TOP10" {...props} />,
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

    // ======================================================================
    // S4: 执行管理 (execution) — 14 个
    // ======================================================================
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
        component: (props: any) => <DashboardTrendChart section="execution" field="trend_7d" title="近7天执行趋势" color="#52c41a" {...props} />,
    },
    'chart-exec-trend-30d': {
        id: 'chart-exec-trend-30d', name: '近30天执行趋势', description: '最近30天执行记录趋势',
        category: 'chart', section: 'execution', icon: <FundOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardTrendChart section="execution" field="trend_30d" title="近30天执行趋势" chartType="area" color="#13c2c2" {...props} />,
    },
    'chart-exec-schedule-type': {
        id: 'chart-exec-schedule-type', name: '定时任务类型', description: '按调度类型分组的饼图',
        category: 'chart', section: 'execution', icon: <PieChartOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardPieChart section="execution" field="schedules_by_type" title="定时任务类型" {...props} />,
    },
    'chart-exec-task-top10': {
        id: 'chart-exec-task-top10', name: '任务执行排行 TOP10', description: '按执行次数排序的任务排行榜',
        category: 'chart', section: 'execution', icon: <OrderedListOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
        component: (props: any) => <DashboardRankChart section="execution" field="task_top10" title="任务执行排行 TOP10" color="#1677ff" {...props} />,
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
        component: (props: any) => <DashboardListWidget section="execution" field="failed_runs" title="失败执行记录" icon={<WarningOutlined />} {...props} />,
    },
    'list-schedules': {
        id: 'list-schedules', name: '定时任务列表', description: '当前配置的定时调度任务',
        category: 'list', section: 'execution', icon: <ScheduleOutlined />,
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 }, component: ListSchedules,
    },

    // ======================================================================
    // S5: 插件管理 (plugins) — 10 个
    // ======================================================================
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

    // ======================================================================
    // S6: 通知管理 (notifications) — 8 个
    // ======================================================================
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

    // ======================================================================
    // S7: Git 仓库 (git) — 4 个
    // ======================================================================
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

    // ======================================================================
    // S8: Playbook — 4 个
    // ======================================================================
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

    // ======================================================================
    // S9: 密钥管理 (secrets) — 4 个
    // ======================================================================
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

    // ======================================================================
    // S10: 用户与权限 (users) — 4 个
    // ======================================================================
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

    // ======================================================================
    // 系统状态 — 1 个
    // ======================================================================
    'status-quick-actions': {
        id: 'status-quick-actions', name: '快速操作', description: '常用操作的快捷入口',
        category: 'status', icon: <ToolOutlined />,
        defaultLayout: { w: 6, h: 3, minW: 3, minH: 3 }, component: StatusQuickActions,
    },
};

// ==================== 分类工具 ====================

export const WIDGET_CATEGORIES = [
    { key: 'stat', label: '📊 核心指标', description: '关键 KPI 数值卡片' },
    { key: 'chart', label: '📈 图表', description: '可视化数据图表' },
    { key: 'list', label: '📋 列表', description: '实时数据列表' },
    { key: 'status', label: '🔌 系统状态', description: '系统组件状态面板' },
] as const;

export const WIDGET_SECTIONS = [
    { key: 'incidents', label: '🚨 工单/事件', count: 14 },
    { key: 'cmdb', label: '🖥️ 资产管理', count: 12 },
    { key: 'healing', label: '🩺 自愈引擎', count: 17 },
    { key: 'execution', label: '⚡ 执行管理', count: 14 },
    { key: 'plugins', label: '🔌 插件管理', count: 10 },
    { key: 'notifications', label: '🔔 通知管理', count: 7 },
    { key: 'git', label: '📦 Git 仓库', count: 4 },
    { key: 'playbooks', label: '📝 Playbook', count: 3 },
    { key: 'secrets', label: '🔑 密钥管理', count: 3 },
    { key: 'users', label: '👥 用户权限', count: 2 },
] as const;

export function getWidgetsByCategory(category: string): WidgetDefinition[] {
    return Object.values(WIDGET_REGISTRY).filter((w) => w.category === category);
}

export function getWidgetsBySection(section: string): WidgetDefinition[] {
    return Object.values(WIDGET_REGISTRY).filter((w) => w.section === section);
}

/**
 * 根据 Widget 列表自动提取需要的 section 集合
 */
export function getRequiredSections(widgetIds: string[]): string[] {
    const sections = new Set<string>();
    for (const id of widgetIds) {
        const widget = WIDGET_REGISTRY[id];
        if (widget?.section) {
            sections.add(widget.section);
        }
    }
    return Array.from(sections);
}
