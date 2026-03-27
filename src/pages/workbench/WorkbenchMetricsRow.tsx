import React from 'react';
import { AlertOutlined, BugOutlined, CloudServerOutlined, LockOutlined } from '@ant-design/icons';
import { Card, Spin } from 'antd';
import type { WorkbenchOverview } from '@/services/auto-healing/workbench';

type WorkbenchMetricsRowProps = {
    loading: boolean;
    overview: WorkbenchOverview | null;
    styles: Record<string, string>;
};

const WorkbenchMetricsRow: React.FC<WorkbenchMetricsRowProps> = ({
    loading,
    overview,
    styles,
}) => (
    <div className={styles.metricsRow}>
        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                    <BugOutlined className={styles.cardTitleIcon} /> 自愈执行
                </span>
            </div>
            {loading ? (
                <div className={styles.loadingWrap}><Spin /></div>
            ) : (
                <div className={`${styles.cardBody} ${styles.metricCenter}`}>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#52c41a' }}>{overview?.healing_stats?.today_success ?? 0}</div>
                        <div className={styles.metricLabel}>今日成功</div>
                    </div>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#ff4d4f' }}>{overview?.healing_stats?.today_failed ?? 0}</div>
                        <div className={styles.metricLabel}>今日失败</div>
                    </div>
                </div>
            )}
            {!overview?.healing_stats && !loading && (
                <div className={styles.lockedOverlay}>
                    <LockOutlined className={styles.lockedIcon} />
                    <span className={styles.lockedText}>暂无权限查看</span>
                </div>
            )}
        </Card>

        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                    <AlertOutlined className={styles.cardTitleIcon} /> 工单统计
                </span>
            </div>
            {loading ? (
                <div className={styles.loadingWrap}><Spin /></div>
            ) : (
                <div className={`${styles.cardBody} ${styles.metricCenter}`}>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#faad14' }}>{overview?.incident_stats?.pending_count ?? 0}</div>
                        <div className={styles.metricLabel}>待处理</div>
                    </div>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#262626' }}>{overview?.incident_stats?.last_7_days_total ?? 0}</div>
                        <div className={styles.metricLabel}>近 7 天总计</div>
                    </div>
                </div>
            )}
            {!overview?.incident_stats && !loading && (
                <div className={styles.lockedOverlay}>
                    <LockOutlined className={styles.lockedIcon} />
                    <span className={styles.lockedText}>暂无权限查看</span>
                </div>
            )}
        </Card>

        <Card className={styles.card} style={{ flex: 1, position: 'relative' }} styles={{ body: { padding: 0 } }}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                    <CloudServerOutlined className={styles.cardTitleIcon} /> 纳管主机
                </span>
            </div>
            {loading ? (
                <div className={styles.loadingWrap}><Spin /></div>
            ) : (
                <div className={`${styles.cardBody} ${styles.metricCenter}`}>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#1677ff' }}>{overview?.host_stats?.online_count ?? 0}</div>
                        <div className={styles.metricLabel}>在线主机</div>
                    </div>
                    <div className={styles.metricValue}>
                        <div className={styles.metricNumber} style={{ color: '#bfbfbf' }}>{overview?.host_stats?.offline_count ?? 0}</div>
                        <div className={styles.metricLabel}>离线</div>
                    </div>
                </div>
            )}
            {!overview?.host_stats && !loading && (
                <div className={styles.lockedOverlay}>
                    <LockOutlined className={styles.lockedIcon} />
                    <span className={styles.lockedText}>暂无权限查看</span>
                </div>
            )}
        </Card>
    </div>
);

export default WorkbenchMetricsRow;
