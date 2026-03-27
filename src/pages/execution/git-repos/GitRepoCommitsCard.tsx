import React from 'react';
import { Empty, Spin } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { GitCommitRecord } from '@/services/auto-healing/git-repos';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type GitRepoCommitsCardProps = {
    commits: GitCommitRecord[];
    loadingCommits: boolean;
};

export default function GitRepoCommitsCard(props: GitRepoCommitsCardProps) {
    const { commits, loadingCommits } = props;

    return (
        <div className="git-detail-card">
            <div className="git-detail-card-header">
                <HistoryOutlined className="git-detail-card-header-icon" />
                <span className="git-detail-card-header-title">最近提交</span>
                {commits.length > 0 && <span className="git-detail-card-header-count">{commits.length} 条</span>}
            </div>
            <div className="git-detail-card-body">
                {loadingCommits ? (
                    <div style={{ textAlign: 'center', padding: 16 }}><Spin size="small" /></div>
                ) : commits.length > 0 ? (
                    <div className="git-timeline">
                        {commits.map((commit) => (
                            <div key={commit.full_id} className="git-timeline-item">
                                <div className="git-timeline-dot" />
                                <div>
                                    <span className="git-timeline-commit-hash">{commit.commit_id}</span>
                                    <span className="git-timeline-message">{commit.message}</span>
                                </div>
                                <div className="git-timeline-meta">{commit.author} · {dayjs(commit.date).fromNow()}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无提交记录" />
                )}
            </div>
        </div>
    );
}
