import React, { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Typography, Empty, Tag, Space, Badge, Spin } from 'antd';
import {
    ProjectOutlined, SearchOutlined, CheckCircleFilled,
    FileTextOutlined, ApartmentOutlined, GlobalOutlined, RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getCachedGitRepoInventory } from '@/utils/selectorInventoryCache';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface PlaybookSelectorProps {
    value?: string;
    onChange?: (value: string) => void;
    playbooks: AutoHealing.Playbook[];
}

const PlaybookSelector: React.FC<PlaybookSelectorProps> = ({ value, onChange, playbooks = [] }) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [repoSearchText, setRepoSearchText] = useState('');
    const [selectedRepoId, setSelectedRepoId] = useState('all');

    // 仓库映射
    const [reposMap, setReposMap] = useState<Record<string, string>>({});
    const [loadingRepos, setLoadingRepos] = useState(false);

    // 加载仓库信息
    useEffect(() => {
        if (open) {
            setLoadingRepos(true);
            getCachedGitRepoInventory().then(items => {
                const map: Record<string, string> = {};
                items.forEach((r: any) => {
                    map[r.id] = r.name;
                });
                setReposMap(map);
            }).catch(() => {
                // keep selector usable even when repo inventory lookup fails
            }).finally(() => setLoadingRepos(false));
        }
    }, [open]);

    const selectedPlaybook = useMemo(() => playbooks.find(p => p.id === value), [value, playbooks]);

    // 按仓库分组统计
    const repoStats = useMemo(() => {
        const stats: Record<string, number> = { all: playbooks.length };
        const repoIds = new Set<string>();

        playbooks.forEach(p => {
            const rid = p.repository_id || 'unknown';
            stats[rid] = (stats[rid] || 0) + 1;
            repoIds.add(rid);
        });

        // 排序：有名字的在前，未知在后
        const sortedIds = Array.from(repoIds).sort((a, b) => {
            const na = reposMap[a] || 'zzz';
            const nb = reposMap[b] || 'zzz';
            return na.localeCompare(nb);
        });

        return { stats, repoIds: sortedIds };
    }, [playbooks, reposMap]);

    // 过滤列表
    const filteredPlaybooks = useMemo(() => {
        let list = playbooks;

        // 仓库过滤
        if (selectedRepoId !== 'all') {
            list = list.filter(p => (p.repository_id || 'unknown') === selectedRepoId);
        }

        // 搜索过滤
        if (searchText) {
            const lower = searchText.trim().toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.description && p.description.toLowerCase().includes(lower))
            );
        }
        return list;
    }, [playbooks, searchText, selectedRepoId]);

    // 侧边栏搜索过滤
    const filteredRepoIds = useMemo(() => {
        return repoStats.repoIds.filter(rid => {
            if (!repoSearchText) return true;
            const name = reposMap[rid] || '未知仓库';
            return name.toLowerCase().includes(repoSearchText.toLowerCase());
        });
    }, [repoStats, reposMap, repoSearchText]);

    return (
        <>
            {/* Trigger 按钮 */}
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
                    borderRadius: 0
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

            {/* Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ProjectOutlined style={{ color: '#1890ff' }} />
                        <span>选择 Playbook</span>
                    </div>
                }
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                width={1000}
                styles={{ body: { padding: 0, height: 600, display: 'flex' } }}
                destroyOnHidden
            >
                {/* Left Sidebar - New Design: Unified White + Custom List */}
                <div style={{
                    width: 250,
                    borderRight: '1px solid #f0f0f0',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff'
                }}>
                    <div style={{ padding: '16px 16px 8px' }}>
                        <Input
                            prefix={<SearchOutlined style={{ color: '#c4c6cc' }} />}
                            placeholder="搜索仓库"
                            value={repoSearchText}
                            onChange={(e) => setRepoSearchText(e.target.value)}
                            bordered={false}
                            style={{
                                background: '#f5f5f5',
                                padding: '6px 12px',
                                borderRadius: 4 // 轻微圆角适配输入框，整体风格仍为直角
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                        <Spin spinning={loadingRepos} size="small">
                            {/* "全部" 选项 */}
                            <div
                                onClick={() => setSelectedRepoId('all')}
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
                                    fontWeight: selectedRepoId === 'all' ? 500 : 400
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <GlobalOutlined />
                                    <span>全部仓库</span>
                                </div>
                                <span style={{ color: '#999', fontSize: 12 }}>{repoStats.stats.all}</span>
                            </div>

                            <div style={{ height: 1, background: '#f0f0f0', margin: '8px 16px' }} />

                            {/* 仓库列表 */}
                            {filteredRepoIds.map(rid => {
                                const isSelected = selectedRepoId === rid;
                                return (
                                    <div
                                        key={rid}
                                        onClick={() => setSelectedRepoId(rid)}
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
                                            fontWeight: isSelected ? 500 : 400
                                        }}
                                        className="playbook-repo-item"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                            <ApartmentOutlined style={{ flexShrink: 0 }} />
                                            <span style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
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

                {/* Right Content - Unified White Background */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0' }}>
                        <Input
                            placeholder="搜索 Playbook 名称、描述..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                            bordered={false}
                            style={{ padding: 0, boxShadow: 'none' }}
                        />
                    </div>

                    {/* List Area */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', background: '#fff' }}>
                        <Spin spinning={loadingRepos}>
                            {filteredPlaybooks.length > 0 ? (
                                <Space orientation="vertical" style={{ width: '100%' }} size={12}>
                                    {filteredPlaybooks.map(record => {
                                        const isSelected = value === record.id;
                                        return (
                                            <div
                                                key={record.id}
                                                onClick={() => {
                                                    onChange?.(record.id);
                                                    setOpen(false);
                                                }}
                                                style={{
                                                    border: isSelected ? '1px solid #1890ff' : '1px dashed #d9d9d9',
                                                    background: isSelected ? '#f0f9ff' : '#fff',
                                                    padding: '16px 20px',
                                                    cursor: 'pointer',
                                                    borderRadius: 2, // Keep generic "sharp" feel but allow tiny radius for polish
                                                    transition: 'all 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#1890ff';
                                                        e.currentTarget.style.background = '#fafafa';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#d9d9d9';
                                                        e.currentTarget.style.background = '#fff';
                                                    }
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                                        <FileTextOutlined style={{ marginRight: 8, color: '#595959', fontSize: 16 }} />
                                                        <span style={{ fontWeight: 600, color: '#262626', fontSize: 15 }}>{record.name}</span>
                                                        {record.variables && record.variables.length > 0 && (
                                                            <Tag style={{ marginLeft: 12, border: 'none', background: '#f5f5f5', color: '#595959', fontSize: 12 }}>
                                                                {record.variables.length} vars
                                                            </Tag>
                                                        )}
                                                    </div>
                                                    <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 8, paddingLeft: 24 }}>
                                                        {record.description || '暂无描述'}
                                                    </div>
                                                    <Space size={16} style={{ fontSize: 12, color: '#bfbfbf', paddingLeft: 24 }}>
                                                        <span>ID: {record.id.slice(0, 8)}</span>
                                                        <span>Repo: {reposMap[record.repository_id || ''] || 'Unknown'}</span>
                                                    </Space>
                                                </div>

                                                {isSelected && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        right: 20,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)'
                                                    }}>
                                                        <CheckCircleFilled style={{ color: '#1890ff', fontSize: 20 }} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </Space>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未找到匹配项" style={{ marginTop: 80 }} />
                            )}
                        </Spin>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PlaybookSelector;
