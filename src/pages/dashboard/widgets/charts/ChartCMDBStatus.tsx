import { CloudServerOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import { useDashboardSection } from '../useDashboardSection';

const STATUS_LABELS: Record<string, string> = {
    active: '活跃',
    inactive: '停用',
    maintenance: '维护中',
};

const STATUS_COLORS = ['#52c41a', '#d9d9d9', '#faad14'];

const ChartCMDBStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => {
        if (!data?.by_status) return [];
        return data.by_status.map((item: any) => ({
            type: STATUS_LABELS[item.status] || item.status,
            value: Number(item.count),
        }));
    }, [data]);

    const total = React.useMemo(() => chartData.reduce((s: number, d: any) => s + d.value, 0), [chartData]);

    return (
        <WidgetWrapper title="CMDB 状态分布" icon={<CloudServerOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
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
                        color={STATUS_COLORS}
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
                                    text: '总资产',
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
export default ChartCMDBStatus;
