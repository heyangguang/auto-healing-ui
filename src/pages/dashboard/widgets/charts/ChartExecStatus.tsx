import { ExperimentOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import React from 'react';
import { RUN_STATUS_COLORS } from '@/constants/executionDicts';
import { buildExecutionStatusChartData } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { withMetricLabel } from './dashboardChartMetricLabel';

const METRIC_LABEL = '执行次数';

const ChartExecStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => buildExecutionStatusChartData(data ?? undefined).map((item) => withMetricLabel({
        label: item.label,
        status: item.status,
    }, METRIC_LABEL, item.count)), [data]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    return (
        <WidgetWrapper title="执行状态分布" icon={<ExperimentOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={DASHBOARD_CHART_CONTAINER_STYLE}>
                {canRenderChart ? (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="label"
                        yField={METRIC_LABEL}
                        colorField="label"
                        color={(datum: { status?: string }) => RUN_STATUS_COLORS[datum.status || ''] || '#8c8c8c'}
                        label={{
                            text: METRIC_LABEL,
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
                        tooltip={{ title: 'label' }}
                    />
                ) : (
                    <DashboardChartFallback hasData={chartData.length > 0} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ChartExecStatus;
