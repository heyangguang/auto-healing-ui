import { ThunderboltOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getExecutionRuns } from '@/services/auto-healing/execution';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getExecutionRuns({ page_size: 1 }));
    const data = rawData as any;
    const total = data?.total ?? 0;
    return (
        <WidgetWrapper title="执行记录总数" icon={<ThunderboltOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={total} suffix="次" description="Ansible 执行记录" color="#eb2f96" />
        </WidgetWrapper>
    );
};
export default StatExecTotal;
