import { AuditOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingPendingApprovals: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    return (
        <WidgetWrapper title="待审批任务" icon={<AuditOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.pending_approvals ?? 0} suffix="条" description="等待人工审批" color="#eb2f96" />
        </WidgetWrapper>
    );
};
export default StatHealingPendingApprovals;
