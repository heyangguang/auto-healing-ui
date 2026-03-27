import React from 'react';
import {
    AlertOutlined,
    ApartmentOutlined,
    AppstoreOutlined,
    BellOutlined,
    BookOutlined,
    DatabaseOutlined,
    FileTextOutlined,
    GitlabOutlined,
    KeyOutlined,
    MailOutlined,
    PlayCircleOutlined,
    SafetyCertificateOutlined,
    ScheduleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

export const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
    hosts: { icon: <DatabaseOutlined />, color: '#52c41a' },
    incidents: { icon: <AlertOutlined />, color: '#ff4d4f' },
    rules: { icon: <SafetyCertificateOutlined />, color: '#faad14' },
    flows: { icon: <ApartmentOutlined />, color: '#1890ff' },
    instances: { icon: <PlayCircleOutlined />, color: '#722ed1' },
    playbooks: { icon: <BookOutlined />, color: '#13c2c2' },
    templates: { icon: <FileTextOutlined />, color: '#eb2f96' },
    schedules: { icon: <ScheduleOutlined />, color: '#fa8c16' },
    execution_runs: { icon: <ThunderboltOutlined />, color: '#9254de' },
    git_repos: { icon: <GitlabOutlined />, color: '#fc6d26' },
    secrets: { icon: <KeyOutlined />, color: '#fadb14' },
    plugins: { icon: <AppstoreOutlined />, color: '#2f54eb' },
    notification_templates: { icon: <BellOutlined />, color: '#f5222d' },
    notification_channels: { icon: <MailOutlined />, color: '#a0d911' },
};

export const CATEGORY_LIST: Record<string, string> = {
    hosts: '/resources/cmdb',
    incidents: '/resources/incidents',
    rules: '/healing/rules',
    flows: '/healing/flows',
    instances: '/healing/instances',
    playbooks: '/execution/playbooks',
    templates: '/execution/templates',
    schedules: '/execution/schedules',
    execution_runs: '/execution/logs',
    git_repos: '/execution/git-repos',
    secrets: '/resources/secrets',
    plugins: '/resources/plugins',
    notification_templates: '/notification/templates',
    notification_channels: '/notification/channels',
};

export const DEBOUNCE = 280;
export const GLOBAL_SEARCH_RESULTS_ID = 'global-search-results';
