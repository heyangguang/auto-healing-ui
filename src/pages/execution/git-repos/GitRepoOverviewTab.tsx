import React from 'react';
import type { GitCommitRecord, GitRepositoryRecord } from '@/services/auto-healing/git-repos';
import GitRepoBasicInfoCard from './GitRepoBasicInfoCard';
import GitRepoCommitsCard from './GitRepoCommitsCard';
import GitRepoPlaybooksCard from './GitRepoPlaybooksCard';
import GitRepoSyncConfigCard from './GitRepoSyncConfigCard';

type GitRepoOverviewTabProps = {
    auth: { icon: React.ReactNode; text: string };
    commits: GitCommitRecord[];
    currentRow: GitRepositoryRecord;
    drawerPlaybooks: AutoHealing.Playbook[];
    loadingCommits: boolean;
    onOpenPlaybooks: () => void;
};

export default function GitRepoOverviewTab(props: GitRepoOverviewTabProps) {
    const { auth, commits, currentRow, drawerPlaybooks, loadingCommits, onOpenPlaybooks } = props;

    return (
        <div className="git-detail-body">
            <GitRepoBasicInfoCard auth={auth} currentRow={currentRow} />
            <GitRepoSyncConfigCard currentRow={currentRow} />
            <GitRepoCommitsCard commits={commits} loadingCommits={loadingCommits} />
            <GitRepoPlaybooksCard drawerPlaybooks={drawerPlaybooks} onOpenPlaybooks={onOpenPlaybooks} />
        </div>
    );
}
