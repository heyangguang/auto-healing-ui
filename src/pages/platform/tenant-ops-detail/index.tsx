import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {
    Table, Badge, Avatar, Typography, Tooltip,
} from 'antd';
import {
    TeamOutlined, SafetyCertificateOutlined, ThunderboltOutlined, CloudServerOutlined,
    BellOutlined, AuditOutlined, KeyOutlined, BranchesOutlined, AppstoreOutlined,
    PlayCircleOutlined, BankOutlined, CheckCircleOutlined, CloseCircleOutlined,
    DatabaseOutlined, ScheduleOutlined, AlertOutlined, QuestionCircleOutlined,
    PieChartOutlined, RiseOutlined, DashboardOutlined, FundProjectionScreenOutlined,
    BarChartOutlined, NodeIndexOutlined,
    ShopOutlined, CloudOutlined, ApartmentOutlined, ToolOutlined, GlobalOutlined,
    RocketOutlined, HomeOutlined, BulbOutlined, SafetyOutlined, ApiOutlined,
    DeploymentUnitOutlined, ClusterOutlined, ExperimentOutlined, MonitorOutlined,
    CodeOutlined, BuildOutlined, FundOutlined, TrophyOutlined, StarOutlined,
    ProductOutlined, FireOutlined, CustomerServiceOutlined, ControlOutlined,
    SendOutlined, FolderOpenOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import StandardTable from '@/components/StandardTable';
import type { SearchField } from '@/components/StandardTable';
import { getTenantStats } from '@/services/auto-healing/platform/tenants';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import '../../../pages/execution/git-repos/index.css';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

/* ── 类型定义 ── */
/* ── 租户图标映射（与 TenantSwitcher 保持一致） ── */
const ICON_MAP: Record<string, React.ReactNode> = {
    bank: <BankOutlined />, shop: <ShopOutlined />, team: <TeamOutlined />,
    cloud: <CloudOutlined />, apartment: <ApartmentOutlined />, tool: <ToolOutlined />,
    global: <GlobalOutlined />, rocket: <RocketOutlined />, home: <HomeOutlined />,
    bulb: <BulbOutlined />, safety: <SafetyOutlined />, thunder: <ThunderboltOutlined />,
    database: <DatabaseOutlined />, api: <ApiOutlined />, deployment: <DeploymentUnitOutlined />,
    cluster: <ClusterOutlined />, dashboard: <DashboardOutlined />, experiment: <ExperimentOutlined />,
    monitor: <MonitorOutlined />, code: <CodeOutlined />, build: <BuildOutlined />,
    fund: <FundOutlined />, trophy: <TrophyOutlined />, star: <StarOutlined />,
    product: <ProductOutlined />, alert: <AlertOutlined />, audit: <AuditOutlined />,
    fire: <FireOutlined />, service: <CustomerServiceOutlined />, control: <ControlOutlined />,
    send: <SendOutlined />, folder: <FolderOpenOutlined />,
};

interface TenantStatsItem {
    id: string; name: string; code: string; status: string; icon?: string;
    member_count: number; rule_count: number; instance_count: number;
    template_count: number; audit_log_count: number; last_activity_at: string | null;
    cmdb_count: number; git_count: number; playbook_count: number;
    secret_count: number; plugin_count: number; incident_count: number;
    flow_count: number; schedule_count: number;
    notification_channel_count: number; notification_template_count: number;
    /* 自愈 KPI */
    healing_success_count: number; healing_total_count: number;
    incident_covered_count: number;
}



/* ── 搜索字段 ── */
const searchFields: SearchField[] = [
    { key: 'name', label: '租户名称' },
    { key: 'code', label: '租户代码' },
    { key: 'status', label: '租户状态', options: [{ label: '正常', value: 'active' }, { label: '停用', value: 'disabled' }] },
];

/* ── Header Icon ── */
const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="8" width="40" height="32" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
        <line x1="4" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="24" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x="26" y="24" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="16" cy="13" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <circle cx="24" cy="13" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
);

/* ── 展开行：AWX 风格租户详情面板 ── */
const ExpandedRow: React.FC<{ record: TenantStatsItem }> = ({ record }) => {
    const t = record;

    const totalConfig = 10;
    const configured = [
        t.rule_count > 0, t.template_count > 0, t.flow_count > 0, t.schedule_count > 0,
        t.cmdb_count > 0, t.secret_count > 0, t.git_count > 0, t.plugin_count > 0,
        t.notification_channel_count > 0, t.playbook_count > 0,
    ].filter(Boolean).length;
    const pct = Math.round(configured / totalConfig * 100);

    const sections: {
        title: string; iconBg: string; badgeColor: string; badgeBg: string; badgeText: string;
        items: { label: string; value: number | string; icon: React.ReactNode; iconBg: string; iconColor: string }[];
    }[] = [
            {
                title: '自动化引擎', iconBg: '#fa8c16', badgeColor: '#d46b08', badgeBg: '#fff7e6', badgeText: `${t.rule_count} 规则 · ${t.flow_count} 流程 · ${t.instance_count} 实例`,
                items: [
                    { label: '自愈规则', value: t.rule_count, icon: <ThunderboltOutlined />, iconBg: '#fff7e6', iconColor: '#fa8c16' },
                    { label: '自愈流程', value: t.flow_count, icon: <BranchesOutlined />, iconBg: '#f9f0ff', iconColor: '#722ed1' },
                    { label: '自愈实例', value: t.instance_count, icon: <PlayCircleOutlined />, iconBg: '#e6fffb', iconColor: '#08979c' },
                    { label: '自愈成功', value: t.healing_success_count, icon: <CheckCircleOutlined />, iconBg: '#f6ffed', iconColor: '#52c41a' },
                    { label: '任务模板', value: t.template_count, icon: <AppstoreOutlined />, iconBg: '#fff0f6', iconColor: '#c41d7f' },
                    { label: 'Playbook', value: t.playbook_count, icon: <AppstoreOutlined />, iconBg: '#f6ffed', iconColor: '#389e0d' },
                    { label: '定时任务', value: t.schedule_count, icon: <ScheduleOutlined />, iconBg: '#f0f5ff', iconColor: '#1d39c4' },
                    { label: '工单触发', value: t.incident_count, icon: <AlertOutlined />, iconBg: '#fff1f0', iconColor: '#cf1322' },
                ],
            },
            {
                title: '基础设施', iconBg: '#1677ff', badgeColor: '#096dd9', badgeBg: '#e6f4ff', badgeText: `${t.cmdb_count} 主机 · ${t.plugin_count} 插件`,
                items: [
                    { label: 'CMDB 主机', value: t.cmdb_count, icon: <CloudServerOutlined />, iconBg: '#e6f4ff', iconColor: '#1677ff' },
                    { label: '凭据密钥', value: t.secret_count, icon: <KeyOutlined />, iconBg: '#fcf4e6', iconColor: '#ad6800' },
                    { label: '代码仓库', value: t.git_count, icon: <BranchesOutlined />, iconBg: '#f6ffed', iconColor: '#237804' },
                    { label: '插件集成', value: t.plugin_count, icon: <DatabaseOutlined />, iconBg: '#f9f0ff', iconColor: '#531dab' },
                    { label: '通知渠道', value: t.notification_channel_count, icon: <BellOutlined />, iconBg: '#e6fffb', iconColor: '#006d75' },
                    { label: '通知模板', value: t.notification_template_count, icon: <BellOutlined />, iconBg: '#f0f5ff', iconColor: '#10239e' },
                    { label: '总资源数', value: t.cmdb_count + t.template_count + t.playbook_count + t.secret_count + t.plugin_count + t.git_count, icon: <FundProjectionScreenOutlined />, iconBg: '#fff0f6', iconColor: '#c41d7f' },
                    { label: '总通知数', value: t.notification_channel_count + t.notification_template_count, icon: <BarChartOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
                ],
            },
            {
                title: '运营指标', iconBg: '#722ed1', badgeColor: '#531dab', badgeBg: '#f9f0ff', badgeText: `${t.member_count} 成员 · ${t.audit_log_count} 审计`,
                items: [
                    { label: '团队成员', value: t.member_count, icon: <TeamOutlined />, iconBg: '#e6f4ff', iconColor: '#0958d9' },
                    { label: '审计日志', value: t.audit_log_count, icon: <AuditOutlined />, iconBg: '#f9f0ff', iconColor: '#722ed1' },
                    { label: '自愈执行', value: t.healing_total_count, icon: <NodeIndexOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
                    { label: '自愈失败', value: t.healing_total_count - t.healing_success_count, icon: <CloseCircleOutlined />, iconBg: '#fff1f0', iconColor: '#cf1322' },
                    { label: '未覆盖工单', value: t.incident_count - t.incident_covered_count, icon: <AlertOutlined />, iconBg: '#fff2e8', iconColor: '#d4380d' },
                    { label: '人均资源', value: t.member_count > 0 ? Math.round((t.cmdb_count + t.template_count + t.playbook_count + t.secret_count + t.plugin_count + t.git_count) / t.member_count) : 0, icon: <PieChartOutlined />, iconBg: '#e6f4ff', iconColor: '#1677ff' },
                    { label: '人均审计', value: t.member_count > 0 ? Math.round(t.audit_log_count / t.member_count) : 0, icon: <BarChartOutlined />, iconBg: '#e6fffb', iconColor: '#08979c' },
                    { label: '规则密度', value: t.cmdb_count > 0 ? (t.rule_count / t.cmdb_count).toFixed(1) : '—', icon: <DashboardOutlined />, iconBg: '#fff7e6', iconColor: '#d48806' },
                ],
            },
        ];

    return (
        <div className="ops-expand-panel">
            <div className="ops-expand-grid">
                {/* 基本信息 */}
                <div className="ops-expand-section">
                    <div className="ops-expand-section-header">
                        <div className="ops-expand-section-header-icon" style={{ background: '#1a1a2e' }}>
                            <BankOutlined />
                        </div>
                        <span className="ops-expand-section-header-title">基本信息</span>
                        <span className="ops-expand-section-header-badge"
                            style={{
                                color: t.status === 'active' ? '#389e0d' : '#8c8c8c',
                                background: t.status === 'active' ? '#f6ffed' : '#f5f5f5',
                            }}>
                            {t.status === 'active' ? '● 正常' : '○ 停用'}
                        </span>
                    </div>
                    <div className="ops-expand-section-body ops-info-body">
                        <div className="ops-info-row">
                            <span className="ops-info-label">租户代码</span>
                            <span className="ops-info-value">{t.code}</span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">状态</span>
                            <span className="ops-info-value" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14 }}>{t.status === 'active' ? '正常运行' : '已停用'}</span>
                                <Badge status={t.status === 'active' ? 'success' : 'default'} />
                            </span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">最近活动</span>
                            <span className="ops-info-value">
                                {t.last_activity_at
                                    ? <Tooltip title={dayjs(t.last_activity_at).format('YYYY-MM-DD HH:mm:ss')}>{dayjs(t.last_activity_at).fromNow()}</Tooltip>
                                    : '—'}
                            </span>
                        </div>
                        <div className="ops-info-row">
                            <span className="ops-info-label">总资源</span>
                            <span className="ops-info-value" style={{ fontWeight: 700 }}>
                                {t.cmdb_count + t.template_count + t.playbook_count + t.secret_count + t.plugin_count + t.git_count}
                            </span>
                        </div>
                        <div className="ops-progress-wrap">
                            <div className="ops-progress-header">
                                <span className="ops-progress-label">配置覆盖率</span>
                                <span className="ops-progress-pct" style={{
                                    color: pct >= 80 ? '#389e0d' : pct >= 50 ? '#d48806' : '#cf1322',
                                }}>{pct}%</span>
                            </div>
                            <div className="ops-progress-track">
                                <div className="ops-progress-fill" style={{
                                    width: `${pct}%`,
                                    background: pct >= 80 ? 'linear-gradient(90deg, #52c41a, #73d13d)' : pct >= 50 ? 'linear-gradient(90deg, #faad14, #ffc53d)' : 'linear-gradient(90deg, #ff4d4f, #ff7a7a)',
                                }} />
                            </div>
                            <div style={{ marginTop: 4, fontSize: 10, color: '#b0b0b0' }}>
                                已配置 {configured}/{totalConfig} 项功能模块
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3 个指标面板 */}
                {sections.map(sec => (
                    <div className="ops-expand-section" key={sec.title}>
                        <div className="ops-expand-section-header">
                            <div className="ops-expand-section-header-icon" style={{ background: sec.iconBg }}>
                                {sec.items[0].icon}
                            </div>
                            <span className="ops-expand-section-header-title">{sec.title}</span>
                            <span className="ops-expand-section-header-badge"
                                style={{ color: sec.badgeColor, background: sec.badgeBg }}>
                                {sec.badgeText}
                            </span>
                        </div>
                        <div className="ops-expand-section-body">
                            {sec.items.map(item => (
                                <div className="ops-metric-item" key={item.label}>
                                    <div className="ops-metric-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                                        {item.icon}
                                    </div>
                                    <div className="ops-metric-info">
                                        <div className="ops-metric-label">{item.label}</div>
                                        <div className="ops-metric-value" style={{
                                            color: Number(item.value) > 0 ? '#1a1a2e' : '#d9d9d9',
                                        }}>{item.value}</div>
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

/* ══════════════════════════════════════════════════
   主页面
   ══════════════════════════════════════════════════ */
const TenantOpsDetailPage: React.FC = () => {
    const [searchParams, setSearchParams] = useState<Record<string, string>>({});
    const [tenants, setTenants] = useState<TenantStatsItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getTenantStats();
            const data = res?.data || res;
            setTenants(data?.tenants || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, []);

    /* 搜索过滤 */
    const filteredTenants = useMemo(() => {
        let result = [...tenants];
        if (searchParams.name) result = result.filter(t => t.name.toLowerCase().includes(searchParams.name.toLowerCase()));
        if (searchParams.code) result = result.filter(t => t.code.toLowerCase().includes(searchParams.code.toLowerCase()));
        if (searchParams.status) result = result.filter(t => t.status === searchParams.status);
        return result;
    }, [tenants, searchParams]);

    /* 统计数据 */
    const stats = useMemo(() => {
        const total = filteredTenants.length;
        const active = filteredTenants.filter(t => t.status === 'active').length;
        const inactive = total - active;
        const totalMembers = filteredTenants.reduce((s, t) => s + t.member_count, 0);
        const totalRules = filteredTenants.reduce((s, t) => s + t.rule_count, 0);
        const totalAudit = filteredTenants.reduce((s, t) => s + t.audit_log_count, 0);
        return { total, active, inactive, totalMembers, totalRules, totalAudit };
    }, [filteredTenants]);

    /* 统计条 */
    const statsBar = useMemo(() => {
        const items = [
            { icon: <BankOutlined />, cls: 'total', val: stats.total, lbl: '全部租户' },
            { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.active, lbl: '活跃' },
            { icon: <CloseCircleOutlined />, cls: 'error', val: stats.inactive, lbl: '停用' },
            { icon: <TeamOutlined />, cls: 'total', val: stats.totalMembers, lbl: '总用户' },
            { icon: <ThunderboltOutlined />, cls: 'ready', val: stats.totalRules, lbl: '总规则' },
            { icon: <SafetyCertificateOutlined />, cls: 'total', val: stats.totalAudit, lbl: '审计事件' },
        ];
        return (
            <div className="git-stats-bar">
                {items.map((s, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <div className="git-stat-divider" />}
                        <div className="git-stat-item">
                            <span className={`git-stat-icon git-stat-icon-${s.cls}`}>{s.icon}</span>
                            <div className="git-stat-content">
                                <div className="git-stat-value">{s.val}</div>
                                <div className="git-stat-label">{s.lbl}</div>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    }, [stats]);

    /* 表格列定义 */
    const columns: ColumnsType<TenantStatsItem> = useMemo(() => [
        {
            title: '租户', dataIndex: 'name', key: 'name', width: 160, fixed: 'left',
            render: (name: string, r) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, color: '#5B5FC7', flexShrink: 0 }}>
                        {(r.icon && ICON_MAP[r.icon]) ?? <BankOutlined />}
                    </span>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#262626' }}
                            onClick={(e) => { e.stopPropagation(); history.push(`/platform/tenants/${r.id}/members`); }}
                        >{name}</div>
                        <div style={{ fontSize: 11, color: '#b0b0b0' }}>{r.code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: '状态', dataIndex: 'status', key: 'status', width: 72, align: 'center',
            render: (s: string) => <Badge status={s === 'active' ? 'success' : 'default'} text={s === 'active' ? '正常' : '停用'} />,
        },
        {
            title: '成员', dataIndex: 'member_count', key: 'members', width: 60, align: 'center',
            sorter: (a, b) => a.member_count - b.member_count,
            render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#262626' : '#d9d9d9' }}>{v}</span>,
        },
        {
            title: () => (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    总资源
                    <Tooltip title="CMDB 主机 + 任务模板 + Playbook + 凭据密钥 + 插件 + 代码仓库">
                        <QuestionCircleOutlined style={{ fontSize: 12, color: '#bfbfbf', cursor: 'help' }} />
                    </Tooltip>
                </span>
            ),
            key: 'total_resources', width: 95, align: 'center',
            sorter: (a, b) => {
                const sum = (t: TenantStatsItem) => t.cmdb_count + t.template_count + t.playbook_count + t.secret_count + t.plugin_count + t.git_count;
                return sum(a) - sum(b);
            },
            render: (_: any, r) => {
                const total = r.cmdb_count + r.template_count + r.playbook_count + r.secret_count + r.plugin_count + r.git_count;
                return (
                    <Tooltip title={`CMDB ${r.cmdb_count} · 模板 ${r.template_count} · Playbook ${r.playbook_count} · 凭据 ${r.secret_count} · 插件 ${r.plugin_count} · 仓库 ${r.git_count}`}>
                        <span style={{ fontWeight: 600, color: total > 0 ? '#1677ff' : '#d9d9d9' }}>{total}</span>
                    </Tooltip>
                );
            },
        },
        {
            title: '自动化', key: 'automation', width: 150,
            sorter: (a, b) => (a.rule_count + a.flow_count) - (b.rule_count + b.flow_count),
            render: (_: any, r) => {
                const auto = r.rule_count + r.flow_count;
                if (auto === 0 && r.instance_count === 0) return <span style={{ color: '#d9d9d9' }}>—</span>;
                return (
                    <span style={{ fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: '#fa8c16' }}>{r.rule_count}</span>
                        <span style={{ color: '#b0b0b0' }}> 规则 · </span>
                        <span style={{ fontWeight: 600, color: '#722ed1' }}>{r.flow_count}</span>
                        <span style={{ color: '#b0b0b0' }}> 流程 · </span>
                        <span style={{ fontWeight: 600, color: '#13c2c2' }}>{r.instance_count}</span>
                        <span style={{ color: '#b0b0b0' }}> 实例</span>
                    </span>
                );
            },
        },
        {
            title: '审计', dataIndex: 'audit_log_count', key: 'audit', width: 65, align: 'center',
            sorter: (a, b) => a.audit_log_count - b.audit_log_count,
            render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#722ed1' : '#d9d9d9' }}>{v}</span>,
        },
        {
            title: '自愈成功率', key: 'healing_rate', width: 105,
            sorter: (a, b) => {
                const rA = a.healing_total_count > 0 ? a.healing_success_count / a.healing_total_count : 0;
                const rB = b.healing_total_count > 0 ? b.healing_success_count / b.healing_total_count : 0;
                return rA - rB;
            },
            render: (_: any, r) => {
                if (r.healing_total_count === 0) return <Text type="secondary">—</Text>;
                const pct = Math.round(r.healing_success_count / r.healing_total_count * 100);
                return (
                    <Tooltip title={`成功 ${r.healing_success_count} / 总共 ${r.healing_total_count} 次`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 0, background: '#f0f2f5', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 0, width: `${pct}%`,
                                    background: pct >= 90 ? '#52c41a' : pct >= 70 ? '#faad14' : '#ff4d4f',
                                }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 90 ? '#389e0d' : pct >= 70 ? '#d48806' : '#cf1322', minWidth: 32 }}>{pct}%</span>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: '自愈覆盖', key: 'healing_coverage', width: 105,
            sorter: (a, b) => {
                const rA = a.incident_count > 0 ? a.incident_covered_count / a.incident_count : 0;
                const rB = b.incident_count > 0 ? b.incident_covered_count / b.incident_count : 0;
                return rA - rB;
            },
            render: (_: any, r) => {
                if (r.incident_count === 0) return <Text type="secondary">—</Text>;
                const pct = Math.round(r.incident_covered_count / r.incident_count * 100);
                return (
                    <Tooltip title={`规则覆盖 ${r.incident_covered_count} / 总工单 ${r.incident_count} 件`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 0, background: '#f0f2f5', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 0, width: `${pct}%`,
                                    background: pct >= 80 ? '#1677ff' : pct >= 50 ? '#faad14' : '#ff4d4f',
                                }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 80 ? '#0958d9' : pct >= 50 ? '#d48806' : '#cf1322', minWidth: 32 }}>{pct}%</span>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: '配置覆盖', key: 'coverage', width: 105,
            sorter: (a, b) => {
                const calc = (t: TenantStatsItem) => [t.rule_count > 0, t.template_count > 0, t.flow_count > 0, t.schedule_count > 0, t.cmdb_count > 0, t.secret_count > 0, t.git_count > 0, t.plugin_count > 0, t.notification_channel_count > 0, t.playbook_count > 0].filter(Boolean).length;
                return calc(a) - calc(b);
            },
            render: (_: any, r) => {
                const configured = [r.rule_count > 0, r.template_count > 0, r.flow_count > 0, r.schedule_count > 0, r.cmdb_count > 0, r.secret_count > 0, r.git_count > 0, r.plugin_count > 0, r.notification_channel_count > 0, r.playbook_count > 0].filter(Boolean).length;
                const pct = Math.round(configured / 10 * 100);
                return (
                    <Tooltip title={`已配置 ${configured}/10 项`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 0, background: '#f0f2f5', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', borderRadius: 0, width: `${pct}%`,
                                    background: pct >= 80 ? '#52c41a' : pct >= 50 ? '#faad14' : '#ff4d4f',
                                }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: pct >= 80 ? '#389e0d' : pct >= 50 ? '#d48806' : '#cf1322', minWidth: 32 }}>{pct}%</span>
                        </div>
                    </Tooltip>
                );
            },
        },
        {
            title: '最近活动', dataIndex: 'last_activity_at', key: 'activity', width: 100,
            sorter: (a, b) => (a.last_activity_at || '').localeCompare(b.last_activity_at || ''),
            render: (v: string | null) => {
                if (!v) return <Text type="secondary">—</Text>;
                return <Tooltip title={dayjs(v).format('YYYY-MM-DD HH:mm:ss')}><Text type="secondary">{dayjs(v).fromNow()}</Text></Tooltip>;
            },
        },
    ], []);

    return (
        <StandardTable<TenantStatsItem>
            title="租户运营明细"
            description="查看所有租户的详细运营数据，点击展开可查看自动化、基础设施、运营模块的详细配置情况"
            headerIcon={headerIcon}
            headerExtra={statsBar}
            searchFields={searchFields}
            onSearch={(params) => {
                const p: Record<string, string> = {};
                if (params.filters?.length) {
                    params.filters.forEach((item) => {
                        if (item.value) p[item.field] = item.value;
                    });
                }
                if (params.advancedSearch) {
                    Object.entries(params.advancedSearch).forEach(([key, value]) => {
                        if (value !== undefined && value !== null && value !== '') p[key] = String(value);
                    });
                }
                setSearchParams(p);
            }}
        >
            <Table<TenantStatsItem>
                rowKey="id"
                dataSource={filteredTenants}
                columns={columns}
                loading={loading}
                pagination={filteredTenants.length > 15 ? {
                    defaultPageSize: 15,
                    showSizeChanger: true,
                    pageSizeOptions: ['15', '30', '50'],
                    showTotal: (t: number) => `共 ${t} 条`,
                    size: 'small',
                } : false}
                size="middle"
                scroll={{ x: 1100 }}
                expandable={{
                    expandedRowRender: (record) => <ExpandedRow record={record} />,
                    expandRowByClick: true,
                }}
            />
        </StandardTable>
    );
};

export default TenantOpsDetailPage;
