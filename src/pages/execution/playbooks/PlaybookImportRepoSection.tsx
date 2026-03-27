import React from 'react';
import {
    AppstoreOutlined,
    BranchesOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    DatabaseOutlined,
    GlobalOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Button, Col, Empty, Row, Select, Space, Spin, Tag, Typography } from 'antd';
import { history } from '@umijs/max';
import { getProviderInfo } from './playbookProviderInfo';

const { Text, Title } = Typography;

type PlaybookImportRepoSectionProps = {
    access: { canCreateGitRepo?: boolean };
    creating: boolean;
    loadingRepos: boolean;
    loadError?: string;
    repos: AutoHealing.GitRepository[];
    repoMap: Map<string, AutoHealing.GitRepository>;
    selectedRepo?: AutoHealing.GitRepository;
    selectedRepoId?: string;
    onSelectRepo: (repoId: string) => void;
};

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    ready: { color: '#52c41a', text: '就绪', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
    syncing: { color: '#1890ff', text: '同步中', icon: <SyncOutlined spin style={{ color: '#1890ff' }} /> },
    pending: { color: '#faad14', text: '待同步', icon: <ClockCircleOutlined style={{ color: '#faad14' }} /> },
    error: { color: '#ff4d4f', text: '异常', icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> },
};

export default function PlaybookImportRepoSection(props: PlaybookImportRepoSectionProps) {
    const { access, creating, loadError, loadingRepos, repos, repoMap, selectedRepo, selectedRepoId, onSelectRepo } = props;

    return (
        <>
            <Title level={5} style={{ marginBottom: 16, color: '#595959' }}>
                <DatabaseOutlined style={{ marginRight: 8 }} />选择 Git 仓库
            </Title>

            {loadingRepos ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}><Spin tip="加载仓库列表..."><div /></Spin></div>
            ) : loadError ? (
                <Alert type="error" showIcon message="仓库列表加载失败" description={loadError} />
            ) : repos.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Git 仓库">
                    <Button type="primary" disabled={!access.canCreateGitRepo} onClick={() => history.push('/execution/git-repos/create')}>
                        前往添加仓库
                    </Button>
                </Empty>
            ) : (
                <Row gutter={16}>
                    <Col span={10}>
                        <Select
                            placeholder="选择 Git 仓库..."
                            value={selectedRepoId}
                            onChange={onSelectRepo}
                            style={{ width: '100%' }}
                            showSearch
                            disabled={creating}
                            optionFilterProp="label"
                            options={repos.map((repo) => ({ value: repo.id, label: repo.name }))}
                            optionRender={(option) => {
                                const repo = repoMap.get(option.value as string);
                                if (!repo) return option.label;
                                const status = statusConfig[repo.status] || statusConfig.pending;
                                const provider = getProviderInfo(repo.url);
                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                                        <span style={{ fontSize: 18, color: provider.color, flexShrink: 0, display: 'flex', alignItems: 'center' }}>{provider.icon}</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {repo.name}
                                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: 11, color: status.color, fontWeight: 400 }}>{status.text}</span>
                                            </div>
                                            <div style={{ fontSize: 11, color: '#8c8c8c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.url}</div>
                                        </div>
                                        <Tag style={{ margin: 0, fontSize: 11 }}>{repo.default_branch}</Tag>
                                    </div>
                                );
                            }}
                        />
                    </Col>
                    <Col>
                        {selectedRepo && (
                            <Space size={12}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <GlobalOutlined style={{ marginRight: 4 }} />
                                    {selectedRepo.url}
                                </Text>
                                <Tag icon={<BranchesOutlined />}>{selectedRepo.default_branch}</Tag>
                            </Space>
                        )}
                    </Col>
                </Row>
            )}
        </>
    );
}
