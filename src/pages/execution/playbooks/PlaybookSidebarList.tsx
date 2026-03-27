import React from 'react';
import { Badge, Card, Empty, Spin } from 'antd';
import { CodeOutlined, DownOutlined, FolderOpenOutlined, RightOutlined } from '@ant-design/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PlaybookStatusSummary } from './playbookTypes';
import { playbookStatusConfig } from './playbookShellConfig';

type PlaybookSidebarListProps = {
    expandedKeys: React.Key[];
    flattenedList: Array<{ type: 'repo' | 'playbook'; repoId: string; repo?: AutoHealing.GitRepository | null; playbook?: AutoHealing.Playbook }>;
    groupedPlaybooks: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }>;
    initialized: boolean;
    parentRef: React.RefObject<HTMLDivElement | null>;
    selectedPlaybook?: AutoHealing.Playbook;
    virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
    onSelectPlaybook: (playbook: AutoHealing.Playbook) => void;
    onToggleRepo: (repoId: string) => void;
};

const statusConfig = playbookStatusConfig;

function PlaybookRepoRow(props: {
    group: { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] };
    isExpanded: boolean;
    repoId: string;
    style: React.CSSProperties;
    onToggleRepo: (repoId: string) => void;
}) {
    const { group, isExpanded, repoId, style, onToggleRepo } = props;
    return (
        <div style={style}>
            <div style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#595959', fontSize: 13, fontWeight: 500, backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0', height: '100%', boxSizing: 'border-box' }} onClick={() => onToggleRepo(repoId)}>
                {isExpanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
                <FolderOpenOutlined style={{ fontSize: 14 }} />
                <span style={{ flex: 1 }}>{group.repo?.name || '未知仓库'}</span>
                <Badge count={group.playbooks.length} size="small" style={{ backgroundColor: '#1890ff' }} />
            </div>
        </div>
    );
}

function PlaybookItemRow(props: {
    playbook: AutoHealing.Playbook;
    selectedPlaybook?: AutoHealing.Playbook;
    style: React.CSSProperties;
    onSelectPlaybook: (playbook: AutoHealing.Playbook) => void;
}) {
    const { playbook, selectedPlaybook, style, onSelectPlaybook } = props;
    const status = (statusConfig[playbook.status] || statusConfig.pending) as PlaybookStatusSummary;
    const isSelected = selectedPlaybook?.id === playbook.id;
    return (
        <div style={style}>
            <div onClick={() => onSelectPlaybook(playbook)} style={{ padding: '12px 16px 12px 36px', cursor: 'pointer', backgroundColor: isSelected ? '#e6f7ff' : 'transparent', borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent', display: 'flex', alignItems: 'center', gap: 10, height: '100%', boxSizing: 'border-box' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} title={status.text} />
                <CodeOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playbook.name}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{playbook.file_path}</div>
                </div>
            </div>
        </div>
    );
}

export default function PlaybookSidebarList(props: PlaybookSidebarListProps) {
    const { expandedKeys, flattenedList, groupedPlaybooks, initialized, parentRef, selectedPlaybook, virtualizer, onSelectPlaybook, onToggleRepo } = props;

    return (
        <Card styles={{ body: { padding: 0 } }} style={{ height: '100%' }}>
            <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                <div ref={parentRef} style={{ flex: 1, overflowY: 'auto' }}>
                    {!initialized ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Spin /></div>
                        : flattenedList.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Playbook" style={{ marginTop: 40 }} />
                            : <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                                {virtualizer.getVirtualItems().map((virtualRow) => {
                                    const item = flattenedList[virtualRow.index];
                                    const style = { position: 'absolute', top: 0, left: 0, width: '100%', height: virtualRow.size, transform: `translateY(${virtualRow.start}px)` } as React.CSSProperties;
                                    if (item.type === 'repo') {
                                        return <PlaybookRepoRow key={virtualRow.key} group={groupedPlaybooks[item.repoId]} isExpanded={expandedKeys.includes(item.repoId)} repoId={item.repoId} style={style} onToggleRepo={onToggleRepo} />;
                                    }
                                    return <PlaybookItemRow key={virtualRow.key} playbook={item.playbook!} selectedPlaybook={selectedPlaybook} style={style} onSelectPlaybook={onSelectPlaybook} />;
                                })}
                            </div>}
                </div>
            </div>
        </Card>
    );
}
