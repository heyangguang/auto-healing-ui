import React from 'react';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    CodeOutlined,
    SyncOutlined,
} from '@ant-design/icons';

export type PlaybookStatsSummary = {
    total: number;
    ready: number;
    pendingScan: number;
    pendingOnline: number;
    error: number;
};

type PlaybookStatItem = {
    cls: string;
    icon: React.ReactNode;
    lbl: string;
    val: number;
};

const buildStatItems = (stats: PlaybookStatsSummary): PlaybookStatItem[] => (
    [
        { icon: <CodeOutlined />, cls: 'total', val: stats.total, lbl: '总模板' },
        { icon: <CheckCircleOutlined />, cls: 'ready', val: stats.ready, lbl: '就绪' },
        { icon: <ClockCircleOutlined />, cls: 'pending', val: stats.pendingScan, lbl: '待扫描' },
        { icon: <SyncOutlined />, cls: 'online', val: stats.pendingOnline, lbl: '待上线' },
        { icon: <CloseCircleOutlined />, cls: 'error', val: stats.error, lbl: '错误' },
    ].filter((item) => item.val > 0 || item.cls === 'total' || item.cls === 'ready')
);

const PlaybookStatsBar: React.FC<{
    stats: PlaybookStatsSummary;
}> = ({ stats }) => (
    <div className="pb-stats-bar">
        {buildStatItems(stats).map((item, index) => (
            <React.Fragment key={item.cls}>
                {index > 0 && <div className="pb-stat-divider" />}
                <div className="pb-stat-item">
                    <span className={`pb-stat-icon pb-stat-icon-${item.cls}`}>{item.icon}</span>
                    <div className="pb-stat-content">
                        <div className="pb-stat-value">{item.val}</div>
                        <div className="pb-stat-label">{item.lbl}</div>
                    </div>
                </div>
            </React.Fragment>
        ))}
    </div>
);

export default PlaybookStatsBar;
