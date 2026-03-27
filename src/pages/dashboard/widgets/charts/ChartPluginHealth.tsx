import { DashboardOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import { useDashboardSection } from '../useDashboardSection';
import { PLUGIN_STATUS_LABELS, PLUGIN_STATUS_COLORS } from '@/constants/pluginDicts';

type StatusCountItem = {
    status?: string;
    count?: number;
};

const ChartPluginHealth: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('plugins');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => {
        if (!data?.by_status) return [];
        return (data.by_status as StatusCountItem[]).map((item) => {
            const status = item.status ?? '';
            return {
                type: PLUGIN_STATUS_LABELS[status] || status,
            value: Number(item.count),
            };
        });
    }, [data]);

    const total = React.useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);

    return (
        <WidgetWrapper title="插件健康状态" icon={<DashboardOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Pie
                        width={width}
                        height={height}
                        data={chartData}
                        angleField="value"
                        colorField="type"
                        radius={0.7}
                        innerRadius={0.55}
                        color={Object.values(PLUGIN_STATUS_COLORS)}
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
                                    text: '总插件',
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
export default ChartPluginHealth;
