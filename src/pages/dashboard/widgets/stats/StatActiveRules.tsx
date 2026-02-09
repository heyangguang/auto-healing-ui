import { SafetyOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getRules } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveRules: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getRules({ page_size: 200 }));
    const data = rawData as any;
    const items = data?.data?.items ?? data?.data ?? data?.items ?? [];
    const totalRules = Array.isArray(items) ? items.length : (data?.data?.total ?? data?.total ?? 0);
    const activeRules = Array.isArray(items) ? items.filter((r: any) => r.is_active).length : 0;
    return (
        <WidgetWrapper title="活跃规则数" icon={<SafetyOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeRules} suffix={`/ ${totalRules}`} description="已激活 / 总规则数" color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatActiveRules;
