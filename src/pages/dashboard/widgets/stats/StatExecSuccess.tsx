import { CheckCircleOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecSuccess: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRuns({ page_size: 200 }), { formatResult: (r: any) => r });
    const data = rawData as any;
    const items = data?.data ?? data?.items ?? [];
    const runs = Array.isArray(items) ? items : [];
    const success = runs.filter((r: any) => r.status === 'success').length;
    const total = runs.length;
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
