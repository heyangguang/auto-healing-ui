import React from 'react';
import {
    AlertOutlined,
    AppstoreOutlined,
    AuditOutlined,
    BankOutlined,
    BarChartOutlined,
    BellOutlined,
    BranchesOutlined,
    CheckCircleOutlined,
    CloudServerOutlined,
    CloseCircleOutlined,
    DashboardOutlined,
    DatabaseOutlined,
    FundProjectionScreenOutlined,
    KeyOutlined,
    NodeIndexOutlined,
    PieChartOutlined,
    PlayCircleOutlined,
    ScheduleOutlined,
    TeamOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { Badge, Tooltip } from 'antd';
import dayjs from 'dayjs';
import {
    getTenantConfiguredModuleCount,
    getTenantHealingFailureCount,
    getTenantTotalResources,
    getTenantUncoveredIncidentCount,
    toSafeCount,
    type TenantStatsItem,
} from './tenantMetrics';

type MetricItem = {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
};

type MetricSection = {
    title: string;
    iconBg: string;
    badgeColor: string;
    badgeBg: string;
    badgeText: string;
    items: MetricItem[];
};

const TenantOpsExpandedRow: React.FC<{ record: TenantStatsItem }> = ({ record }) => {
    const memberCount = toSafeCount(record.member_count);
    const ruleCount = toSafeCount(record.rule_count);
    const flowCount = toSafeCount(record.flow_count);
    const instanceCount = toSafeCount(record.instance_count);
    const templateCount = toSafeCount(record.template_count);
    const playbookCount = toSafeCount(record.playbook_count);
    const cmdbCount = toSafeCount(record.cmdb_count);
    const secretCount = toSafeCount(record.secret_count);
    const gitCount = toSafeCount(record.git_count);
    const pluginCount = toSafeCount(record.plugin_count);
    const notificationChannelCount = toSafeCount(record.notification_channel_count);
    const notificationTemplateCount = toSafeCount(record.notification_template_count);
    const incidentCount = toSafeCount(record.incident_count);
    const healingSuccessCount = toSafeCount(record.healing_success_count);
    const healingTotalCount = toSafeCount(record.healing_total_count);

    const totalConfig = 10;
    const configured = getTenantConfiguredModuleCount(record);
    const configuredPct = Math.round((configured / totalConfig) * 100);

    const sections: MetricSection[] = [
        {
            title: '自动化引擎',
            iconBg: '#fa8c16',
            badgeColor: '#d46b08',
            badgeBg: '#fff7e6',
            badgeText: `${ruleCount} 规则 · ${flowCount} 流程 · ${instanceCount} 实例`,
            items: [
                { label: '自愈规则', value: ruleCount, icon: <ThunderboltOutlined />, iconBg: '#fff7e6', iconColor: '#fa8c16' },
                { label: '自愈流程', value: flowCount, icon: <BranchesOutlined />, iconBg: '#f9f0ff', iconColor: '#722ed1' },
                { label: '自愈实例', value: instanceCount, icon: <PlayCircleOutlined />, iconBg: '#e6fffb', iconColor: '#08979c' },
                { label: '自愈成功', value: healingSuccessCount, icon: <CheckCircleOutlined />, iconBg: '#f6ffed', iconColor: '#52c41a' },
                { label: '任务模板', value: templateCount, icon: <AppstoreOutlined />, iconBg: '#fff0f6', iconColor: '#c41d7f' },
                { label: 'Playbook', value: playbookCount, icon: <AppstoreOutlined />, iconBg: '#f6ffed', iconColor: '#389e0d' },
                { label: '定时任务', value: toSafeCount(record.schedule_count), icon: <ScheduleOutlined />, iconBg: '#f0f5ff', iconColor: '#1d39c4' },
                { label: '工单触发', value: incidentCount, icon: <AlertOutlined />, iconBg: '#fff1f0', iconColor: '#cf1322' },
            ],
        },
        {
            title: '基础设施',
            iconBg: '#1677ff',
            badgeColor: '#096dd9',
            badgeBg: '#e6f4ff',
            badgeText: `${cmdbCount} 主机 · ${pluginCount} 插件`,
            items: [
                { label: 'CMDB 主机', value: cmdbCount, icon: <CloudServerOutlined />, iconBg: '#e6f4ff', iconColor: '#1677ff' },
                { label: '凭据密钥', value: secretCount, icon: <KeyOutlined />, iconBg: '#fcf4e6', iconColor: '#ad6800' },
                { label: '代码仓库', value: gitCount, icon: <BranchesOutlined />, iconBg: '#f6ffed', iconColor: '#237804' },
                { label: '插件集成', value: pluginCount, icon: <DatabaseOutlined />, iconBg: '#f9f0ff', iconColor: '#531dab' },
                { label: '通知渠道', value: notificationChannelCount, icon: <BellOutlined />, iconBg: '#e6fffb', iconColor: '#006d75' },
                { label: '通知模板', value: notificationTemplateCount, icon: <BellOutlined />, iconBg: '#f0f5ff', iconColor: '#10239e' },
                { label: '总资源数', value: getTenantTotalResources(record), icon: <FundProjectionScreenOutlined />, iconBg: '#fff0f6', iconColor: '#c41d7f' },
                { label: '总通知数', value: notificationChannelCount + notificationTemplateCount, icon: <BarChartOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
            ],
        },
        {
            title: '运营指标',
            iconBg: '#722ed1',
            badgeColor: '#531dab',
            badgeBg: '#f9f0ff',
            badgeText: `${memberCount} 成员 · ${toSafeCount(record.audit_log_count)} 审计`,
            items: [
                { label: '团队成员', value: memberCount, icon: <TeamOutlined />, iconBg: '#e6f4ff', iconColor: '#0958d9' },
                { label: '审计日志', value: toSafeCount(record.audit_log_count), icon: <AuditOutlined />, iconBg: '#f9f0ff', iconColor: '#722ed1' },
                { label: '自愈执行', value: healingTotalCount, icon: <NodeIndexOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
                { label: '自愈失败', value: getTenantHealingFailureCount(record), icon: <CloseCircleOutlined />, iconBg: '#fff1f0', iconColor: '#cf1322' },
                { label: '未覆盖工单', value: getTenantUncoveredIncidentCount(record), icon: <AlertOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
                { label: '人均资源', value: memberCount > 0 ? Math.round(getTenantTotalResources(record) / memberCount) : 0, icon: <PieChartOutlined />, iconBg: '#e6f4ff', iconColor: '#1677ff' },
                { label: '人均审计', value: memberCount > 0 ? Math.round(toSafeCount(record.audit_log_count) / memberCount) : 0, icon: <BarChartOutlined />, iconBg: '#e6fffb', iconColor: '#08979c' },
                { label: '规则密度', value: cmdbCount > 0 ? (ruleCount / cmdbCount).toFixed(1) : '—', icon: <DashboardOutlined />, iconBg: '#fff7e6', iconColor: '#d48806' },
            ],
        },
    ];

    return (
        <div className="ops-expand-panel">
            <div className="ops-expand-grid">
                <div className="ops-expand-section">
                    <div className="ops-expand-section-header">
                        <div className="ops-expand-section-header-icon" style={{ background: '#1a1a2e' }}>
                            <BankOutlined />
                        </div>
                        <span className="ops-expand-section-header-title">基本信息</span>
                        <span
                            className="ops-expand-section-header-badge"
                            style={{
                                color: record.status === 'active' ? '#389e0d' : '#8c8c8c',
                                background: record.status === 'active' ? '#f6ffed' : '#f5f5f5',
                            }}
                        >
                            {record.status === 'active' ? '● 正常' : '○ 停用'}
                        </span>
                    </div>
                    <div className="ops-expand-section-body ops-info-body">
                        <div className="ops-info-row">
                            <span className="ops-info-label">租户代码</span>
                            <span className="ops-info-value">{record.code}</span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">状态</span>
                            <span className="ops-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14 }}>{record.status === 'active' ? '正常运行' : '已停用'}</span>
                                <Badge status={record.status === 'active' ? 'success' : 'default'} />
                            </span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">最近活动</span>
                            <span className="ops-info-value">
                                {record.last_activity_at
                                    ? <Tooltip title={dayjs(record.last_activity_at).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(record.last_activity_at).fromNow()}</Tooltip>
                                    : '—'}
                            </span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">总资源</span>
                            <span className="ops-info-value" style={{ fontWeight: 700 }}>{getTenantTotalResources(record)}</span>
                        </div>
                        <div className="ops-progress-wrap">
                            <div className="ops-progress-header">
                                <span className="ops-progress-label">配置覆盖率</span>
                                <span
                                    className="ops-progress-pct"
                                    style={{ color: configuredPct >= 80 ? '#389e0d' : configuredPct >= 50 ? '#d48806' : '#cf1322' }}
                                >
                                    {configuredPct}%
                                </span>
                            </div>
                            <div className="ops-progress-track">
                                <div
                                    className="ops-progress-fill"
                                    style={{
                                        width: `${configuredPct}%`,
                                        background: configuredPct >= 80
                                            ? 'linear-gradient(90deg, #52c41a, #73d13d)'
                                            : configuredPct >= 50
                                                ? 'linear-gradient(90deg, #faad14, #ffc53d)'
                                                : 'linear-gradient(90deg, #ff4d4f, #ff7a7a)',
                                    }}
                                />
                            </div>
                            <div style={{ marginTop: 4, fontSize: 10, color: '#b0b0b0' }}>
                                已配置 {configured}/{totalConfig} 项功能模块
                            </div>
                        </div>
                    </div>
                </div>
                {sections.map((section) => (
                    <div className="ops-expand-section" key={section.title}>
                        <div className="ops-expand-section-header">
                            <div className="ops-expand-section-header-icon" style={{ background: section.iconBg }}>
                                {section.items[0].icon}
                            </div>
                            <span className="ops-expand-section-header-title">{section.title}</span>
                            <span
                                className="ops-expand-section-header-badge"
                                style={{ color: section.badgeColor, background: section.badgeBg }}
                            >
                                {section.badgeText}
                            </span>
                        </div>
                        <div className="ops-expand-section-body">
                            {section.items.map((item) => (
                                <div className="ops-metric-item" key={item.label}>
                                    <div className="ops-metric-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                                        {item.icon}
                                    </div>
                                    <div className="ops-metric-info">
                                        <div className="ops-metric-label">{item.label}</div>
                                        <div className="ops-metric-value" style={{ color: Number(item.value) > 0 ? '#1a1a2e' : '#d9d9d9' }}>
                                            {item.value}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TenantOpsExpandedRow;
