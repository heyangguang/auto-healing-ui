import { ForkOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getFlows } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveFlows: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getFlows({ page_size: 200 }));
    const data = rawData as any;
    const items = data?.data?.items ?? data?.data ?? data?.items ?? [];
    const totalFlows = Array.isArray(items) ? items.length : (data?.data?.total ?? data?.total ?? 0);
    const activeFlows = Array.isArray(items) ? items.filter((f: any) => f.is_active).length : 0;
    return (
        <WidgetWrapper title="活跃流程数" icon={<ForkOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeFlows} suffix={`/ ${totalFlows}`} description="已激活 / 总流程数" color="#2f54eb" />
        </WidgetWrapper>
    );
};
export default StatActiveFlows;
