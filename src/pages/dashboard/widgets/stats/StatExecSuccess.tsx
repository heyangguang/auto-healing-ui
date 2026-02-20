import { CheckCircleOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getExecutionRunStats } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecSuccess: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRunStats());
    const data = rawData as any;
    const statsData = data?.data ?? data ?? {};
    const success = statsData.success_count ?? 0;
    const total = statsData.total_count ?? 0;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) : '0.0';
    return (
        <WidgetWrapper title="执行成功率" icon={<CheckCircleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={rate}
                suffix="%"
                description={`成功 ${success} / 总计 ${total}`}
                color={Number(rate) >= 80 ? '#52c41a' : '#faad14'}
            />
        </WidgetWrapper>
    );
};
export default StatExecSuccess;
