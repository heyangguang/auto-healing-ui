import { PieChartOutlined } from '@ant-design/icons';
import { Pie } from '@ant-design/plots';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getIncidentStats } from '@/services/auto-healing/incidents';
import { INCIDENT_CHART_COLORS, INCIDENT_CHART_LABELS } from '@/constants/incidentDicts';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';

const ChartIncidentStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(getIncidentStats, { formatResult: (r: any) => r });
    const { ref, width, height } = useContainerSize();

    const data = rawData as any;
    const chartData = React.useMemo(() => {
        if (!data) return [];
        return [
            { type: INCIDENT_CHART_LABELS.pending, value: data.pending ?? 0 },
            { type: INCIDENT_CHART_LABELS.processing, value: data.processing ?? 0 },
            { type: INCIDENT_CHART_LABELS.healed, value: data.healed ?? 0 },
            { type: INCIDENT_CHART_LABELS.failed, value: data.failed ?? 0 },
            { type: INCIDENT_CHART_LABELS.skipped, value: data.skipped ?? 0 },
            { type: INCIDENT_CHART_LABELS.dismissed, value: data.dismissed ?? 0 },
        ].filter((d) => d.value > 0);
    }, [data]);

    const total = React.useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);

    return (
        <WidgetWrapper title="工单状态分布" icon={<PieChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
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
                        color={Object.values(INCIDENT_CHART_COLORS)}
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
                )}
            </div>
        </WidgetWrapper>
    );
};
export default ChartIncidentStatus;
