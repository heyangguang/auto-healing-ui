import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Typography, Space } from 'antd';
import { ProjectOutlined, SearchOutlined } from '@ant-design/icons';
import { getCachedGitRepoInventory } from '@/utils/selectorInventoryCache';
import PlaybookList from './PlaybookList';
import RepoSidebar from './RepoSidebar';

const { Text } = Typography;

interface PlaybookSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
    playbooks: AutoHealing.Playbook[];
}

interface RepoInventoryItem {
    id: string;
    name: string;
}

const isRepoInventoryItem = (item: unknown): item is RepoInventoryItem => {
    return typeof item === 'object' && item !== null
        && typeof (item as { id?: unknown }).id === 'string'
        && typeof (item as { name?: unknown }).name === 'string';
};

const PlaybookSelector: React.FC<PlaybookSelectorProps> = ({ value, onChange, playbooks = [] }) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [repoSearchText, setRepoSearchText] = useState('');
    const [selectedRepoId, setSelectedRepoId] = useState('all');
    const [reposMap, setReposMap] = useState<Record<string, string>>({});
    const [loadingRepos, setLoadingRepos] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoadingRepos(true);
        getCachedGitRepoInventory()
            .then((items) => {
                const map: Record<string, string> = {};
                for (const item of items) {
                    if (isRepoInventoryItem(item)) {
                        map[item.id] = item.name;
                    }
                }
                setReposMap(map);
            })
            .catch(() => {
                // keep selector usable even when repo inventory lookup fails
            })
            .finally(() => setLoadingRepos(false));
    }, [open]);

    const selectedPlaybook = useMemo(() => {
        return playbooks.find((p) => p.id === value);
    }, [value, playbooks]);

    const repoStats = useMemo(() => {
        const stats: Record<string, number> = { all: playbooks.length };
        const repoIds = new Set<string>();
        for (const playbook of playbooks) {
            const rid = playbook.repository_id || 'unknown';
            stats[rid] = (stats[rid] || 0) + 1;
            repoIds.add(rid);
        }
        const sortedIds = Array.from(repoIds).sort((a, b) => {
            const nameA = reposMap[a] || 'zzz';
            const nameB = reposMap[b] || 'zzz';
            return nameA.localeCompare(nameB);
        });
        return { stats, repoIds: sortedIds };
    }, [playbooks, reposMap]);

    const filteredPlaybooks = useMemo(() => {
        let list = playbooks;
        if (selectedRepoId !== 'all') {
            list = list.filter((p) => (p.repository_id || 'unknown') === selectedRepoId);
        }
        if (searchText) {
            const lower = searchText.trim().toLowerCase();
            list = list.filter((p) => p.name.toLowerCase().includes(lower)
                || (p.description?.toLowerCase().includes(lower)));
        }
        return list;
    }, [playbooks, searchText, selectedRepoId]);

    const filteredRepoIds = useMemo(() => {
        return repoStats.repoIds.filter((rid) => {
            if (!repoSearchText) return true;
            const name = reposMap[rid] || '未知仓库';
            return name.toLowerCase().includes(repoSearchText.toLowerCase());
        });
    }, [repoStats, reposMap, repoSearchText]);

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                style={{
                    border: '1px solid #d9d9d9',
                    background: '#fff',
                    height: 40,
                    padding: '0 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.3s',
                    position: 'relative',
                    borderRadius: 0,
                }}
                className="hover:border-blue-500"
            >
                {selectedPlaybook ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <ProjectOutlined style={{ color: '#1890ff', fontSize: 14, marginRight: 8 }} />
                        <span style={{ fontWeight: 500, color: '#262626', marginRight: 8, fontSize: 14 }}>{selectedPlaybook.name}</span>
                        <Text type="secondary" style={{ fontSize: 12, flex: 1 }} ellipsis>
                            {selectedPlaybook.description}
                        </Text>
                    </div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#bfbfbf', fontSize: 14 }}>
                        <span>点击选择 Playbook...</span>
                        <Space style={{ marginLeft: 'auto' }}>
                            <SearchOutlined />
                        </Space>
                    </div>
                )}
            </div>

            <Modal
                title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ProjectOutlined style={{ color: '#1890ff' }} /><span>选择 Playbook</span></div>}
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={1000}
                styles={{ body: { padding: 0, height: 600, display: 'flex' } }}
                destroyOnHidden
            >
                <RepoSidebar
                    loadingRepos={loadingRepos}
                    repoSearchText={repoSearchText}
                    selectedRepoId={selectedRepoId}
                    filteredRepoIds={filteredRepoIds}
                    reposMap={reposMap}
                    repoStats={repoStats}
                    onSearchChange={setRepoSearchText}
                    onSelectRepo={setSelectedRepoId}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                        <Input
                            placeholder="搜索 Playbook 名称、描述..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                            bordered={false}
                            style={{ padding: 0, boxShadow: 'none' }}
                        />
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#fff' }}>
                        <PlaybookList
                            loadingRepos={loadingRepos}
                            filteredPlaybooks={filteredPlaybooks}
                            value={value}
                            reposMap={reposMap}
                            onSelect={(id) => {
                                onChange?.(id);
                                setOpen(false);
                            }}
                        />
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PlaybookSelector;
