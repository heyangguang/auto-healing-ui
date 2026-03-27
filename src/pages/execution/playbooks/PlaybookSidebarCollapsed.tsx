import React from 'react';
import { Card, Tooltip } from 'antd';
import { FileTextOutlined, FolderOpenOutlined } from '@ant-design/icons';

type PlaybookSidebarCollapsedProps = {
    onSetActiveTab: (key: string) => void;
    selectedPlaybook?: AutoHealing.Playbook;
};

export default function PlaybookSidebarCollapsed(props: PlaybookSidebarCollapsedProps) {
    const { onSetActiveTab, selectedPlaybook } = props;

    return (
        <Card styles={{ body: { padding: '12px 8px' } }} style={{ height: '100%', textAlign: 'center', overflow: 'hidden' }}>
            <Tooltip title={selectedPlaybook?.name} placement="right">
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12 }} onClick={() => onSetActiveTab('overview')}>
                    <FileTextOutlined />
                </div>
            </Tooltip>
            <Tooltip title="返回概览" placement="right">
                <div style={{ width: 32, height: 32, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => onSetActiveTab('overview')}>
                    <FolderOpenOutlined style={{ color: '#666' }} />
                </div>
            </Tooltip>
        </Card>
    );
}
