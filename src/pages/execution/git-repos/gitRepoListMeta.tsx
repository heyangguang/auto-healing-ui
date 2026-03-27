import React from 'react';
import {
    BranchesOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    FileOutlined,
    FolderOutlined,
    GithubOutlined,
    GitlabOutlined,
    GlobalOutlined,
    KeyOutlined,
    LockOutlined,
    SafetyCertificateOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Space } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import type { GitRepoFileNode } from '@/services/auto-healing/git-repos';

export type GitRepoStatusMeta = {
    text: string;
    color: string;
    icon: React.ReactNode;
    badge: 'success' | 'default' | 'error' | 'processing';
};

export type ProviderInfo = {
    icon: React.ReactNode;
    color: string;
    bg: string;
    label: string;
};

export type GitRepoStats = {
    total: number;
    ready: number;
    syncing: number;
    pending: number;
    error: number;
};

export type GitRepoTableAccess = {
    canSyncRepo?: boolean;
    canUpdateGitRepo?: boolean;
    canDeleteRepo?: boolean;
};

export type GitReposAdvancedSearch = {
    created_at?: [string | undefined, string | undefined];
    name?: string;
    url?: string;
    status?: string;
    auth_type?: string;
};

export type GitReposRequestParams = {
    page: number;
    pageSize: number;
    searchField?: string;
    searchValue?: string;
    advancedSearch?: GitReposAdvancedSearch;
    sorter?: { field: string; order: 'ascend' | 'descend' };
};

export type GitReposQueryParams = {
    page: number;
    page_size: number;
    name?: string;
    url?: string;
    status?: string;
    auth_type?: string;
    created_from?: string;
    created_to?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export const statusConfig: Record<string, GitRepoStatusMeta> = {
    pending: { text: '待同步', color: 'default', icon: <ClockCircleOutlined />, badge: 'default' },
    ready: { text: '就绪', color: 'success', icon: <CheckCircleOutlined />, badge: 'success' },
    syncing: { text: '同步中', color: 'processing', icon: <SyncOutlined spin />, badge: 'processing' },
    error: { text: '错误', color: 'error', icon: <CloseCircleOutlined />, badge: 'error' },
};

export const authLabels: Record<string, { icon: React.ReactNode; text: string }> = {
    none: { icon: <GlobalOutlined />, text: '公开' },
    token: { icon: <KeyOutlined />, text: 'Token' },
    password: { icon: <LockOutlined />, text: '密码' },
    ssh_key: { icon: <SafetyCertificateOutlined />, text: 'SSH' },
};

export const searchFields: SearchField[] = [
    { key: 'name', label: '名称' },
    { key: 'url', label: '仓库地址' },
];

export const advancedSearchFields: AdvancedSearchField[] = [
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export const headerIcon = (
    <svg role="img" viewBox="0 0 48 48" fill="none">
        <title>Git 仓库摘要</title>
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M18 18v12M18 30l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 30h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const BitbucketIcon = () => (
    <svg role="img" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <title>Bitbucket</title>
        <path d="M575.2 588.8l-62.4-198.4h-2.4l-60 198.4h124.8zM149.6 128c-19.2 0-33.6 16-32 35.2l96 684.8c2.4 16 16 28.8 32 30.4h540.8c12 0 22.4-8.8 24-20.8l96-694.4c1.6-19.2-12.8-35.2-32-35.2H149.6zm420.8 508.8H453.6L408 428.8h210.4l-48 208z" />
    </svg>
);

const GiteeIcon = () => (
    <svg role="img" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <title>Gitee</title>
        <path d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zm259.1-568.9H480.7c-15.8 0-28.6 12.8-28.6 28.6v57.1c0 15.8 12.8 28.6 28.6 28.6h176.8c15.8 0 28.6 12.8 28.6 28.6v14.3c0 47.3-38.4 85.7-85.7 85.7H366.7a28.6 28.6 0 0 1-28.6-28.6V416c0-47.3 38.4-85.7 85.7-85.7h347.3c15.8 0 28.6-12.8 28.6-28.6v-57.1c0-15.8-12.8-28.6-28.6-28.6H423.9c-94.7 0-171.4 76.8-171.4 171.4v275.5c0 15.8 12.8 28.6 28.6 28.6h344.6c85.2 0 154.3-69.1 154.3-154.3V483.7c0-15.8-12.8-28.6-28.6-28.6h-.3z" />
    </svg>
);

const AzureIcon = () => (
    <svg role="img" viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <title>Azure</title>
        <path d="M388.8 131.2L153.6 460.8l-128 355.2h230.4L388.8 131.2zm48 0L307.2 816h432L563.2 358.4l-126.4-227.2zM768 816h230.4L588.8 131.2 768 816z" />
    </svg>
);

export function getProviderInfo(url: string): ProviderInfo {
    const lower = (url || '').toLowerCase();
    if (lower.includes('github.com') || lower.includes('github.')) {
        return { icon: <GithubOutlined />, color: '#24292f', bg: '#f5f5f5', label: 'GitHub' };
    }
    if (lower.includes('gitlab.com') || lower.includes('gitlab.') || lower.includes('gitlab/')) {
        return { icon: <GitlabOutlined />, color: '#e24329', bg: '#fef0ed', label: 'GitLab' };
    }
    if (lower.includes('bitbucket.org') || lower.includes('bitbucket.')) {
        return { icon: <BitbucketIcon />, color: '#0052cc', bg: '#e6f0ff', label: 'Bitbucket' };
    }
    if (lower.includes('gitee.com') || lower.includes('gitee.')) {
        return { icon: <GiteeIcon />, color: '#c71d23', bg: '#fef0f0', label: 'Gitee' };
    }
    if (lower.includes('dev.azure.com') || lower.includes('visualstudio.com')) {
        return { icon: <AzureIcon />, color: '#0078d4', bg: '#e6f2ff', label: 'Azure' };
    }
    return { icon: <BranchesOutlined />, color: '#595959', bg: '#f5f5f5', label: 'Git' };
}

export function buildGitFileTreeData(items: GitRepoFileNode[]): DataNode[] {
    return items.map((item) => ({
        key: item.path,
        title: (
            <Space size={4}>
                {item.type === 'directory'
                    ? <FolderOutlined style={{ color: '#faad14' }} />
                    : <FileOutlined style={{ color: '#1890ff' }} />}
                {item.name}
            </Space>
        ),
        isLeaf: item.type === 'file',
        children: item.children ? buildGitFileTreeData(item.children) : undefined,
    }));
}

export function getErrorMessage(error: unknown, fallback: string = '操作失败') {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null) {
        const maybeError = error as {
            response?: { data?: { message?: string } };
            data?: { message?: string };
            message?: string;
        };
        return maybeError.response?.data?.message || maybeError.data?.message || maybeError.message || fallback;
    }
    return fallback;
}
