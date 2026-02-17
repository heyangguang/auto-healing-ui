import { SafetyOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getRuleStats } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveRules: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getRuleStats());
    const data = rawData as any;
    const statsData = data?.data ?? data ?? {};
    const totalRules = statsData.total ?? 0;
    const activeRules = statsData.active_count ?? 0;
    return (
        <WidgetWrapper title="活跃规则数" icon={<SafetyOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeRules} suffix={`/ ${totalRules}`} description="已激活 / 总规则数" color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatActiveRules;
