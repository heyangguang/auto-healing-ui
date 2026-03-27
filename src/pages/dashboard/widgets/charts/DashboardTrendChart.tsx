/**
 * 通用 Dashboard Line/Area 趋势图组件
 */
import { LineChartOutlined } from '@ant-design/icons';
import { Area, Line } from '@ant-design/plots';
import { Empty } from 'antd';
import React from 'react';
import { useDashboardSection, type DashboardSectionKey } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import { useContainerSize } from '../../../../hooks/useContainerSize';

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

    const items = Array.isArray(data?.[field]) ? (data[field] as { date: string; count: number }[]) : [];

    const chartData = React.useMemo(() => {
        // 尝试解析日期范围 (7d 或 30d)
        let days = 7;
        if (field.includes('30d')) days = 30;

        // 生成完整的日期序列
        const fullData: { date: string; count: number }[] = [];
        const now = new Date();
        const dataMap = new Map(items.map(i => {
            // 统一日期格式为 YYYY-MM-DD 以便匹配
            const d = new Date(i.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return [key, Number(i.count)];
        }));

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            // 如果后端返回的是 ISOString，Map 匹配可能需要更灵活，这里假设后端日期如果是 ISO 也会被 new Date 正确解析
            // 为了匹配后端返回的 key，尝试反向查找
            // 简单做法：直接用生成的 dateStr 作为显示，如果在 dataMap 中找到就用 count，否则 0

            // 稍微复杂点：后端返回的 date string 可能是 ISO。我们已经 map 成了 YYYY-MM-DD key。
            fullData.push({
                date: dateStr,
                count: dataMap.get(dateStr) ?? 0,
            });
        }

        // 如果数据完全为空（所有都是0），可能也需要显示（趋势图全0也是一种趋势），但如果 items 本身为空且非 7d/30d 模式，则可能真的无数据
        if (items.length === 0 && !field.includes('d')) return [];

        return fullData;
    }, [items, field]);

    const Chart = chartType === 'area' ? Area : Line;

    return (
        <WidgetWrapper title={title} icon={icon || <LineChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {(width > 0 && height > 0 && chartData.length > 0 && chartData.some(d => d.count > 0)) ? (
                    <Chart
                        width={width}
                        height={height}
                        data={chartData}
                        xField="date"
                        yField="count"
                        color={color || '#1677ff'}
                        smooth
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
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" />
                    </div>
                )}
            </div>
        </WidgetWrapper>
    );
};
export default DashboardTrendChart;
