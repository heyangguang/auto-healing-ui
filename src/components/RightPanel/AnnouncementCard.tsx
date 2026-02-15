import React from 'react';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
    card: {
        background: '#fff',
        border: '1px solid #f0f0f0',
        padding: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 12,
    },
    item: {
        padding: '8px 0',
        borderBottom: '1px solid #fafafa',
        '&:last-child': {
            borderBottom: 'none',
        },
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: 500,
        color: '#262626',
        lineHeight: '20px',
        cursor: 'pointer',
        '&:hover': {
            color: token.colorPrimary,
        },
    },
    itemDate: {
        fontSize: 12,
        color: '#bfbfbf',
        marginTop: 2,
    },
    empty: {
        fontSize: 13,
        color: '#bfbfbf',
        textAlign: 'center' as const,
        padding: '16px 0',
    },
}));

// 模拟公告数据
const MOCK_ANNOUNCEMENTS = [
    { id: 1, title: 'v2.5.0 版本发布更新说明', date: '2026-02-12' },
    { id: 2, title: '系统维护计划通知', date: '2026-02-10' },
];

const AnnouncementCard: React.FC = () => {
    const { styles } = useStyles();

    return (
        <div className={styles.card}>
            <div className={styles.title}>系统公告</div>
            {MOCK_ANNOUNCEMENTS.length === 0 ? (
                <div className={styles.empty}>暂无公告</div>
            ) : (
                MOCK_ANNOUNCEMENTS.map((item) => (
                    <div key={item.id} className={styles.item}>
                        <div className={styles.itemTitle}>{item.title}</div>
                        <div className={styles.itemDate}>{item.date}</div>
                    </div>
                ))
            )}
        </div>
    );
};

export default AnnouncementCard;
