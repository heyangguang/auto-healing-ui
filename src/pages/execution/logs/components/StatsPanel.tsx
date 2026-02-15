import React, { useEffect, useState, useMemo } from 'react';
import { Tooltip, Spin } from 'antd';
import {
    ThunderboltOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    DashboardOutlined,
    CalendarOutlined,
    FieldTimeOutlined,
} from '@ant-design/icons';
import { getExecutionRunStats } from '@/services/auto-healing/execution';

/* ====== 类型 ====== */
interface StatsData {
    total_count: number;
    success_count: number;
    failed_count: number;
    partial_count: number;
    cancelled_count: number;
    success_rate: number;
    avg_duration_sec: number;
    today_count: number;
}

/* ====== 统计条组件 ====== */
const StatsPanel: React.FC = () => {
    const [stats, setStats] = useState<StatsData>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await getExecutionRunStats();
                if (!cancelled) setStats(res.data);
            } catch (e) {
                console.error('Failed to load execution stats', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const items = useMemo(() => {
        if (!stats) return [];
        return [
            {
                icon: <ThunderboltOutlined />,
                cls: 'total',
                val: stats.total_count.toLocaleString(),
                lbl: '总执行',
                tip: '全部执行记录总数',
            },
            {
                icon: <CheckCircleOutlined />,
                cls: 'success',
                val: stats.success_count.toLocaleString(),
                lbl: '成功',
                tip: `成功率 ${stats.success_rate.toFixed(1)}%`,
            },
            {
                icon: <CloseCircleOutlined />,
                cls: 'failed',
                val: stats.failed_count.toLocaleString(),
                lbl: '失败',
                tip: `失败 ${stats.failed_count}，部分成功 ${stats.partial_count}，已取消 ${stats.cancelled_count}`,
            },
            {
                icon: <DashboardOutlined />,
                cls: 'rate',
                val: `${stats.success_rate.toFixed(1)}%`,
                lbl: '成功率',
                tip: `${stats.success_count} / ${stats.total_count}`,
            },
            {
                icon: <FieldTimeOutlined />,
                cls: 'duration',
                val: `${stats.avg_duration_sec.toFixed(1)}s`,
                lbl: '平均耗时',
                tip: '所有已完成执行的平均耗时',
            },
            {
                icon: <CalendarOutlined />,
                cls: 'today',
                val: String(stats.today_count),
                lbl: '今日',
                tip: '今日 00:00 后的执行记录数',
            },
        ];
    }, [stats]);

    if (loading) {
        return (
            <div className="exec-stats-bar">
                <Spin size="small" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="exec-stats-bar">
            {items.map((s, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <div className="exec-stat-divider" />}
                    <Tooltip title={s.tip}>
                        <div className="exec-stat-item">
                            <span className={`exec-stat-icon exec-stat-icon-${s.cls}`}>{s.icon}</span>
                            <div className="exec-stat-content">
                                <div className="exec-stat-value">{s.val}</div>
                                <div className="exec-stat-label">{s.lbl}</div>
                            </div>
                        </div>
                    </Tooltip>
                </React.Fragment>
            ))}
        </div>
    );
};

export default StatsPanel;
