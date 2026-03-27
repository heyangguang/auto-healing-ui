import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PlaybookSidebarCollapsed from './PlaybookSidebarCollapsed';
import PlaybookSidebarList from './PlaybookSidebarList';

type PlaybookSidebarProps = {
    activeTab: string;
    expandedKeys: React.Key[];
    groupedPlaybooks: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }>;
    initialized: boolean;
    onSelectPlaybook: (playbook: AutoHealing.Playbook) => void;
    onSetActiveTab: (key: string) => void;
    onToggleRepo: (repoId: string) => void;
    selectedPlaybook?: AutoHealing.Playbook;
};
export default function PlaybookSidebar(props: PlaybookSidebarProps) {
    const { activeTab, expandedKeys, groupedPlaybooks, initialized, onSelectPlaybook, onSetActiveTab, onToggleRepo, selectedPlaybook } = props;
    const parentRef = useRef<HTMLDivElement>(null);

    const flattenedList = useMemo(() => {
        const items: Array<{ type: 'repo' | 'playbook'; repoId: string; repo?: AutoHealing.GitRepository | null; playbook?: AutoHealing.Playbook }> = [];
        Object.entries(groupedPlaybooks).forEach(([repoId, group]) => {
            items.push({ type: 'repo', repoId, repo: group.repo });
            if (expandedKeys.includes(repoId)) {
                group.playbooks.forEach((playbook) => {
                    items.push({ type: 'playbook', repoId, playbook });
                });
            }
        });
        return items;
    }, [expandedKeys, groupedPlaybooks]);

    const virtualizer = useVirtualizer({
        count: flattenedList.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => flattenedList[index]?.type === 'repo' ? 42 : 58,
        overscan: 5,
    });

    if (activeTab === 'variables' || activeTab === 'files') {
        return <PlaybookSidebarCollapsed onSetActiveTab={onSetActiveTab} selectedPlaybook={selectedPlaybook} />;
    }

    return (
        <PlaybookSidebarList expandedKeys={expandedKeys} flattenedList={flattenedList} groupedPlaybooks={groupedPlaybooks} initialized={initialized} parentRef={parentRef} selectedPlaybook={selectedPlaybook} virtualizer={virtualizer} onSelectPlaybook={onSelectPlaybook} onToggleRepo={onToggleRepo} />
    );
}
