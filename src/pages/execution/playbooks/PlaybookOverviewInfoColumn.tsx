import React from 'react';
import { BranchesOutlined } from '@ant-design/icons';
import { Card, Descriptions, Space, Tag, Typography } from 'antd';
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

export default function PlaybookOverviewInfoColumn(props: PlaybookOverviewInfoColumnProps) {
    const { getProviderInfo, playbook, repo, statusInfo } = props;

    return (
        <>
            <Card title="详细信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small" labelStyle={{ width: 80, color: '#8c8c8c' }}>
                    <Descriptions.Item label="名称">{playbook.name}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                        <Space size={8}>
                            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                            <Tag color={playbook.config_mode === 'enhanced' ? 'purple' : 'blue'}>
                                {playbook.config_mode === 'enhanced' ? '增强模式' : '自动模式'}
                            </Tag>
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="入口文件" span={2}>
                        <Text code copyable style={{ fontSize: 12, wordBreak: 'break-all' }}>{playbook.file_path}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="描述" span={2}>
                        {playbook.description || <Text type="secondary">-</Text>}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">{new Date(playbook.created_at).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="更新时间">{new Date(playbook.updated_at || playbook.created_at).toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="扫描时间" span={2}>
                        {playbook.last_scanned_at ? new Date(playbook.last_scanned_at).toLocaleString() : <Text type="secondary">尚未扫描</Text>}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card
                size="small"
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
                    <Descriptions column={2} size="small" labelStyle={{ width: 80, color: '#8c8c8c' }}>
                        <Descriptions.Item label="仓库">{repo.name}</Descriptions.Item>
                        <Descriptions.Item label="分支">
                            <Tag icon={<BranchesOutlined />}>{repo.default_branch}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="地址" span={2}>
                            <Text copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>{repo.url}</Text>
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Card>
        </>
    );
}
