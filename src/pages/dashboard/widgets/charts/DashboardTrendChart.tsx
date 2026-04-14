/**
 * 通用 Dashboard Line/Area 趋势图组件
 */
import { LineChartOutlined } from '@ant-design/icons';
import { Area, Line } from '@ant-design/plots';
import React from 'react';
import { useDashboardSection, type DashboardSectionKey } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { getDashboardChartMetricLabel, readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardTrendChartProps extends Partial<WidgetComponentProps> {
    section: DashboardSectionKey;
    field: string;
    title: string;
    icon?: React.ReactNode;
    chartType?: 'line' | 'area';
    color?: string;
}

const DashboardTrendChart: React.FC<DashboardTrendChartProps> = ({ section, field, title, icon, chartType = 'line', color, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const { ref, width, height } = useContainerSize();
    const metricLabel = React.useMemo(() => getDashboardChartMetricLabel(section, field), [field, section]);

    const items = Array.isArray(data?.[field]) ? (data[field] as { date: string; count: number }[]) : [];

    const chartData = React.useMemo(() => {
        // 尝试解析日期范围 (7d 或 30d)
        let days = 7;
        if (field.includes('30d')) days = 30;

        // 生成完整的日期序列
        const fullData: Array<Record<string, unknown>> = [];
        const now = new Date();
        const dataMap = new Map(items.map(i => {
            const d = new Date(i.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return [key, Number(i.count)];
        }));

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            fullData.push({
                ...withMetricLabel({ date: dateStr }, metricLabel, dataMap.get(dateStr) ?? 0),
            });
        }

        if (items.length === 0 && !field.includes('d')) return [];

        return fullData;
    }, [field, items, metricLabel]);

    const Chart = chartType === 'area' ? Area : Line;
    const hasChartData = chartData.length > 0 && chartData.some((item) => readMetricValue(item, metricLabel) > 0);
    const canRenderChart = width > 0 && height > 0 && hasChartData;

    return (
        <WidgetWrapper title={title} icon={icon || <LineChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={DASHBOARD_CHART_CONTAINER_STYLE}>
                {canRenderChart ? (
                    <Chart
                        width={width}
                        height={height}
                        data={chartData}
                        xField="date"
                        yField={metricLabel}
                        color={color || '#1677ff'}
                        smooth
                        tooltip={{ title: 'date' }}
                        axis={{
                            x: {
                                tickCount: 5, // 限制刻度数量，防止过密
                                label: {
                                    formatter: (v: string) => {
                                        if (!v) return '';
                                        // 假设 v 是 "2026-01-15T00:00:00Z" 或 "2026-01-15"
                                        // 简单截取 MM-DD: 2026-01-15 -> 01-15
                                        try {
                                            const date = new Date(v);
                                            const mon = String(date.getMonth() + 1).padStart(2, '0');
                                            const day = String(date.getDate()).padStart(2, '0');
                                            return `${mon}-${day}`;
                                        } catch (_e) {
                                            return v;
                                        }
                                    },
                                    autoRotate: false, // 禁止自动旋转
                                    rotate: 0,         // 强制水平
                                    autoHide: true,
                                    style: { fontSize: 10, fill: '#999' },
                                },
                            },
                            y: {
                                label: { style: { fontSize: 10, fill: '#999' } },
                                grid: { line: { style: { lineWidth: 0.5, lineDash: [4, 4], stroke: '#eee' } } },
                            },
                        }}
                        point={{ size: 2, shape: 'circle', style: { fill: '#fff', stroke: color || '#1677ff', lineWidth: 1.5 } }}
                    />
                ) : (
                    <DashboardChartFallback hasData={hasChartData} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardTrendChart;
