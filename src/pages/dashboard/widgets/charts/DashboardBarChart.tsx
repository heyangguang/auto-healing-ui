/**
 * 通用 Dashboard Bar 图表组件
 * X 轴标签自动截断+倾斜，柱内标签白色，保持视觉整洁
 */
import { BarChartOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import React from 'react';
import { useDashboardSection, type DashboardSectionKey } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { getDashboardChartMetricLabel, readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardBarChartProps extends Partial<WidgetComponentProps> {
    section: DashboardSectionKey;
    field: string;
    title: string;
    icon?: React.ReactNode;
    labelMap?: Record<string, string>;
    color?: string | string[];
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ section, field, title, icon, labelMap, color, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const { ref, width, height } = useContainerSize();
    const metricLabel = React.useMemo(() => getDashboardChartMetricLabel(section, field), [field, section]);

    const items = Array.isArray(data?.[field]) ? (data[field] as { status: string; count: number }[]) : [];

    const chartData = React.useMemo(() => {
        return items
            .filter((d) => d.count > 0)
            .map((d) => withMetricLabel({
                type: labelMap?.[d.status] ?? d.status ?? '未知',
            }, metricLabel, Number(d.count)))
            .sort((left, right) => readMetricValue(right, metricLabel) - readMetricValue(left, metricLabel))
            .slice(0, 12);
    }, [items, labelMap, metricLabel]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    return (
        <WidgetWrapper title={title} icon={icon || <BarChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={DASHBOARD_CHART_CONTAINER_STYLE}>
                {canRenderChart ? (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="type"
                        yField={metricLabel}
                        colorField="type"
                        color={color || ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c', '#2f54eb']}
                        label={{
                            content: (datum: Record<string, unknown>) => `${readMetricValue(datum, metricLabel)}`,
                            textBaseline: 'bottom',
                            position: 'top',
                            style: {
                                fill: '#666',
                                fontSize: 10,
                                fontWeight: 500,
                                opacity: 0.8,
                            },
                        }}
                        axis={{
                            x: {
                                label: {
                                    autoRotate: true,
                                    autoHide: true,
                                    autoEllipsis: true,
                                    style: { fontSize: 10 },
                                },
                            },
                            y: {
                                label: { style: { fontSize: 10 } },
                            },
                        }}
                        tooltip={{ title: 'type' }}
                    />
                ) : (
                    <DashboardChartFallback hasData={chartData.length > 0} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardBarChart;
