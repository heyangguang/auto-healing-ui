import { TeamOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatUsers: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('users');
    return (
        <WidgetWrapper title="用户总数" icon={<TeamOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.total ?? 0} suffix="人" description={`活跃 ${data?.active ?? 0} · 角色 ${data?.roles_total ?? 0}`} color="#1677ff" />
        </WidgetWrapper>
    );
};
export default StatUsers;
