import { FileTextOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPlaybooks: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('playbooks');
    return (
        <WidgetWrapper title="Playbook 总数" icon={<FileTextOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.total ?? 0} suffix="个" description={`就绪 ${data?.ready ?? 0}`} color="#13c2c2" />
        </WidgetWrapper>
    );
};
export default StatPlaybooks;
