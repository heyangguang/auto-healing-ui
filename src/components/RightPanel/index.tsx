import React from 'react';
import { createStyles } from 'antd-style';
import QuickActions from './QuickActions';
import UserInfoCard from './UserInfoCard';
import SystemInfoCard from './SystemInfoCard';
import AnnouncementCard from './AnnouncementCard';

const useStyles = createStyles(() => ({
    panel: {
        width: 260,
        minWidth: 260,
        maxWidth: 260,
        background: '#fafafa',
        borderLeft: '1px solid #f0f0f0',
        height: '100%',
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        padding: 12,
    },
}));

const RightPanel: React.FC = () => {
    const { styles } = useStyles();

    return (
        <aside className={styles.panel}>
            <QuickActions />
            <UserInfoCard />
            <SystemInfoCard />
            <AnnouncementCard />
        </aside>
    );
};

export default RightPanel;
