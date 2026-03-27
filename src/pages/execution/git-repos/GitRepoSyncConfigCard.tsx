import React from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import type { GitRepositoryRecord } from '@/services/auto-healing/git-repos';

export default function GitRepoSyncConfigCard({ currentRow }: { currentRow: GitRepositoryRecord }) {
    return (
        <div className="git-detail-card">
            <div className="git-detail-card-header">
                <SyncOutlined className="git-detail-card-header-icon" />
                <span className="git-detail-card-header-title">同步配置</span>
            </div>
            <div className="git-detail-card-body">
                <div className="git-detail-grid">
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">定时同步</span>
                        <div className="git-detail-field-value">
                            {currentRow.sync_enabled ? <Tag color="blue" icon={<SyncOutlined />}>每 {currentRow.sync_interval}</Tag> : <Tag>未开启</Tag>}
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">上次同步</span>
                        <div className="git-detail-field-value">{currentRow.last_sync_at ? dayjs(currentRow.last_sync_at).format('YYYY-MM-DD HH:mm') : '暂无'}</div>
                    </div>
                    {currentRow.next_sync_at && currentRow.sync_enabled && (
                        <div className="git-detail-field">
                            <span className="git-detail-field-label">下次同步</span>
                            <div className="git-detail-field-value" style={{ color: '#1890ff' }}>{dayjs(currentRow.next_sync_at).format('YYYY-MM-DD HH:mm')}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
