import React from 'react';
import { Button, Card, Empty, Spin, Tag } from 'antd';
import { RightOutlined, ScheduleOutlined } from '@ant-design/icons';
import { INCIDENT_SEVERITY_MAP } from '@/constants/incidentDicts';
import type { PendingWorkbenchState } from './workbenchTypes';

type PendingApprovalsCardProps = {
    canViewApprovals: boolean;
    canViewPendingCenter: boolean;
    canViewPendingTrigger: boolean;
    loading: boolean;
    onOpenPendingCenter: () => void;
    pendingApprovals: PendingWorkbenchState;
    pendingCenterPath: string;
    styles: Record<string, string>;
};

const WorkbenchPendingApprovalsCard: React.FC<PendingApprovalsCardProps> = ({
    canViewApprovals,
    canViewPendingCenter,
    canViewPendingTrigger,
    loading,
    onOpenPendingCenter,
    pendingApprovals,
    styles,
}) => (
    <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <ScheduleOutlined className={styles.cardTitleIcon} /> 待办审批
            </span>
            <span
                className={styles.cardLink}
                onClick={() => canViewPendingCenter && onOpenPendingCenter()}
                style={!canViewPendingCenter ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            >
                进入待办中心 <RightOutlined style={{ fontSize: 10 }} />
            </span>
        </div>
        {loading ? (
            <div className={styles.loadingWrap}><Spin /></div>
        ) : !canViewApprovals && !canViewPendingTrigger && canViewPendingCenter ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前卡片仅聚合自愈与任务审批，其他待办请前往待办中心查看" />
            </div>
        ) : pendingApprovals.total === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无待办任务" />
            </div>
        ) : (
            <div style={{ padding: 0, flex: 1 }}>
                {pendingApprovals.items.slice(0, 5).map((item) => {
                    const severity = item._pendingType === 'trigger'
                        ? (INCIDENT_SEVERITY_MAP[item.severity || 'medium'] || INCIDENT_SEVERITY_MAP.medium)
                        : null;
                    return (
                        <div
                            key={item.id}
                            className={styles.pendingItem}
                            onClick={() => canViewPendingCenter && onOpenPendingCenter()}
                            style={!canViewPendingCenter ? { cursor: 'default' } : undefined}
                        >
                            <span className={styles.pendingDot} style={{ background: severity?.color || '#1677ff' }} />
                            <div className={styles.pendingContent}>
                                <span className={styles.pendingTitle} style={{ flex: 1, minWidth: 0 }}>{item.title || item.node_name || '待办任务'}</span>
                                <Tag color={severity?.color || 'blue'} style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px', borderRadius: 2, flexShrink: 0 }}>
                                    {severity?.text || '待审批'}
                                </Tag>
                                <span className={styles.pendingType}>{item._pendingType === 'trigger' ? '自愈' : '任务'}</span>
                            </div>
                            <span className={styles.pendingTime}>{item.created_at || ''}</span>
                        </div>
                    );
                })}
                {pendingApprovals.total > 5 && (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <Button type="link" size="small" disabled={!canViewPendingCenter} onClick={onOpenPendingCenter}>
                            还有 {pendingApprovals.total - 5} 条待办
                        </Button>
                    </div>
                )}
            </div>
        )}
    </Card>
);

export default WorkbenchPendingApprovalsCard;
