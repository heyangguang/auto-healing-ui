import React, { useState, useEffect } from 'react';
import { Tag } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(() => ({
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
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        fontSize: 13,
    },
    infoLabel: {
        color: '#8c8c8c',
    },
    infoValue: {
        color: '#262626',
        fontWeight: 500,
    },
}));

function formatUptime(startTime: number): string {
    const elapsed = Date.now() - startTime;
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}天 ${hours}小时`;
}

const SystemInfoCard: React.FC = () => {
    const { styles } = useStyles();
    // 模拟系统运行时间（12天前启动）
    const [startTime] = useState(() => Date.now() - 12 * 24 * 60 * 60 * 1000);
    const [uptime, setUptime] = useState(formatUptime(startTime));

    useEffect(() => {
        const timer = setInterval(() => setUptime(formatUptime(startTime)), 60000);
        return () => clearInterval(timer);
    }, [startTime]);

    return (
        <div className={styles.card}>
            <div className={styles.title}>系统信息</div>
            <div className={styles.infoRow}>
                <span className={styles.infoLabel}>版本</span>
                <span className={styles.infoValue}>v2.5.0</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.infoLabel}>运行时间</span>
                <span className={styles.infoValue}>{uptime}</span>
            </div>
            <div className={styles.infoRow}>
                <span className={styles.infoLabel}>环境</span>
                <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Production</Tag>
            </div>
        </div>
    );
};

export default SystemInfoCard;
