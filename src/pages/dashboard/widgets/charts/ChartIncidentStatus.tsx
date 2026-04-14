import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import { INCIDENT_CHART_COLORS } from '@/constants/incidentDicts';
import { buildIncidentStatusChartData } from '../dashboardOverviewHelpers';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { DASHBOARD_DONUT_INNER_RADIUS, DASHBOARD_DONUT_RADIUS } from './dashboardDonutChartConfig';
import { readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

const METRIC_LABEL = '工单数';

const ChartIncidentStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => buildIncidentStatusChartData(data ?? undefined).map((item) => withMetricLabel({
        type: item.type,
    }, METRIC_LABEL, item.value)), [data]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    const total = React.useMemo(
        () => Number(data?.total ?? chartData.reduce((sum, item) => sum + readMetricValue(item, METRIC_LABEL), 0)),
        [chartData, data?.total],
    );

    return (
        <WidgetWrapper title="工单状态分布" icon={<PieChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
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
                        color={Object.values(INCIDENT_CHART_COLORS)}
                        label={false}
                        legend={{ color: { position: 'bottom', layout: { justifyContent: 'center' } } }}
                        interaction={{ elementHighlight: true }}
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
                                    text: '总工单',
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
export default ChartIncidentStatus;
