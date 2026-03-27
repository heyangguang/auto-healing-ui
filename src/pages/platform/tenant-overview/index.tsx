import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Card, Row, Col, Typography, Button, Tooltip, Progress, message,
    Avatar, Tag, Badge, Spin, Empty, Space,
} from 'antd';
import {
    TeamOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    BankOutlined,
    SafetyCertificateOutlined,
    BarChartOutlined,
    TrophyOutlined,
    DatabaseOutlined,
    CloudServerOutlined,
    LockOutlined,
    ApiOutlined,
    ScheduleOutlined,
    BellOutlined,
    AppstoreOutlined,
    BranchesOutlined,
    BookOutlined,
    AlertOutlined,
    FileProtectOutlined,
    FundProjectionScreenOutlined,
    NodeIndexOutlined,
    DashboardOutlined,
    RiseOutlined,
    LineChartOutlined,
    PlayCircleOutlined,
    SendOutlined,
    PieChartOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import {
    getTenantStats,
    getTenantTrends,
    type PlatformTenantStatsItem,
    type PlatformTenantStatsSummary,
} from '@/services/auto-healing/platform/tenants';
import {
    getCoverageSubtext,
    getSafePercent,
    getTenantInfraScore,
    getTenantResourceScore,
    toSafeCount,
} from './tenantOverviewMetrics';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

/* ── Types ── */
type TenantStatsItem = PlatformTenantStatsItem;
type TenantStatsSummary = PlatformTenantStatsSummary;



/* ══════════ 子组件 ══════════ */

/* ── SVG 面积折线图（企业级） ── */
const AreaChart: React.FC<{
    data: number[];
    labels: string[];
    color: string;
    height?: number;
}> = ({ data, labels, color, height = 140 }) => {
    if (!data || data.length < 2) {
        return <svg viewBox={`0 0 300 ${height}`} style={{ width: '100%', height }}><text x="150" y={height / 2} textAnchor="middle" fontSize={12} fill="#d9d9d9">暂无数据</text></svg>;
    }
    const pad = { top: 12, right: 12, bottom: 24, left: 12 };
    const w = 300, h = height;
    const plotW = w - pad.left - pad.right;
    const plotH = h - pad.top - pad.bottom;
    const max = Math.max(...data, 1) * 1.1;

    const points = data.map((v, i) => ({
        x: pad.left + (i / (data.length - 1)) * plotW,
        y: pad.top + plotH - (v / max) * plotH,
    }));

    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD = `${lineD} L${points[points.length - 1].x},${pad.top + plotH} L${points[0].x},${pad.top + plotH} Z`;

    return (
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
            <defs>
                <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>
            {/* 网格线 */}
            {[0, 0.25, 0.5, 0.75, 1].map(r => (
                <line key={r} x1={pad.left} y1={pad.top + plotH * (1 - r)} x2={pad.left + plotW} y2={pad.top + plotH * (1 - r)}
                    stroke="#f0f0f0" strokeWidth={0.5} />
            ))}
            {/* 面积 */}
            <path d={areaD} fill={`url(#grad-${color.replace('#', '')})`} />
            {/* 折线 */}
            <path d={lineD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {/* 数据点 */}
            {points.map((p, i) => (
                <g key={i}>
                    <circle cx={p.x} cy={p.y} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />
                    <title>{`${labels[i]}: ${data[i]}`}</title>
                </g>
            ))}
            {/* X 轴标签 */}
            {labels.map((l, i) => (
                <text key={i} x={pad.left + (i / (labels.length - 1)) * plotW} y={h - 4}
                    textAnchor="middle" fontSize={10} fill="#bfbfbf">{l}</text>
            ))}
        </svg>
    );
};

/* ── 统一环形指标组件（2×2 grid）── */
const RingGrid: React.FC<{
    items: { label: string; value: number; color: string; sub?: string }[];
}> = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, justifyItems: 'center' }}>
        {items.map(item => (
            <div key={item.label} style={{ textAlign: 'center' }}>
                <Progress
                    type="circle" size={68}
                    percent={item.value}
                    strokeColor={item.color}
                    strokeWidth={7}
                    format={p => <span style={{ fontSize: 15, fontWeight: 700, color: '#262626' }}>{p}%</span>}
                />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: '#595959' }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 11, color: '#bfbfbf' }}>{item.sub}</div>}
            </div>
        ))}
    </div>
);

/* ── 排行 Item ── */
const RankItem: React.FC<{
    rank: number; name: string; code: string; status: string; id: string;
    value: number; maxValue: number; color: string; suffix?: string;
    details?: { label: string; value: number; color: string }[];
}> = ({ rank, name, code, status, id, value, maxValue, color, suffix, details }) => {
    const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    return (
        <div className="ov-rank-row"
            onClick={() => history.push(`/platform/tenants/${id}/members`)}
        >
            <Avatar size={26} style={{
                background: rank <= 3 ? ['#ff4d4f', '#fa8c16', '#faad14'][rank - 1] : '#f0f0f0',
                color: rank <= 3 ? '#fff' : '#8c8c8c',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{rank}</Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</Text>
                    <Badge status={status === 'active' ? 'success' : 'default'} />
                    <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 2 }}>{code}</Tag>
                </div>
                <Progress percent={pct} size="small" strokeColor={color} showInfo={false} style={{ margin: 0 }} />
            </div>
            {details && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {details.map(d => (
                        <Tooltip key={d.label} title={d.label}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: d.value > 0 ? d.color : '#e0e0e0' }}>{d.value}</span>
                        </Tooltip>
                    ))}
                </div>
            )}
            <div style={{ width: 50, textAlign: 'right', flexShrink: 0 }}>
                <Text strong style={{ fontSize: 15, color }}>{value}</Text>
                {suffix && <Text type="secondary" style={{ fontSize: 11 }}> {suffix}</Text>}
            </div>
        </div>
    );
};

/* ── 资源水位横条 ── */
const ResourceBar: React.FC<{
    items: { label: string; value: number; color: string }[];
}> = ({ items }) => {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    return (
        <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 0, overflow: 'hidden', background: '#f5f5f5' }}>
            {items.map(i => (
                <Tooltip key={i.label} title={`${i.label}: ${i.value}`}>
                    <div style={{
                        flex: Math.max(i.value / total, 0.02),
                        background: i.color, minWidth: i.value > 0 ? 6 : 0,
                        transition: 'flex 0.3s',
                    }} />
                </Tooltip>
            ))}
        </div>
    );
};

/* ── 列表行（成员/审计/资源 TOP 5 共用模板）── */
const ListRow: React.FC<{
    name: string; percent: number; value: React.ReactNode;
    barColor: string; barContent?: React.ReactNode;
}> = ({ name, percent, value, barColor, barContent }) => (
    <div className="ov-list-row">
        <Text strong className="ov-list-name">{name}</Text>
        <div style={{ flex: 1, minWidth: 0 }}>
            {barContent || <Progress percent={percent} size="small" strokeColor={barColor} showInfo={false} style={{ margin: 0 }} />}
        </div>
        <div className="ov-list-value">{value}</div>
    </div>
);

/* ══════════════════════ 主组件 ══════════════════════ */
const TenantOverviewPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [tenants, setTenants] = useState<TenantStatsItem[]>([]);
    const [summary, setSummary] = useState<TenantStatsSummary>({
        total_tenants: 0, active_tenants: 0, disabled_tenants: 0,
        total_users: 0, total_rules: 0, total_instances: 0, total_templates: 0,
    });
    const [trendData, setTrendData] = useState<{
        dates: string[]; operations: number[]; audit_logs: number[]; task_executions: number[];
    }>({ dates: [], operations: [], audit_logs: [], task_executions: [] });
    const statsRequestSeqRef = useRef(0);

    const fetchStats = useCallback(async () => {
        const requestSeq = statsRequestSeqRef.current + 1;
        statsRequestSeqRef.current = requestSeq;
        setLoading(true);
        setLoadFailed(false);
        try {
            const [statsRes, trendsRes] = await Promise.all([
                getTenantStats(),
                getTenantTrends({ days: 7 }),
            ]);
            if (statsRequestSeqRef.current !== requestSeq) return;
            setTenants(statsRes.tenants);
            setSummary(statsRes.summary);
            setTrendData(trendsRes);
        } catch {
            if (statsRequestSeqRef.current === requestSeq) {
                setLoadFailed(true);
                message.error('租户运营总览加载失败，请刷新重试');
            }
        } finally {
            if (statsRequestSeqRef.current === requestSeq) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => { fetchStats(); }, []);

    const byResource = useMemo(() =>
        [...tenants].sort((a, b) => getTenantResourceScore(b) - getTenantResourceScore(a)), [tenants]);

    const byAudit = useMemo(() =>
        [...tenants].sort((a, b) => toSafeCount(b.audit_log_count) - toSafeCount(a.audit_log_count)), [tenants]);

    const totalAudit = useMemo(() => tenants.reduce((s, t) => s + toSafeCount(t.audit_log_count), 0), [tenants]);
    const hasAnyData = useMemo(
        () => tenants.length > 0
            || summary.total_tenants > 0
            || summary.total_users > 0
            || summary.total_rules > 0
            || summary.total_templates > 0
            || trendData.dates.length > 0,
        [summary, tenants, trendData.dates.length],
    );



    return (
        <div className="tenant-overview-dashboard">
            <Spin spinning={loading}>
                {loadFailed && !loading && !hasAnyData ? (
                    <Card variant="borderless">
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="租户运营总览加载失败，请刷新重试"
                            style={{ padding: '56px 0' }}
                        >
                            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchStats}>
                                重新加载
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <>

                {/* ══════ Header — 卡片 + 雅致深空装饰 ══════ */}
                <div className="ov-header-card">
                    {/* 装饰: 线条 + 节点 */}
                    <svg className="ov-header-decoration-svg" viewBox="0 0 420 120" preserveAspectRatio="none">
                        {/* 主线条 */}
                        <g stroke="rgba(22,119,255,0.15)" strokeWidth="1" fill="none">
                            <line x1="30" y1="80" x2="110" y2="40" />
                            <line x1="110" y1="40" x2="200" y2="70" />
                            <line x1="200" y1="70" x2="300" y2="30" />
                            <line x1="300" y1="30" x2="390" y2="60" />
                            <line x1="200" y1="70" x2="260" y2="100" />
                        </g>
                        {/* 节点圆 */}
                        <g fill="rgba(22,119,255,0.3)">
                            <circle cx="30" cy="80" r="2" />
                            <circle cx="110" cy="40" r="3" />
                            <circle cx="200" cy="70" r="2.5" />
                            <circle cx="300" cy="30" r="1.5" />
                            <circle cx="390" cy="60" r="2" />
                            <circle cx="260" cy="100" r="1.5" />
                        </g>
                        {/* 十字标记 */}
                        <g stroke="rgba(22,119,255,0.15)" strokeWidth="1">
                            <path d="M110 34 v12 M104 40 h12" />
                            <path d="M200 65 v10 M195 70 h10" />
                        </g>
                    </svg>
                    <div className="ov-header-card-left">
                        <DashboardOutlined className="ov-header-card-icon" />
                        <div>
                            <div className="ov-header-card-title">租户运营总览</div>
                            <div className="ov-header-card-desc">多租户运营监控 · 资源水位 · 自动化覆盖 · 安全合规</div>
                        </div>
                    </div>
                    <div className="ov-header-card-right">
                        <div className="ov-header-card-pills">
                            <span className="ov-pill">{summary.total_tenants} 租户</span>
                            <span className="ov-pill">{summary.total_users} 用户</span>
                            <span className="ov-pill">{summary.total_rules} 规则</span>
                        </div>
                        <div className="ov-header-card-actions">
                            <Text type="secondary" style={{ fontSize: 11 }}>{dayjs().format('HH:mm:ss')}</Text>
                            <Tooltip title="刷新数据">
                                <button className="ov-refresh-btn" onClick={fetchStats}>
                                    <ReloadOutlined />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* ══════ Row 1 · 4 个核心指标 ══════ */}
                <Row gutter={16} style={{ marginBottom: 20 }}>
                    {[
                        { icon: <BankOutlined />, title: '租户总数', value: summary.total_tenants, sub: `活跃 ${summary.active_tenants} · 停用 ${summary.disabled_tenants}`, color: '#1677ff', bg: '#f0f5ff' },
                        { icon: <TeamOutlined />, title: '平台用户', value: summary.total_users, sub: `${summary.total_tenants} 个租户`, color: '#52c41a', bg: '#f6ffed' },
                        { icon: <ThunderboltOutlined />, title: '自愈规则', value: summary.total_rules, sub: `模板 ${summary.total_templates}`, color: '#fa8c16', bg: '#fff7e6' },
                        { icon: <SafetyCertificateOutlined />, title: '审计事件', value: totalAudit, sub: `${summary.total_tenants} 个租户`, color: '#722ed1', bg: '#f9f0ff' },
                    ].map((item, i) => (
                        <Col key={i} sm={12} md={6}>
                            <Card variant="borderless" className="ov-stat-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className="ov-stat-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
                                        <div className="ov-stat-number">{item.value}</div>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{item.sub}</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* ══════ Row 2 · 3 个网格概览 ══════ */}
                <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col md={8} sm={24}>
                        <Card variant="borderless" title={<><DatabaseOutlined style={{ color: '#1677ff', marginRight: 8 }} />平台资源概览</>}
                            styles={{ body: { padding: '14px 20px' } }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                                {[
                                    { icon: <CloudServerOutlined />, label: 'CMDB 主机', value: tenants.reduce((s, t) => s + (t.cmdb_count || 0), 0), color: '#1677ff' },
                                    { icon: <BookOutlined />, label: 'Playbook', value: tenants.reduce((s, t) => s + (t.playbook_count || 0), 0), color: '#52c41a' },
                                    { icon: <BranchesOutlined />, label: 'Git 仓库', value: tenants.reduce((s, t) => s + (t.git_count || 0), 0), color: '#eb2f96' },
                                    { icon: <LockOutlined />, label: '凭据', value: tenants.reduce((s, t) => s + (t.secret_count || 0), 0), color: '#fa8c16' },
                                    { icon: <ApiOutlined />, label: '插件', value: tenants.reduce((s, t) => s + (t.plugin_count || 0), 0), color: '#13c2c2' },
                                    { icon: <AppstoreOutlined />, label: '自愈流程', value: tenants.reduce((s, t) => s + (t.flow_count || 0), 0), color: '#722ed1' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: r.color, fontSize: 15 }}>{r.icon}</span>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{r.label}</Text>
                                            <div style={{ fontWeight: 700, fontSize: 17, color: r.value > 0 ? '#262626' : '#d9d9d9', lineHeight: 1.2 }}>{r.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                    <Col md={8} sm={24}>
                        <Card variant="borderless" title={<><ThunderboltOutlined style={{ color: '#fa8c16', marginRight: 8 }} />自愈能力概览</>}
                            styles={{ body: { padding: '14px 20px' } }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                                {[
                                    { icon: <ThunderboltOutlined />, label: '自愈规则', value: summary.total_rules, color: '#fa8c16' },
                                    { icon: <FileProtectOutlined />, label: '任务模板', value: summary.total_templates, color: '#eb2f96' },
                                    { icon: <ScheduleOutlined />, label: '定时任务', value: tenants.reduce((s, t) => s + (t.schedule_count || 0), 0), color: '#2f54eb' },
                                    { icon: <NodeIndexOutlined />, label: '自愈流程', value: tenants.reduce((s, t) => s + (t.flow_count || 0), 0), color: '#722ed1' },
                                    { icon: <AlertOutlined />, label: '工单', value: tenants.reduce((s, t) => s + (t.incident_count || 0), 0), color: '#f5222d' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: r.color, fontSize: 15 }}>{r.icon}</span>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{r.label}</Text>
                                            <div style={{ fontWeight: 700, fontSize: 17, color: r.value > 0 ? '#262626' : '#d9d9d9', lineHeight: 1.2 }}>{r.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                    <Col md={8} sm={24}>
                        <Card variant="borderless" title={<><FundProjectionScreenOutlined style={{ color: '#722ed1', marginRight: 8 }} />通知与监控</>}
                            styles={{ body: { padding: '14px 20px' } }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
                                {[
                                    { icon: <BellOutlined />, label: '通知渠道', value: tenants.reduce((s, t) => s + (t.notification_channel_count || 0), 0), color: '#2f54eb' },
                                    { icon: <FileProtectOutlined />, label: '通知模板', value: tenants.reduce((s, t) => s + (t.notification_template_count || 0), 0), color: '#13c2c2' },
                                    { icon: <SafetyCertificateOutlined />, label: '审计日志', value: totalAudit, color: '#722ed1' },
                                    { icon: <TeamOutlined />, label: '平台用户', value: summary.total_users, color: '#1677ff' },
                                    { icon: <BankOutlined />, label: '活跃租户', value: summary.active_tenants, color: '#52c41a' },
                                    { icon: <CloseCircleOutlined />, label: '停用租户', value: summary.disabled_tenants, color: '#ff4d4f' },
                                ].map(r => (
                                    <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ color: r.color, fontSize: 15 }}>{r.icon}</span>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{r.label}</Text>
                                            <div style={{ fontWeight: 700, fontSize: 17, color: r.value > 0 ? '#262626' : '#d9d9d9', lineHeight: 1.2 }}>{r.value}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* ══════ Row 3 · 3 个 TOP 5 列表 ══════ */}
                <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless" title={<><TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />成员分布 TOP 5</>}
                            extra={<Tag>共 {summary.total_users} 人</Tag>}
                            styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
                            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> :
                                [...tenants].sort((a, b) => toSafeCount(b.member_count) - toSafeCount(a.member_count)).slice(0, 5).map(t => {
                                    const max = Math.max(...tenants.map(x => toSafeCount(x.member_count)), 1);
                                    return (
                                        <ListRow key={t.id} name={t.name}
                                            percent={getSafePercent(toSafeCount(t.member_count), max)}
                                            barColor="#1677ff"
                                            value={<Text strong style={{ color: '#1677ff' }}>{toSafeCount(t.member_count)}</Text>}
                                        />
                                    );
                                })
                            }
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless" title={<><SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 8 }} />安全与合规 TOP 5</>}
                            extra={<Tag color="purple">审计 {totalAudit}</Tag>}
                            styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
                            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> :
                                byAudit.slice(0, 5).map(t => {
                                    const max = Math.max(...tenants.map(x => toSafeCount(x.audit_log_count)), 1);
                                    return (
                                        <ListRow key={t.id} name={t.name}
                                            percent={getSafePercent(toSafeCount(t.audit_log_count), max)}
                                            barColor="#722ed1"
                                            value={<Text strong style={{ color: '#722ed1' }}>{toSafeCount(t.audit_log_count)}</Text>}
                                        />
                                    );
                                })
                            }
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless" title={<><BarChartOutlined style={{ color: '#fa8c16', marginRight: 8 }} />资源配额 TOP 5</>}
                            extra={
                                <Space size={4} style={{ fontSize: 10, color: '#8c8c8c' }}>
                                    {[{ c: '#fa8c16', l: '规则' }, { c: '#13c2c2', l: '实例' }, { c: '#eb2f96', l: '模板' }].map(x => (
                                        <span key={x.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: 1, background: x.c, display: 'inline-block' }} />{x.l}
                                        </span>
                                    ))}
                                </Space>
                            }
                            styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
                            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> :
                                byResource.slice(0, 5).map(t => {
                                    const total = summary.total_rules + summary.total_instances + summary.total_templates;
                                    const cur = getTenantResourceScore(t);
                                    const pct = getSafePercent(cur, total);
                                    return (
                                        <ListRow key={t.id} name={t.name} percent={0} barColor="#fa8c16"
                                            barContent={
                                                <ResourceBar items={[
                                                    { label: '规则', value: toSafeCount(t.rule_count), color: '#fa8c16' },
                                                    { label: '实例', value: toSafeCount(t.instance_count), color: '#13c2c2' },
                                                    { label: '模板', value: toSafeCount(t.template_count), color: '#eb2f96' },
                                                ]} />
                                            }
                                            value={<Text strong style={{ color: pct > 50 ? '#f5222d' : pct > 25 ? '#fa8c16' : '#8c8c8c' }}>{pct}%</Text>}
                                        />
                                    );
                                })
                            }
                        </Card>
                    </Col>
                </Row>

                {/* ══════ Row 4 · 2 个排行 ══════ */}
                <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
                    <Col md={12} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><TrophyOutlined style={{ color: '#fa8c16', marginRight: 8 }} />资源使用排行 TOP 5</>}
                            extra={
                                <Space size={6} style={{ fontSize: 11, color: '#8c8c8c' }}>
                                    {[{ color: '#fa8c16', label: '规则' }, { color: '#13c2c2', label: '实例' }, { color: '#eb2f96', label: '模板' }].map(l => (
                                        <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                            <span style={{ width: 7, height: 7, borderRadius: 2, background: l.color, display: 'inline-block' }} />{l.label}
                                        </span>
                                    ))}
                                </Space>
                            }
                            styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
                            {byResource.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> :
                                byResource.slice(0, 5).map((t, idx) => {
                                    const maxRes = Math.max(...byResource.map(getTenantResourceScore), 1);
                                    return (
                                        <RankItem key={t.id} rank={idx + 1}
                                            name={t.name} code={t.code} status={t.status} id={t.id}
                                            value={getTenantResourceScore(t)}
                                            maxValue={maxRes} color="#fa8c16"
                                            details={[
                                                { label: '规则', value: toSafeCount(t.rule_count), color: '#fa8c16' },
                                                { label: '实例', value: toSafeCount(t.instance_count), color: '#13c2c2' },
                                                { label: '模板', value: toSafeCount(t.template_count), color: '#eb2f96' },
                                            ]}
                                        />
                                    );
                                })
                            }
                        </Card>
                    </Col>
                    <Col md={12} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><CloudServerOutlined style={{ color: '#1677ff', marginRight: 8 }} />基础设施排行 TOP 5</>}
                            extra={
                                <Space size={6} style={{ fontSize: 11, color: '#8c8c8c' }}>
                                    {[{ color: '#1677ff', label: '主机' }, { color: '#fa8c16', label: '凭据' }, { color: '#13c2c2', label: '插件' }].map(l => (
                                        <span key={l.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                            <span style={{ width: 7, height: 7, borderRadius: 2, background: l.color, display: 'inline-block' }} />{l.label}
                                        </span>
                                    ))}
                                </Space>
                            }
                            styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
                            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> :
                                [...tenants].sort((a, b) =>
                                    getTenantInfraScore(b) - getTenantInfraScore(a)
                                ).slice(0, 5).map((t, idx) => {
                                    const score = getTenantInfraScore(t);
                                    const maxI = Math.max(...tenants.map(getTenantInfraScore), 1);
                                    return (
                                        <RankItem key={t.id} rank={idx + 1}
                                            name={t.name} code={t.code} status={t.status} id={t.id}
                                            value={score} maxValue={maxI} color="#1677ff"
                                            details={[
                                                { label: '主机', value: toSafeCount(t.cmdb_count), color: '#1677ff' },
                                                { label: '凭据', value: toSafeCount(t.secret_count), color: '#fa8c16' },
                                                { label: '插件', value: toSafeCount(t.plugin_count), color: '#13c2c2' },
                                            ]}
                                        />
                                    );
                                })
                            }
                        </Card>
                    </Col>
                </Row>

                {/* ══════ Row 5 · 3 个 SVG 折线趋势图（全部近 7 天，同结构）══════ */}
                <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><LineChartOutlined style={{ color: '#1677ff', marginRight: 8 }} />操作趋势（近 7 天）</>}
                            extra={<Tag>{trendData.operations.reduce((s, v) => s + v, 0)} 次</Tag>}
                            styles={{ body: { padding: '12px 16px' } }} style={{ flex: 1 }}>
                            <AreaChart data={trendData.operations} labels={trendData.dates} color="#1677ff" />
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 8 }} />审计趋势（近 7 天）</>}
                            extra={<Tag color="purple">{trendData.audit_logs.reduce((s, v) => s + v, 0)} 条</Tag>}
                            styles={{ body: { padding: '12px 16px' } }} style={{ flex: 1 }}>
                            <AreaChart data={trendData.audit_logs} labels={trendData.dates} color="#722ed1" />
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><PlayCircleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />任务执行（近 7 天）</>}
                            extra={<Tag color="cyan">{trendData.task_executions.reduce((s, v) => s + v, 0)} 次</Tag>}
                            styles={{ body: { padding: '12px 16px' } }} style={{ flex: 1 }}>
                            <AreaChart data={trendData.task_executions} labels={trendData.dates} color="#13c2c2" />
                        </Card>
                    </Col>
                </Row>

                {/* ══════ Row 6 · 3 个 2×2 环形统计（基于真实租户数据计算覆盖率）══════ */}
                <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><PieChartOutlined style={{ color: '#722ed1', marginRight: 8 }} />自动化配置率</>}
                            extra={<Text type="secondary" style={{ fontSize: 12 }}>已配置 / 总租户</Text>}
                            styles={{ body: { padding: '20px' } }} style={{ flex: 1 }}>
                            {(() => {
                                const total = tenants.length;
                                const withRules = tenants.filter(t => toSafeCount(t.rule_count) > 0).length;
                                const withTemplates = tenants.filter(t => toSafeCount(t.template_count) > 0).length;
                                const withFlows = tenants.filter(t => (t.flow_count || 0) > 0).length;
                                const withSchedules = tenants.filter(t => (t.schedule_count || 0) > 0).length;
                                return <RingGrid items={[
                                    { label: '规则', value: getSafePercent(withRules, total), color: '#fa8c16', sub: getCoverageSubtext(withRules, total, '个租户已配') },
                                    { label: '模板', value: getSafePercent(withTemplates, total), color: '#eb2f96', sub: getCoverageSubtext(withTemplates, total, '个租户已配') },
                                    { label: '流程', value: getSafePercent(withFlows, total), color: '#722ed1', sub: getCoverageSubtext(withFlows, total, '个租户已配') },
                                    { label: '定时', value: getSafePercent(withSchedules, total), color: '#13c2c2', sub: getCoverageSubtext(withSchedules, total, '个租户已配') },
                                ]} />;
                            })()}
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><SendOutlined style={{ color: '#2f54eb', marginRight: 8 }} />通知配置率</>}
                            extra={<Text type="secondary" style={{ fontSize: 12 }}>已配置 / 总租户</Text>}
                            styles={{ body: { padding: '20px' } }} style={{ flex: 1 }}>
                            {(() => {
                                const total = tenants.length;
                                const withChannel = tenants.filter(t => (t.notification_channel_count || 0) > 0).length;
                                const withTemplate = tenants.filter(t => (t.notification_template_count || 0) > 0).length;
                                const withCmdb = tenants.filter(t => (t.cmdb_count || 0) > 0).length;
                                const withPlugin = tenants.filter(t => (t.plugin_count || 0) > 0).length;
                                return <RingGrid items={[
                                    { label: '通知渠道', value: getSafePercent(withChannel, total), color: '#1677ff', sub: getCoverageSubtext(withChannel, total, '个租户已配') },
                                    { label: '通知模板', value: getSafePercent(withTemplate, total), color: '#13c2c2', sub: getCoverageSubtext(withTemplate, total, '个租户已配') },
                                    { label: 'CMDB', value: getSafePercent(withCmdb, total), color: '#fa8c16', sub: getCoverageSubtext(withCmdb, total, '个租户已配') },
                                    { label: '插件', value: getSafePercent(withPlugin, total), color: '#722ed1', sub: getCoverageSubtext(withPlugin, total, '个租户已配') },
                                ]} />;
                            })()}
                        </Card>
                    </Col>
                    <Col md={8} sm={24} style={{ display: 'flex' }}>
                        <Card variant="borderless"
                            title={<><DashboardOutlined style={{ color: '#fa8c16', marginRight: 8 }} />安全基线达标率</>}
                            extra={<Text type="secondary" style={{ fontSize: 12 }}>已具备 / 总租户</Text>}
                            styles={{ body: { padding: '20px' } }} style={{ flex: 1 }}>
                            {(() => {
                                const total = tenants.length;
                                const withMembers = tenants.filter(t => toSafeCount(t.member_count) >= 2).length;
                                const withAudit = tenants.filter(t => toSafeCount(t.audit_log_count) > 0).length;
                                const withSecret = tenants.filter(t => (t.secret_count || 0) > 0).length;
                                const withGit = tenants.filter(t => (t.git_count || 0) > 0).length;
                                return <RingGrid items={[
                                    { label: '多成员', value: getSafePercent(withMembers, total), color: '#1677ff', sub: getCoverageSubtext(withMembers, total, '≥2 成员') },
                                    { label: '有审计', value: getSafePercent(withAudit, total), color: '#722ed1', sub: getCoverageSubtext(withAudit, total, '有审计记录') },
                                    { label: '有凭据', value: getSafePercent(withSecret, total), color: '#fa8c16', sub: getCoverageSubtext(withSecret, total, '已配凭据') },
                                    { label: '有仓库', value: getSafePercent(withGit, total), color: '#52c41a', sub: getCoverageSubtext(withGit, total, '已配 Git') },
                                ]} />;
                            })()}
                        </Card>
                    </Col>
                </Row>
                    </>
                )}


            </Spin>
        </div>
    );
};

export default TenantOverviewPage;
