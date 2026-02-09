import { BarChartOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import React from 'react';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';
import { useDashboardSection } from '../useDashboardSection';

const ENV_LABELS: Record<string, string> = {
    production: '生产',
    staging: '预发布',
    development: '开发',
    testing: '测试',
    test: '测试',
};

const ChartCMDBEnv: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    const { ref, width, height } = useContainerSize();

    const chartData = React.useMemo(() => {
        if (!data?.by_environment) return [];
        return data.by_environment.map((item: any) => ({
            // dashboard overview API 使用 'status' 键, cmdb/stats API 使用 'environment' 键
            environment: ENV_LABELS[item.status || item.environment] || item.status || item.environment,
            count: Number(item.count),
        }));
    }, [data]);

    return (
        <WidgetWrapper title="CMDB 环境分布" icon={<BarChartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="environment"
                        yField="count"
                        colorField="environment"
                        color={['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1']}
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
export default ChartCMDBEnv;
