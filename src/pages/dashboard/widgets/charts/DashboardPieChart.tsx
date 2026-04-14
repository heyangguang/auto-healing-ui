/**
 * 通用 Dashboard Pie 图表组件
 * 统一样式：label 关闭、底部居中图例、中心数字
 */
import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import { useDashboardSection, type DashboardSectionKey } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { DASHBOARD_DONUT_INNER_RADIUS, DASHBOARD_DONUT_RADIUS } from './dashboardDonutChartConfig';
import { getDashboardChartMetricLabel, readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardPieChartProps extends Partial<WidgetComponentProps> {
    section: DashboardSectionKey;
    field: string;
    title: string;
    icon?: React.ReactNode;
    labelMap?: Record<string, string>;
    colorMap?: Record<string, string>;
    centerLabel?: string;
}

const PALETTE = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'];

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ section, field, title, icon, labelMap, colorMap, centerLabel, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const { ref, width, height } = useContainerSize();
    const metricLabel = React.useMemo(() => getDashboardChartMetricLabel(section, field), [field, section]);

    const items = Array.isArray(data?.[field]) ? (data[field] as { status: string; count: number }[]) : [];

    const chartData = React.useMemo(() => {
        return items
            .filter((d) => d.count > 0)
            .map((d) => withMetricLabel({
                type: labelMap?.[d.status] ?? d.status ?? '未知',
            }, metricLabel, Number(d.count)));
    }, [items, labelMap, metricLabel]);

    const total = React.useMemo(() => chartData.reduce((sum, item) => sum + readMetricValue(item, metricLabel), 0), [chartData, metricLabel]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    return (
        <WidgetWrapper title={title} icon={icon || <PieChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={DASHBOARD_CHART_CONTAINER_STYLE}>
                {canRenderChart ? (
                    <Pie
                        width={width}
                        height={height}
                        data={chartData}
                        angleField={metricLabel}
                        colorField="type"
                        radius={DASHBOARD_DONUT_RADIUS}
                        innerRadius={DASHBOARD_DONUT_INNER_RADIUS}
                        color={colorMap ? Object.values(colorMap) : PALETTE}
                        label={false}
                        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                        interaction={{ elementHighlight: true }}
                        tooltip={{ title: 'type' }}
                        annotations={[
                            {
                                type: 'text',
                                style: {
                                    text: `${total}`,
                                    x: '50%',
                                    y: '44%',
                                    textAlign: 'center',
                                    fontSize: 16,
                                    fontWeight: 700,
                                    fill: '#333',
                                },
                            },
                            {
                                type: 'text',
                                style: {
                                    text: centerLabel || '总计',
                                    x: '50%',
                                    y: '54%',
                                    textAlign: 'center',
                                    fontSize: 10,
                                    fill: '#999',
                                },
                            },
                        ]}
                    />
                ) : (
                    <DashboardChartFallback hasData={chartData.length > 0} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardPieChart;
