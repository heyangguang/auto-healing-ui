import { ThunderboltOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    const total = Number(data?.runs_total ?? 0);
    return (
        <WidgetWrapper title="执行记录总数" icon={<ThunderboltOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={total} suffix="次" description="Ansible 执行记录" color="#eb2f96" />
        </WidgetWrapper>
    );
};
export default StatExecTotal;
