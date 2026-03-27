/**
 * 通用 Dashboard 排行榜组件
 * 水平条形图样式，解决文字过长 X 轴拥挤问题
 */
import { OrderedListOutlined } from '@ant-design/icons';
import { Bar } from '@ant-design/plots';
import React from 'react';
import { useDashboardSection, type DashboardSectionKey } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';

import type { WidgetComponentProps } from '../widgetRegistry';

interface DashboardRankChartProps extends Partial<WidgetComponentProps> {
    section: DashboardSectionKey;
    field: string;
    title: string;
    icon?: React.ReactNode;
    color?: string;
}

const DashboardRankChart: React.FC<DashboardRankChartProps> = ({ section, field, title, icon, color, isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection(section);
    const { ref, width, height } = useContainerSize();

    const items = Array.isArray(data?.[field]) ? (data[field] as { name: string; count: number }[]) : [];

    const chartData = React.useMemo(() => {
        return items
            .map((d) => ({
                name: d.name?.length > 16 ? `${d.name.slice(0, 16)}…` : d.name ?? '未知',
                count: Number(d.count),
            }))
            .sort((a, b) => a.count - b.count)
            .slice(-10);
    }, [items]);

    return (
        <WidgetWrapper title={title} icon={icon || <OrderedListOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Bar
                        width={width}
                        height={height}
                        data={chartData}
                        xField="name"
                        yField="count"
                        color={color || '#722ed1'}
                        label={{
                            text: 'count',
                            position: 'right',
                            style: { fontSize: 10, fill: '#666' },
                        }}
                        axis={{
                            x: {
                                label: {
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
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardRankChart;
