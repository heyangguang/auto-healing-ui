import { FundOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import { INSTANCE_STATUS_COLORS } from '@/constants/instanceDicts';
import { buildInstanceStatusChartData } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { DASHBOARD_DONUT_INNER_RADIUS, DASHBOARD_DONUT_RADIUS } from './dashboardDonutChartConfig';
import { readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

const METRIC_LABEL = '实例数';

const ChartInstanceStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => buildInstanceStatusChartData(data ?? undefined).map((item) => withMetricLabel({
        type: item.type,
    }, METRIC_LABEL, item.value)), [data]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    const total = React.useMemo(() => {
        return Number(data?.instances_total ?? chartData.reduce((sum, item) => sum + readMetricValue(item, METRIC_LABEL), 0));
    }, [data, chartData]);

    return (
        <WidgetWrapper title="实例状态分布" icon={<FundOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={DASHBOARD_CHART_CONTAINER_STYLE}>
                {canRenderChart ? (
                    <Pie
                        width={width}
                        height={height}
                        data={chartData}
                        angleField={METRIC_LABEL}
                        colorField="type"
                        radius={DASHBOARD_DONUT_RADIUS}
                        innerRadius={DASHBOARD_DONUT_INNER_RADIUS}
                        color={Object.values(INSTANCE_STATUS_COLORS)}
                        label={false}
                        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                        tooltip={{ title: 'type' }}
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
                ) : (
                    <DashboardChartFallback hasData={chartData.length > 0} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ChartInstanceStatus;
