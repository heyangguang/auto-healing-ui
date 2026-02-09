/**
 * 通用 Dashboard Pie 图表组件
 * 统一样式：label 关闭、底部居中图例、中心数字
 */
import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { Empty } from 'antd';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardPieChartProps extends Partial<WidgetComponentProps> {
    section: string;
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

    const items: { status: string; count: number }[] = data?.[field] ?? [];

    const chartData = React.useMemo(() => {
        return items
            .filter((d) => d.count > 0)
            .map((d) => ({
                type: labelMap?.[d.status] ?? d.status ?? '未知',
                value: Number(d.count),
            }));
    }, [items, labelMap]);

    const total = React.useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);

    return (
        <WidgetWrapper title={title} icon={icon || <PieChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {(width > 0 && height > 0 && chartData.length > 0) ? (
                    <Pie
                        width={width}
                        height={height}
                        data={chartData}
                        angleField="value"
                        colorField="type"
                        radius={0.7}
                        innerRadius={0.55}
                        color={colorMap ? Object.values(colorMap) : PALETTE}
                        label={false}
                        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                        interaction={{ elementHighlight: true }}
                        tooltip={{ title: false }}
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
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    </div>
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardPieChart;
