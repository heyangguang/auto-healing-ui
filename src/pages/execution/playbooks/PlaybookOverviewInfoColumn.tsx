import React from 'react';
import { BranchesOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import PlaybookOverviewFieldGrid, { type PlaybookOverviewField } from './PlaybookOverviewFieldGrid';
import type { PlaybookStatusSummary } from './playbookTypes';

const { Text } = Typography;

type ProviderInfo = {
    icon: React.ReactNode;
    color: string;
    label: string;
};

type PlaybookOverviewInfoColumnProps = {
    getProviderInfo: (url: string) => ProviderInfo;
    playbook: AutoHealing.Playbook;
    repo?: AutoHealing.GitRepository;
    statusInfo: PlaybookStatusSummary;
};

function buildPlaybookOverviewFields(
    playbook: AutoHealing.Playbook,
    statusInfo: PlaybookStatusSummary,
): PlaybookOverviewField[] {
    return [
        { key: 'name', label: '名称', value: playbook.name },
        {
            key: 'status',
            label: '状态',
            value: (
                <Space size={[8, 8]} wrap className="pb-overview-status-tags">
                    <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    <Tag color={playbook.config_mode === 'enhanced' ? 'purple' : 'blue'}>
                        {playbook.config_mode === 'enhanced' ? '增强模式' : '自动模式'}
                    </Tag>
                </Space>
            ),
        },
        {
            key: 'filePath',
            label: '入口文件',
            value: <Text code copyable className="pb-overview-code-text">{playbook.file_path}</Text>,
            fullWidth: true,
        },
        {
            key: 'description',
            label: '描述',
            value: playbook.description || <Text type="secondary">-</Text>,
            fullWidth: true,
        },
        {
            key: 'createdAt',
            label: '创建时间',
            value: new Date(playbook.created_at).toLocaleString(),
        },
        {
            key: 'updatedAt',
            label: '更新时间',
            value: new Date(playbook.updated_at || playbook.created_at).toLocaleString(),
        },
        {
            key: 'scannedAt',
            label: '扫描时间',
            value: playbook.last_scanned_at ? new Date(playbook.last_scanned_at).toLocaleString() : <Text type="secondary">尚未扫描</Text>,
            fullWidth: true,
        },
    ];
}

function buildRepoOverviewFields(repo: AutoHealing.GitRepository): PlaybookOverviewField[] {
    return [
        { key: 'repoName', label: '仓库', value: repo.name },
        {
            key: 'defaultBranch',
            label: '分支',
            value: <Tag icon={<BranchesOutlined />}>{repo.default_branch}</Tag>,
        },
        {
            key: 'repoUrl',
            label: '地址',
            value: <Text copyable className="pb-overview-link-text">{repo.url}</Text>,
            fullWidth: true,
        },
    ];
}

export default function PlaybookOverviewInfoColumn(props: PlaybookOverviewInfoColumnProps) {
    const { getProviderInfo, playbook, repo, statusInfo } = props;
    const detailFields = buildPlaybookOverviewFields(playbook, statusInfo);
    const repoFields = repo ? buildRepoOverviewFields(repo) : [];

    return (
        <div className="pb-overview-info-column">
            <Card title="详细信息" size="small" className="pb-overview-section-card">
                <PlaybookOverviewFieldGrid fields={detailFields} />
            </Card>

            <Card
                size="small"
                className="pb-overview-section-card"
                title={repo ? (
                    <Space size={6}>
                        <span style={{ color: getProviderInfo(repo.url).color, display: 'flex', alignItems: 'center' }}>
                            {getProviderInfo(repo.url).icon}
                        </span>
                        关联仓库
                    </Space>
                ) : '关联仓库'}
            >
                {!repo ? (
                    <Text type="secondary">仓库信息不可用</Text>
                ) : (
                    <PlaybookOverviewFieldGrid fields={repoFields} />
                )}
            </Card>
        </div>
    );
}
