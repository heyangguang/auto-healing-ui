import React from 'react';
import { AppstoreOutlined, LockOutlined } from '@ant-design/icons';
import { Card, Spin } from 'antd';

type PlatformStatItem = {
    color: string;
    icon: React.ReactNode;
    label: string;
    locked: boolean;
    path: string;
    sub: string;
    value: number;
};

type WorkbenchResourceOverviewCardProps = {
    loading: boolean;
    onSelectPath: (path: string) => void;
    platformStats: PlatformStatItem[];
    styles: Record<string, string>;
};

const WorkbenchResourceOverviewCard: React.FC<WorkbenchResourceOverviewCardProps> = ({
    loading,
    onSelectPath,
    platformStats,
    styles,
}) => (
    <Card className={styles.card} styles={{ body: { padding: 0 } }}>
        <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>
                <AppstoreOutlined className={styles.cardTitleIcon} /> 平台资源概览
            </span>
        </div>
        {loading ? (
            <div className={styles.loadingWrap}><Spin /></div>
        ) : (
            <div className={styles.resourceGrid}>
                {platformStats.map((item) => (
                    <button
                        key={item.path || item.label}
                        type="button"
                        className={`${styles.resourceItem} ${item.locked ? styles.lockedResourceItem : ''}`}
                        onClick={() => {
                            if (!item.locked) onSelectPath(item.path);
                        }}
                        disabled={item.locked}
                    >
                        <span className={styles.resourceIcon} style={{ color: item.locked ? '#d9d9d9' : item.color }}>
                            {item.locked ? <LockOutlined /> : item.icon}
                        </span>
                        <span className={styles.resourceValue} style={item.locked ? { color: '#d9d9d9' } : undefined}>
                            {item.locked ? '-' : item.value}
                        </span>
                        <span className={styles.resourceLabel} style={item.locked ? { color: '#d9d9d9' } : undefined}>{item.label}</span>
                        <span className={styles.resourceSub} style={item.locked ? { color: '#e8e8e8' } : undefined}>
                            {item.locked ? '无权限' : item.sub}
                        </span>
                    </button>
                ))}
            </div>
        )}
    </Card>
);

export default WorkbenchResourceOverviewCard;
