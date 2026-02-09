import { DeploymentUnitOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getHealingInstances } from '@/services/auto-healing/instances';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatInstanceTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getHealingInstances({ page_size: 1 }));
    const data = rawData as any;
    const total = data?.total ?? 0;
    return (
        <WidgetWrapper title="自愈实例总数" icon={<DeploymentUnitOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={total} suffix="个" description="历史自愈实例总数" color="#722ed1" />
        </WidgetWrapper>
    );
};
export default StatInstanceTotal;
