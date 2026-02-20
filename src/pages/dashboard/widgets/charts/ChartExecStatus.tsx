import { ExperimentOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getExecutionRunStats } from '@/services/auto-healing/execution';
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
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRunStats());
    const { ref, width, height } = useContainerSize();

    const data = rawData as any;
    const chartData = React.useMemo(() => {
        const statsData = data?.data ?? data ?? {};
        // API 返回扁平字段: success_count, failed_count, partial_count, cancelled_count
        const entries = [
            { status: 'success', count: Number(statsData.success_count ?? 0) },
            { status: 'failed', count: Number(statsData.failed_count ?? 0) },
            { status: 'partial', count: Number(statsData.partial_count ?? 0) },
            { status: 'cancelled', count: Number(statsData.cancelled_count ?? 0) },
        ].filter((item) => item.count > 0);
        return entries.map((item) => ({
            status: STATUS_LABELS[item.status] || item.status,
            count: item.count,
            color: STATUS_COLORS[item.status] || '#8c8c8c',
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
