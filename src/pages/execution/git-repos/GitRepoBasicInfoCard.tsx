import React from 'react';
import { BranchesOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { GitRepositoryRecord } from '@/services/auto-healing/git-repos';

const { Text } = Typography;

type GitRepoBasicInfoCardProps = {
    auth: { icon: React.ReactNode; text: string };
    currentRow: GitRepositoryRecord;
};

export default function GitRepoBasicInfoCard(props: GitRepoBasicInfoCardProps) {
    const { auth, currentRow } = props;

    return (
        <div className="git-detail-card">
            <div className="git-detail-card-header">
                <InfoCircleOutlined className="git-detail-card-header-icon" />
                <span className="git-detail-card-header-title">基本信息</span>
            </div>
            <div className="git-detail-card-body">
                <div className="git-detail-grid">
                    <div className="git-detail-field" style={{ gridColumn: '1 / -1' }}>
                        <span className="git-detail-field-label">仓库地址</span>
                        <div className="git-detail-field-value">
                            <Text code copyable style={{ wordBreak: 'break-all', fontSize: 12 }}>{currentRow.url}</Text>
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">默认分支</span>
                        <div className="git-detail-field-value">
                            <Tag icon={<BranchesOutlined />}>{currentRow.default_branch || 'main'}</Tag>
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">认证方式</span>
                        <div className="git-detail-field-value">
                            <Space size={4}>{auth.icon}<span>{auth.text}</span></Space>
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">当前 Commit</span>
                        <div className="git-detail-field-value">
                            {currentRow.last_commit_id
                                ? <Text code copyable={{ text: currentRow.last_commit_id }} style={{ fontSize: 11 }}>{currentRow.last_commit_id}</Text>
                                : '-'}
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">本地路径</span>
                        <div className="git-detail-field-value">
                            <Text code style={{ fontSize: 11 }}>{currentRow.local_path || '-'}</Text>
                        </div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">创建时间</span>
                        <div className="git-detail-field-value">{dayjs(currentRow.created_at).format('YYYY-MM-DD HH:mm')}</div>
                    </div>
                    <div className="git-detail-field">
                        <span className="git-detail-field-label">更新时间</span>
                        <div className="git-detail-field-value">{currentRow.updated_at ? dayjs(currentRow.updated_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                    </div>
                    {currentRow.error_message && (
                        <div className="git-detail-field" style={{ gridColumn: '1 / -1' }}>
                            <span className="git-detail-field-label">错误信息</span>
                            <div className="git-detail-field-value" style={{ color: '#ff4d4f' }}>{currentRow.error_message}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
