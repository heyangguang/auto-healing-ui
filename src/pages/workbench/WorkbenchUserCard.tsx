import TeamsAvatar from '@/components/TeamsAvatar';
import { Card, Tag } from 'antd';
import React from 'react';

type WorkbenchUserCardProps = {
    displayName: string;
    role: string;
    seed: string;
    styles: Record<string, string>;
};

const WorkbenchUserCard: React.FC<WorkbenchUserCardProps> = ({
    displayName,
    role,
    seed,
    styles,
}) => (
    <Card className={styles.card} styles={{ body: { padding: 16 } }}>
        <div className={styles.userHeader}>
            <TeamsAvatar seed={seed} name={displayName} size={44} />
            <div>
                <div className={styles.userName}>{displayName}</div>
                <div className={styles.userRole}>
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{role}</Tag>
                </div>
            </div>
        </div>
    </Card>
);

export default WorkbenchUserCard;
