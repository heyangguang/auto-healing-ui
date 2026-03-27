import { ExperimentOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import React from 'react';
import { RUN_STATUS_COLORS } from '@/constants/executionDicts';
import { buildExecutionStatusChartData } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';

const ChartExecStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => buildExecutionStatusChartData(data), [data]);

    return (
        <WidgetWrapper title="执行状态分布" icon={<ExperimentOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="label"
                        yField="count"
                        colorField="label"
                        color={(datum: { status?: string }) => RUN_STATUS_COLORS[datum.status || ''] || '#8c8c8c'}
                        label={{
                            text: 'count',
                            position: 'inside',
                            style: { fill: '#fff', fontSize: 10, fontWeight: 500 },
                        }}
                        axis={{
                            x: {
                                label: {
                                    autoRotate: true,
                                    autoHide: true,
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
export default ChartExecStatus;
