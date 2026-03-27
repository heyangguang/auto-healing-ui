import { FundOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import { INSTANCE_STATUS_COLORS } from '@/constants/instanceDicts';
import { buildInstanceStatusChartData } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';

const ChartInstanceStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => buildInstanceStatusChartData(data ?? undefined), [data]);

    const total = React.useMemo(() => {
        return Number(data?.instances_total ?? chartData.reduce((sum, item) => sum + item.value, 0));
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
