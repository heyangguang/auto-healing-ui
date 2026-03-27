import TeamsAvatar from '@/components/TeamsAvatar';
import { HistoryOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Empty } from 'antd';
import React from 'react';
import { ACTION_LABELS, ALL_RESOURCE_LABELS } from '@/constants/auditDicts';
import type { AuditLogRecord } from '@/pages/system/audit-logs/types';

type WorkbenchChangeLogCardProps = {
    auditLogs: AuditLogRecord[];
    canViewAuditLogs: boolean;
    formatRelativeTime: (isoStr: string) => string;
    loading: boolean;
    onOpenAuditLogs: () => void;
    styles: Record<string, string>;
};

const WorkbenchChangeLogCard: React.FC<WorkbenchChangeLogCardProps> = ({
    auditLogs,
    canViewAuditLogs,
    formatRelativeTime,
    loading,
    onOpenAuditLogs,
    styles,
}) => (
    <Card className={styles.card} style={{ flex: 1 }} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <HistoryOutlined className={styles.cardTitleIcon} /> 变更记录
            </span>
            <span className={styles.cardLink} onClick={() => canViewAuditLogs && onOpenAuditLogs()} style={!canViewAuditLogs ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}>
                查看全部 <RightOutlined style={{ fontSize: 10 }} />
            </span>
        </div>
        {loading ? (
            <div className={styles.loadingWrap}><span className="ant-spin ant-spin-spinning" /></div>
        ) : auditLogs.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变更记录" style={{ padding: '20px 0' }} />
        ) : (
            <div>
                {auditLogs.slice(0, 6).map((log) => {
                    const actionLabel = ACTION_LABELS[log.action || ''] || log.action;
                    const resourceLabel = ALL_RESOURCE_LABELS[log.resource_type || ''] || log.resource_type;
                    const userName = log.username || log.user?.display_name || '系统';
                    return (
                        <div key={log.id} className={styles.changeItem}>
                            <TeamsAvatar seed={userName} name={userName} size={32} />
                            <div className={styles.changeContent}>
                                <div className={styles.changeText}>
                                    <strong>{userName}</strong> {actionLabel} <span style={{ color: '#1677ff' }}>{log.resource_name || resourceLabel}</span>
                                </div>
                                {log.resource_name && <div className={styles.changeDetail}>{resourceLabel}</div>}
                            </div>
                            <span className={styles.changeTime}>{log.created_at ? formatRelativeTime(log.created_at) : ''}</span>
                        </div>
                    );
                })}
            </div>
        )}
    </Card>
);

export default WorkbenchChangeLogCard;
