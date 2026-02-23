import { FundOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getHealingInstanceStats } from '@/services/auto-healing/instances';
import { INSTANCE_STATUS_COLORS, INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';

const ChartInstanceStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getHealingInstanceStats());
    const { ref, width, height } = useContainerSize();

    const data = rawData as any;
    const chartData = React.useMemo(() => {
        const statsData = data?.data ?? data ?? {};
        const byStatus = statsData.by_status ?? [];
        if (!Array.isArray(byStatus) || byStatus.length === 0) return [];
        return byStatus.map((item: any) => ({
            type: INSTANCE_STATUS_LABELS[item.status] || item.status,
            value: item.count,
        }));
    }, [data]);

    const total = React.useMemo(() => {
        const statsData = data?.data ?? data ?? {};
        return statsData.total ?? chartData.reduce((s: number, d: any) => s + d.value, 0);
    }, [data, chartData]);

    return (
        <WidgetWrapper title="实例状态分布" icon={<FundOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Pie
                        width={width}
                        height={height}
                        data={chartData}
                        angleField="value"
                        colorField="type"
                        radius={0.65}
                        innerRadius={0.55}
                        color={Object.values(INSTANCE_STATUS_COLORS)}
                        label={false}
                        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                        tooltip={{ title: false }}
                        annotations={[
                            {
                                type: 'text',
                                style: {
                                    text: `${total}`,
                                    x: '50%',
                                    y: '44%',
                                    textAlign: 'center',
                                    fontSize: 18,
                                    fontWeight: 700,
                                    fill: '#333',
                                },
                            },
                            {
                                type: 'text',
                                style: {
                                    text: '总实例',
                                    x: '50%',
                                    y: '54%',
                                    textAlign: 'center',
                                    fontSize: 10,
                                    fill: '#999',
                                },
                            },
                        ]}
                    />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ChartInstanceStatus;
