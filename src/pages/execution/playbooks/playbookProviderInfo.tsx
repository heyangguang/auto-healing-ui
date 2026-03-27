import React from 'react';
import { BranchesOutlined, FolderOutlined, GithubOutlined, GitlabOutlined } from '@ant-design/icons';

const BitbucketIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M575.2 588.8l-62.4-198.4h-2.4l-60 198.4h124.8zM149.6 128c-19.2 0-33.6 16-32 35.2l96 684.8c2.4 16 16 28.8 32 30.4h540.8c12 0 22.4-8.8 24-20.8l96-694.4c1.6-19.2-12.8-35.2-32-35.2H149.6zm420.8 508.8H453.6L408 428.8h210.4l-48 208z" />
    </svg>
);

const GiteeIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M512 1024C229.2 1024 0 794.8 0 512S229.2 0 512 0s512 229.2 512 512-229.2 512-512 512zm259.1-568.9H480.7c-15.8 0-28.6 12.8-28.6 28.6v57.1c0 15.8 12.8 28.6 28.6 28.6h176.8c15.8 0 28.6 12.8 28.6 28.6v14.3c0 47.3-38.4 85.7-85.7 85.7H366.7a28.6 28.6 0 0 1-28.6-28.6V416c0-47.3 38.4-85.7 85.7-85.7h347.3c15.8 0 28.6-12.8 28.6-28.6v-57.1c0-15.8-12.8-28.6-28.6-28.6H423.9c-94.7 0-171.4 76.8-171.4 171.4v275.5c0 15.8 12.8 28.6 28.6 28.6h344.6c85.2 0 154.3-69.1 154.3-154.3V483.7c0-15.8-12.8-28.6-28.6-28.6h-.3z" />
    </svg>
);

const AzureIcon = () => (
    <svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor">
        <path d="M388.8 131.2L153.6 460.8l-128 355.2h230.4L388.8 131.2zm48 0L307.2 816h432L563.2 358.4l-126.4-227.2zM768 816h230.4L588.8 131.2 768 816z" />
    </svg>
);

export function getProviderInfo(url: string) {
    const lower = (url || '').toLowerCase();
    if (lower.includes('github.com') || lower.includes('github.')) {
        return { icon: <GithubOutlined />, color: '#24292f', label: 'GitHub' };
    }
    if (lower.includes('gitlab.com') || lower.includes('gitlab.') || lower.includes('gitlab/')) {
        return { icon: <GitlabOutlined />, color: '#e24329', label: 'GitLab' };
    }
    if (lower.includes('bitbucket.org') || lower.includes('bitbucket.')) {
        return { icon: <BitbucketIcon />, color: '#0052cc', label: 'Bitbucket' };
    }
    if (lower.includes('gitee.com') || lower.includes('gitee.')) {
        return { icon: <GiteeIcon />, color: '#c71d23', label: 'Gitee' };
    }
    if (lower.includes('dev.azure.com') || lower.includes('visualstudio.com')) {
        return { icon: <AzureIcon />, color: '#0078d4', label: 'Azure' };
    }
    if (lower.startsWith('file://') || lower.startsWith('/')) {
        return { icon: <FolderOutlined />, color: '#595959', label: '本地' };
    }
    return { icon: <BranchesOutlined />, color: '#595959', label: 'Git' };
}
