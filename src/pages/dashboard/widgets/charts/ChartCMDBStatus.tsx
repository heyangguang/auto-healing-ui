import { CloudServerOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import { useDashboardSection } from '../useDashboardSection';
import { CMDB_STATUS_LABELS, CMDB_STATUS_MAP } from '@/constants/cmdbDicts';
import DashboardChartFallback, { DASHBOARD_CHART_CONTAINER_STYLE } from './DashboardChartFallback';
import { DASHBOARD_DONUT_INNER_RADIUS, DASHBOARD_DONUT_RADIUS } from './dashboardDonutChartConfig';
import { readMetricValue, withMetricLabel } from './dashboardChartMetricLabel';

const METRIC_LABEL = '资产数';

type StatusCountItem = {
    status?: string;
    count?: number;
};

const ChartCMDBStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => {
        if (!data?.by_status) return [];
        return (data.by_status as StatusCountItem[]).map((item) => {
            const status = item.status ?? '';
            return withMetricLabel({
                type: CMDB_STATUS_LABELS[status] || status,
            }, METRIC_LABEL, Number(item.count));
        });
    }, [data]);

    const total = React.useMemo(() => chartData.reduce((sum, item) => sum + readMetricValue(item, METRIC_LABEL), 0), [chartData]);
    const canRenderChart = width > 0 && height > 0 && chartData.length > 0;

    return (
        <WidgetWrapper title="CMDB 状态分布" icon={<CloudServerOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
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
                        color={Object.values(CMDB_STATUS_MAP).map(s => s.color)}
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
                ) : (
                    <DashboardChartFallback hasData={chartData.length > 0} />
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ChartCMDBStatus;
