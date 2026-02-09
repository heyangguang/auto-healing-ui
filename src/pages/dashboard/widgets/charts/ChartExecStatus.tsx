import { ExperimentOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import { useContainerSize } from '../../../../hooks/useContainerSize';

const STATUS_COLORS: Record<string, string> = {
    success: '#52c41a',
    failed: '#ff4d4f',
    running: '#1677ff',
    partial: '#faad14',
    cancelled: '#d9d9d9',
};
const STATUS_LABELS: Record<string, string> = {
    success: '成功',
    failed: '失败',
    running: '运行中',
    partial: '部分成功',
    cancelled: '已取消',
};

const ChartExecStatus: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRuns({ page_size: 200 }));
    const { ref, width, height } = useContainerSize();

    const data = rawData as any;
    const chartData = React.useMemo(() => {
        const items = data?.data ?? data?.items ?? [];
        if (!Array.isArray(items) || items.length === 0) return [];
        const counts: Record<string, number> = {};
        items.forEach((item: any) => {
            const s = item.status || 'unknown';
            counts[s] = (counts[s] || 0) + 1;
        });
        return Object.entries(counts).map(([status, count]) => ({
            status: STATUS_LABELS[status] || status,
            count,
            color: STATUS_COLORS[status] || '#8c8c8c',
        }));
    }, [data]);

    return (
        <WidgetWrapper title="执行状态分布" icon={<ExperimentOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <div ref={ref} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                {width > 0 && height > 0 && chartData.length > 0 && (
                    <Column
                        width={width}
                        height={height}
                        data={chartData}
                        xField="status"
                        yField="count"
                        colorField="status"
                        color={Object.values(STATUS_COLORS)}
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
