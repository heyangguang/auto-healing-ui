import { BellOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Empty } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import type { AnnouncementItem } from '@/services/auto-healing/workbench';

type WorkbenchAnnouncementsCardProps = {
    announcements: AnnouncementItem[];
    canViewSiteMessages: boolean;
    onOpenMessages: () => void;
    styles: Record<string, string>;
};

const WorkbenchAnnouncementsCard: React.FC<WorkbenchAnnouncementsCardProps> = ({
    announcements,
    canViewSiteMessages,
    onOpenMessages,
    styles,
}) => (
    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <BellOutlined className={styles.cardTitleIcon} /> 系统公告
            </span>
            <span className={styles.cardLink} onClick={() => canViewSiteMessages && onOpenMessages()} style={!canViewSiteMessages ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}>
                {canViewSiteMessages ? '查看全部' : '仅展示公告'} <RightOutlined style={{ fontSize: 10 }} />
            </span>
        </div>
        <div className={styles.cardBody} style={{ padding: '4px 16px' }}>
            {announcements.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无公告" style={{ padding: '8px 0' }} />
            ) : (
                announcements.slice(0, 5).map((item) => {
                    const plainText = item.content ? item.content.replace(/<[^>]*>/g, '').trim() : '';
                    return (
                        <div key={item.id} className={styles.announcement} onClick={() => canViewSiteMessages && onOpenMessages()} style={!canViewSiteMessages ? { cursor: 'default' } : undefined}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className={styles.announcementTitle}>{item.title}</span>
                            </div>
                            {plainText && <div className={styles.announcementSummary}>{plainText}</div>}
                            <div className={styles.announcementDate}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</div>
                        </div>
                    );
                })
            )}
        </div>
    </Card>
);

export default WorkbenchAnnouncementsCard;
