import React from 'react';
import { history } from '@umijs/max';
import { Badge, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    AlertOutlined,
    ApartmentOutlined,
    ApiOutlined,
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
    QuestionCircleOutlined,
    RocketOutlined,
    SafetyOutlined,
    SendOutlined,
    ShopOutlined,
    StarOutlined,
    TeamOutlined,
    ToolOutlined,
    TrophyOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
    getTenantAutomationTotal,
    getTenantConfiguredModuleCount,
    getTenantTotalResources,
    toSafeCount,
    type TenantStatsItem,
} from './tenantMetrics';

const { Text } = Typography;

const ICON_MAP: Record<string, React.ReactNode> = {
    bank: <BankOutlined />,
    shop: <ShopOutlined />,
    team: <TeamOutlined />,
    cloud: <CloudOutlined />,
    apartment: <ApartmentOutlined />,
    tool: <ToolOutlined />,
    global: <GlobalOutlined />,
    rocket: <RocketOutlined />,
    home: <HomeOutlined />,
    bulb: <BulbOutlined />,
    safety: <SafetyOutlined />,
    thunder: <ThunderboltOutlined />,
    database: <DatabaseOutlined />,
    api: <ApiOutlined />,
    deployment: <DeploymentUnitOutlined />,
    cluster: <ClusterOutlined />,
    dashboard: <DashboardOutlined />,
    experiment: <ExperimentOutlined />,
    monitor: <MonitorOutlined />,
    code: <CodeOutlined />,
    build: <BuildOutlined />,
    fund: <FundOutlined />,
    trophy: <TrophyOutlined />,
    star: <StarOutlined />,
    product: <ProductOutlined />,
    alert: <AlertOutlined />,
    audit: <AuditOutlined />,
    fire: <FireOutlined />,
    service: <CustomerServiceOutlined />,
    control: <ControlOutlined />,
    send: <SendOutlined />,
    folder: <FolderOpenOutlined />,
};

function renderRateBar(percent: number, textColor: string, barColor: string) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 0, background: '#f0f2f5', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 0, width: `${percent}%`, background: barColor }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: textColor, minWidth: 32 }}>{percent}%</span>
        </div>
    );
}

const TenantOpsColumns = (): ColumnsType<TenantStatsItem> => [
    {
        title: '租户',
        dataIndex: 'name',
        key: 'name',
        width: 160,
        fixed: 'left',
        render: (name: string, record) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: '#5B5FC7', flexShrink: 0 }}>
                    {(record.icon && ICON_MAP[record.icon]) ?? <BankOutlined />}
                </span>
                <div>
                    <div
                        style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer', color: '#262626' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            history.push(`/platform/tenants/${record.id}/members`);
                        }}
                    >
                        {name}
                    </div>
                    <div style={{ fontSize: 11, color: '#b0b0b0' }}>{record.code}</div>
                </div>
            </div>
        ),
    },
    {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 72,
        align: 'center',
        render: (status: string) => <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '正常' : '停用'} />,
    },
    {
        title: '成员',
        dataIndex: 'member_count',
        key: 'members',
        width: 60,
        align: 'center',
        sorter: (left, right) => toSafeCount(left.member_count) - toSafeCount(right.member_count),
        render: (value: number) => (
            <span style={{ fontWeight: 600, color: toSafeCount(value) > 0 ? '#262626' : '#d9d9d9' }}>
                {toSafeCount(value)}
            </span>
        ),
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
        key: 'total_resources',
        width: 95,
        align: 'center',
        sorter: (left, right) => getTenantTotalResources(left) - getTenantTotalResources(right),
        render: (_, record) => {
            const totalResources = getTenantTotalResources(record);
            return (
                <Tooltip
                    title={`CMDB ${toSafeCount(record.cmdb_count)} · 模板 ${toSafeCount(record.template_count)} · Playbook ${toSafeCount(record.playbook_count)} · 凭据 ${toSafeCount(record.secret_count)} · 插件 ${toSafeCount(record.plugin_count)} · 仓库 ${toSafeCount(record.git_count)}`}
                >
                    <span style={{ fontWeight: 600, color: totalResources > 0 ? '#1677ff' : '#d9d9d9' }}>{totalResources}</span>
                </Tooltip>
            );
        },
    },
    {
        title: '自动化',
        key: 'automation',
        width: 150,
        sorter: (left, right) => getTenantAutomationTotal(left) - getTenantAutomationTotal(right),
        render: (_, record) => {
            const total = getTenantAutomationTotal(record);
            if (total === 0 && toSafeCount(record.instance_count) === 0) {
                return <span style={{ color: '#d9d9d9' }}>—</span>;
            }
            return (
                <span style={{ fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: '#fa8c16' }}>{toSafeCount(record.rule_count)}</span>
                    <span style={{ color: '#b0b0b0' }}> 规则 · </span>
                    <span style={{ fontWeight: 600, color: '#722ed1' }}>{toSafeCount(record.flow_count)}</span>
                    <span style={{ color: '#b0b0b0' }}> 流程 · </span>
                    <span style={{ fontWeight: 600, color: '#13c2c2' }}>{toSafeCount(record.instance_count)}</span>
                    <span style={{ color: '#b0b0b0' }}> 实例</span>
                </span>
            );
        },
    },
    {
        title: '审计',
        dataIndex: 'audit_log_count',
        key: 'audit',
        width: 65,
        align: 'center',
        sorter: (left, right) => toSafeCount(left.audit_log_count) - toSafeCount(right.audit_log_count),
        render: (value: number) => (
            <span style={{ fontWeight: 600, color: toSafeCount(value) > 0 ? '#722ed1' : '#d9d9d9' }}>
                {toSafeCount(value)}
            </span>
        ),
    },
    {
        title: '自愈成功率',
        key: 'healing_rate',
        width: 105,
        sorter: (left, right) => {
            const leftRate = toSafeCount(left.healing_total_count) > 0 ? toSafeCount(left.healing_success_count) / toSafeCount(left.healing_total_count) : 0;
            const rightRate = toSafeCount(right.healing_total_count) > 0 ? toSafeCount(right.healing_success_count) / toSafeCount(right.healing_total_count) : 0;
            return leftRate - rightRate;
        },
        render: (_, record) => {
            if (toSafeCount(record.healing_total_count) === 0) {
                return <Text type="secondary">—</Text>;
            }
            const percent = Math.round((toSafeCount(record.healing_success_count) / toSafeCount(record.healing_total_count)) * 100);
            const color = percent >= 90 ? '#389e0d' : percent >= 70 ? '#d48806' : '#cf1322';
            const barColor = percent >= 90 ? '#52c41a' : percent >= 70 ? '#faad14' : '#ff4d4f';
            return (
                <Tooltip title={`成功 ${toSafeCount(record.healing_success_count)} / 总共 ${toSafeCount(record.healing_total_count)} 次`}>
                    {renderRateBar(percent, color, barColor)}
                </Tooltip>
            );
        },
    },
    {
        title: '自愈覆盖',
        key: 'healing_coverage',
        width: 105,
        sorter: (left, right) => {
            const leftRate = toSafeCount(left.incident_count) > 0 ? toSafeCount(left.incident_covered_count) / toSafeCount(left.incident_count) : 0;
            const rightRate = toSafeCount(right.incident_count) > 0 ? toSafeCount(right.incident_covered_count) / toSafeCount(right.incident_count) : 0;
            return leftRate - rightRate;
        },
        render: (_, record) => {
            if (toSafeCount(record.incident_count) === 0) {
                return <Text type="secondary">—</Text>;
            }
            const percent = Math.round((toSafeCount(record.incident_covered_count) / toSafeCount(record.incident_count)) * 100);
            const color = percent >= 80 ? '#0958d9' : percent >= 50 ? '#d48806' : '#cf1322';
            const barColor = percent >= 80 ? '#1677ff' : percent >= 50 ? '#faad14' : '#ff4d4f';
            return (
                <Tooltip title={`规则覆盖 ${toSafeCount(record.incident_covered_count)} / 总工单 ${toSafeCount(record.incident_count)} 件`}>
                    {renderRateBar(percent, color, barColor)}
                </Tooltip>
            );
        },
    },
    {
        title: '配置覆盖',
        key: 'coverage',
        width: 105,
        sorter: (left, right) => getTenantConfiguredModuleCount(left) - getTenantConfiguredModuleCount(right),
        render: (_, record) => {
            const configured = getTenantConfiguredModuleCount(record);
            const percent = Math.round((configured / 10) * 100);
            const color = percent >= 80 ? '#389e0d' : percent >= 50 ? '#d48806' : '#cf1322';
            const barColor = percent >= 80 ? '#52c41a' : percent >= 50 ? '#faad14' : '#ff4d4f';
            return (
                <Tooltip title={`已配置 ${configured}/10 项`}>
                    {renderRateBar(percent, color, barColor)}
                </Tooltip>
            );
        },
    },
    {
        title: '最近活动',
        dataIndex: 'last_activity_at',
        key: 'activity',
        width: 100,
        sorter: (left, right) => (left.last_activity_at || '').localeCompare(right.last_activity_at || ''),
        render: (value: string | null) => {
            if (!value) {
                return <Text type="secondary">—</Text>;
            }
            return (
                <Tooltip title={dayjs(value).format('YYYY-MM-DD HH:mm:ss')}>
                    <Text type="secondary">{dayjs(value).fromNow()}</Text>
                </Tooltip>
            );
        },
    },
];

export default TenantOpsColumns;
