import { ForkOutlined } from '@ant-design/icons';
import { Badge, Typography, Empty, Button } from 'antd';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import { history } from '@umijs/max';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

dayjs.extend(relativeTime);

function resolveRepoBadgeStatus(status?: string) {
    if (status === 'error') {
        return 'error';
    }
    if (status === 'ready' || status === 'active') {
        return 'success';
    }
    if (status === 'syncing') {
        return 'processing';
    }
    return 'default';
}

const StatusGitRepos: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const access = useAccess();
    const { data, loading, refresh } = useDashboardSection('git');
    const items = Array.isArray(data?.repos) ? data.repos : [];

    return (
        <WidgetWrapper title="Git 仓库状态" icon={<ForkOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            {(!items || items.length === 0) ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无数据"
                    >
                        <Button type="primary" size="small" disabled={!access.canViewRepositories} onClick={() => history.push('/execution/git-repos')}>去配置</Button>
                    </Empty>
                </div>
            ) : (
                <div style={{ height: '100%', overflowY: 'auto' }}>
                    {items.map((item: any, index: number) => (
                        <div key={item.id || index} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <Badge status={resolveRepoBadgeStatus(item.status) as any} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                        <Typography.Text ellipsis strong style={{ fontSize: 13, color: '#262626' }}>
                                            {item.name}
                                        </Typography.Text>
                                        <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                            {item.last_sync_at ? dayjs(item.last_sync_at).fromNow() : '未同步'}
                                        </Typography.Text>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                            {item.branch || item.default_branch || 'HEAD'}
                                        </Typography.Text>
                                        <div style={{ height: 8, width: 1, background: '#f0f0f0' }} />
                                        <Typography.Text type={item.status === 'ready' ? 'success' : item.status === 'error' ? 'danger' : 'secondary'} style={{ fontSize: 11 }}>
                                            {item.status || 'unknown'}
                                        </Typography.Text>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </WidgetWrapper>
    );
};
export default StatusGitRepos;
