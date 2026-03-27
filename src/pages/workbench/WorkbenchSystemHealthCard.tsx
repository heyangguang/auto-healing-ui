import {
    ApiOutlined,
    CheckCircleOutlined,
    CloudServerOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DatabaseOutlined,
    ExclamationCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Card, Spin, Tag } from 'antd';
import React from 'react';
import type { WorkbenchOverview } from '@/services/auto-healing/workbench';

type WorkbenchSystemHealthCardProps = {
    formatUptime: (seconds: number) => string;
    loading: boolean;
    overview: WorkbenchOverview | null;
    styles: Record<string, string>;
};

function formatLatency(value?: number): string {
    return value === undefined || value === null ? '-' : `${value}ms`;
}

const WorkbenchSystemHealthCard: React.FC<WorkbenchSystemHealthCardProps> = ({
    formatUptime,
    loading,
    overview,
    styles,
}) => {
    const hasOverview = Boolean(overview?.system_health);
    const healthStatus = overview?.system_health?.status || 'unknown';
    const healthColor = healthStatus === 'healthy' ? '#52c41a' : healthStatus === 'degraded' ? '#faad14' : healthStatus === 'down' ? '#ff4d4f' : '#8c8c8c';
    const healthLabel = healthStatus === 'healthy' ? '正常' : healthStatus === 'degraded' ? '降级' : healthStatus === 'down' ? '异常' : '未获取';
    const healthTagColor = healthStatus === 'healthy' ? 'success' : healthStatus === 'degraded' ? 'warning' : healthStatus === 'down' ? 'error' : 'default';
    const healthTagLabel = healthStatus === 'healthy' ? '运行中' : healthStatus === 'degraded' ? '降级运行' : healthStatus === 'down' ? '异常' : '状态未知';
    const HealthIcon = healthStatus === 'healthy' ? CheckCircleOutlined : healthStatus === 'degraded' ? ExclamationCircleOutlined : healthStatus === 'down' ? CloseCircleOutlined : CloudServerOutlined;

    return (
        <Card className={styles.card} style={{ flex: 1, minHeight: 260, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                    <HealthIcon className={styles.cardTitleIcon} style={{ color: healthColor }} /> 系统健康状态
                </span>
                <Tag color={healthTagColor} style={{ margin: 0, fontSize: 10, height: 20, lineHeight: '20px' }}>{healthTagLabel}</Tag>
            </div>
            {loading ? (
                <div className={styles.loadingWrap}><Spin /></div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                        <HealthIcon style={{ fontSize: 22, color: healthColor }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>运行状态</div><div style={{ fontSize: 16, fontWeight: 700, color: healthColor }}>{healthLabel}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                        <SyncOutlined style={{ fontSize: 22, color: '#1677ff' }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>系统版本</div><div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.version || '-'}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5', borderBottom: '1px solid #f5f5f5' }}>
                        <ClockCircleOutlined style={{ fontSize: 22, color: '#722ed1' }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>运行时间</div><div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{hasOverview && overview ? formatUptime(overview.system_health.uptime_seconds) : '-'}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid #f5f5f5' }}>
                        <CloudServerOutlined style={{ fontSize: 22, color: '#13c2c2' }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>环境</div><div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{overview?.system_health?.environment || '-'}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderRight: '1px solid #f5f5f5' }}>
                        <ApiOutlined style={{ fontSize: 22, color: '#fa8c16' }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>API 响应</div><div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{formatLatency(overview?.system_health?.api_latency_ms)}</div></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
                        <DatabaseOutlined style={{ fontSize: 22, color: '#eb2f96' }} />
                        <div><div style={{ fontSize: 11, color: '#8c8c8c' }}>数据库</div><div style={{ fontSize: 16, fontWeight: 700, color: '#262626' }}>{formatLatency(overview?.system_health?.db_latency_ms)}</div></div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default WorkbenchSystemHealthCard;
