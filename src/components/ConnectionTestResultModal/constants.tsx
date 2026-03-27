import React from 'react';
import {
    AppstoreOutlined,
    CloudOutlined,
    DesktopOutlined,
    GlobalOutlined,
    HddOutlined,
    LinuxOutlined,
    WindowsOutlined,
} from '@ant-design/icons';

export const getOSIcon = (os?: string) => {
    if (!os) return <CloudOutlined style={{ color: '#8c8c8c' }} />;
    const lower = os.toLowerCase();
    if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('centos') || lower.includes('rhel') || lower.includes('debian')) {
        return <LinuxOutlined style={{ color: '#1890ff' }} />;
    }
    if (lower.includes('windows') || lower.includes('win')) {
        return <WindowsOutlined style={{ color: '#0078d4' }} />;
    }
    return <CloudOutlined style={{ color: '#8c8c8c' }} />;
};

export const TYPE_LABELS: Record<string, { text: string; icon: React.ReactNode }> = {
    server: { text: '服务器', icon: <DesktopOutlined /> },
    application: { text: '应用', icon: <AppstoreOutlined /> },
    network: { text: '网络', icon: <GlobalOutlined /> },
    database: { text: '数据库', icon: <HddOutlined /> },
};

export const ENV_COLORS: Record<string, string> = {
    production: 'red',
    staging: 'orange',
    dev: 'blue',
    test: 'green',
};
