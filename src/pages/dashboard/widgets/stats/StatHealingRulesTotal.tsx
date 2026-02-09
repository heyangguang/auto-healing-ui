import { SafetyOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingRulesTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    return (
        <WidgetWrapper title="规则总数" icon={<SafetyOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.rules_total ?? 0} suffix="条" description={`活跃 ${data?.rules_active ?? 0}`} color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatHealingRulesTotal;
