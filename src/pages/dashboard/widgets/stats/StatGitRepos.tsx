import { BranchesOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatGitRepos: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('git');
    return (
        <WidgetWrapper title="Git 仓库" icon={<BranchesOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.repos_total ?? 0} suffix="个" description={`同步率 ${Number(data?.sync_success_rate ?? 0).toFixed(0)}%`} color="#722ed1" />
        </WidgetWrapper>
    );
};
export default StatGitRepos;
