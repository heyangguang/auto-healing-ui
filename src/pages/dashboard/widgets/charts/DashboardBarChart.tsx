/**
 * 通用 Dashboard Bar 图表组件
 * X 轴标签自动截断+倾斜，柱内标签白色，保持视觉整洁
 */
import { BarChartOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { Empty } from 'antd';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardBarChartProps extends Partial<WidgetComponentProps> {
    section: string;
    field: string;
    title: string;
    icon?: React.ReactNode;
    labelMap?: Record<string, string>;
    color?: string | string[];
}

const DashboardBarChart: React.FC<DashboardBarChartProps> = ({ section, field, title, icon, labelMap, color, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const { ref, width, height } = useContainerSize();

    const items: { status: string; count: number }[] = data?.[field] ?? [];

    const chartData = React.useMemo(() => {
        return items
            .filter((d) => d.count > 0)
            .map((d) => ({
                type: labelMap?.[d.status] ?? d.status ?? '未知',
                value: Number(d.count),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 12);
    }, [items, labelMap]);

    return (
        <WidgetWrapper title={title} icon={icon || <BarChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {(width > 0 && height > 0 && chartData.length > 0) ? (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="type"
                        yField="value"
                        colorField="type"
                        color={color || ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2', '#fa541c', '#2f54eb']}
                        label={{
                            content: (d: any) => `${d.value}`, // 使用 content 属性
                            textBaseline: 'bottom',
                            position: 'top', // 改为 top，位于柱子上方
                            style: {
                                fill: '#666', // 深色文字
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
                        tooltip={{ title: false }}
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
export default DashboardBarChart;
