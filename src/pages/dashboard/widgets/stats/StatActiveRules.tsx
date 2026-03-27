import { SafetyOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveRules: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const totalRules = data?.rules_total ?? 0;
    const activeRules = data?.rules_active ?? 0;
    return (
        <WidgetWrapper title="活跃规则数" icon={<SafetyOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeRules} suffix={`/ ${totalRules}`} description="已激活 / 总规则数" color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatActiveRules;
