import React from 'react';
import { ApartmentOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';

interface RepoSidebarProps {
    loadingRepos: boolean;
    repoSearchText: string;
    selectedRepoId: string;
    filteredRepoIds: string[];
    reposMap: Record<string, string>;
    repoStats: {
        stats: Record<string, number>;
    };
    onSearchChange: (value: string) => void;
    onSelectRepo: (repoId: string) => void;
}

const RepoSidebar: React.FC<RepoSidebarProps> = ({
    loadingRepos,
    repoSearchText,
    selectedRepoId,
    filteredRepoIds,
    reposMap,
    repoStats,
    onSearchChange,
    onSelectRepo,
}) => {
    return (
        <div style={{
            width: 250,
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
        }}>
            <div style={{ padding: '16px 16px 8px' }}>
                <Input
                    prefix={<SearchOutlined style={{ color: '#c4c6cc' }} />}
                    placeholder="搜索仓库"
                    value={repoSearchText}
                    onChange={(e) => onSearchChange(e.target.value)}
                    bordered={false}
                    style={{ background: '#f5f5f5', padding: '6px 12px', borderRadius: 4 }}
                />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                <Spin spinning={loadingRepos} size="small">
                    <div
                        onClick={() => onSelectRepo('all')}
                        style={{
                            padding: '10px 24px',
                            cursor: 'pointer',
                            background: selectedRepoId === 'all' ? '#e6f7ff' : 'transparent',
                            color: selectedRepoId === 'all' ? '#1890ff' : '#262626',
                            borderRight: selectedRepoId === 'all' ? '3px solid #1890ff' : '3px solid transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s',
                            fontSize: 14,
                            fontWeight: selectedRepoId === 'all' ? 500 : 400,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <GlobalOutlined />
                            <span>全部仓库</span>
                        </div>
                        <span style={{ color: '#999', fontSize: 12 }}>{repoStats.stats.all}</span>
                    </div>
                    <div style={{ height: 1, background: '#f0f0f0', margin: '8px 16px' }} />
                    {filteredRepoIds.map((rid) => {
                        const isSelected = selectedRepoId === rid;
                        return (
                            <div
                                key={rid}
                                onClick={() => onSelectRepo(rid)}
                                style={{
                                    padding: '10px 24px',
                                    cursor: 'pointer',
                                    background: isSelected ? '#e6f7ff' : 'transparent',
                                    color: isSelected ? '#1890ff' : '#262626',
                                    borderRight: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    transition: 'all 0.2s',
                                    fontSize: 14,
                                    fontWeight: isSelected ? 500 : 400,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                    <ApartmentOutlined style={{ flexShrink: 0 }} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {reposMap[rid] || '未知仓库'}
                                    </span>
                                </div>
                                <span style={{ color: '#999', fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
                                    {repoStats.stats[rid] || 0}
                                </span>
                            </div>
                        );
                    })}
                </Spin>
            </div>
        </div>
    );
};

export default RepoSidebar;
