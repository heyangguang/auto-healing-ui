import { ForkOutlined } from '@ant-design/icons';
import { Badge, Typography, Empty, Button } from 'antd';
import { useRequest } from '@umijs/max';
import dayjs from 'dayjs';
import React from 'react';
import { request, history } from '@umijs/max';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';

async function getGitRepos() {
    return request('/api/v1/tenant/git-repos', {
        method: 'GET',
        params: { page_size: 20 },
    });
}

const StatusGitRepos: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(getGitRepos);
    const data = rawData as any;
    let items: any[] = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (Array.isArray(data?.data)) {
        items = data.data;
    } else if (Array.isArray(data?.items)) {
        items = data.items;
    } else if (Array.isArray(data?.data?.items)) {
        items = data.data.items;
    }

    return (
        <WidgetWrapper title="Git 仓库状态" icon={<ForkOutlined />} loading={loading} onRefresh={refresh} noPadding isEditing={isEditing} onRemove={onRemove}>
            {(!items || items.length === 0) ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无数据"
                    >
                        <Button type="primary" size="small" onClick={() => history.push('/execution/git-repos')}>去配置</Button>
                    </Empty>
                </div>
            ) : (
                <div style={{ height: '100%', overflowY: 'auto' }}>
                    {items.map((item: any, index: number) => (
                        <div key={item.id || index} style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <Badge status={item.status === 'error' ? 'error' : (item.sync_enabled ? 'processing' : 'default')} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                        <Typography.Text ellipsis strong style={{ fontSize: 13, color: '#262626' }}>
                                            {item.name}
                                        </Typography.Text>
                                        <Typography.Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                            {item.last_synced_at ? dayjs(item.last_synced_at).fromNow() : '未同步'}
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
