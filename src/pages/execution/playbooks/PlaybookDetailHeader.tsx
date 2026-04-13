import React from 'react';
import {
    Button,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CodeOutlined,
    DeleteOutlined,
    EditOutlined,
    FileTextOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import type { PlaybookStatusSummary } from './playbookTypes';

const { Text } = Typography;

type PlaybookDetailHeaderProps = {
    canManage: boolean;
    onDelete: () => void;
    onEdit: () => void;
    onScan: () => void;
    onSetOffline: () => void;
    onSetReady: () => void;
    playbook: AutoHealing.Playbook;
    scanning?: string;
    statusInfo: PlaybookStatusSummary;
};

const PlaybookDetailHeader: React.FC<PlaybookDetailHeaderProps> = ({
    canManage,
    onDelete,
    onEdit,
    onScan,
    onSetOffline,
    onSetReady,
    playbook,
    scanning,
    statusInfo,
}) => (
    <div
        className="pb-detail-header"
    >
        <div className="pb-detail-header-meta">
            <Space size={12} wrap>
                <CodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                    <Text strong className="pb-detail-header-title">{playbook.name}</Text>
                    <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
                </div>
            </Space>
            <div className="pb-detail-header-file">
                <FileTextOutlined style={{ marginRight: 4 }} /> {playbook.file_path}
            </div>
        </div>
        <Space wrap className="pb-detail-header-actions">
            <Button
                icon={<SyncOutlined spin={scanning === playbook.id} />}
                onClick={onScan}
                disabled={scanning === playbook.id || !canManage}
            >
                扫描变量
            </Button>
            {playbook.status === 'scanned' && (
                <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={onSetReady}
                    disabled={!canManage}
                >
                    上线
                </Button>
            )}
            {playbook.status === 'ready' && (
                <Button
                    icon={<ClockCircleOutlined />}
                    onClick={onSetOffline}
                    disabled={!canManage}
                >
                    下线
                </Button>
            )}
            <Button icon={<EditOutlined />} onClick={onEdit} disabled={!canManage}>编辑</Button>
            <Button danger icon={<DeleteOutlined />} onClick={onDelete} disabled={!canManage}>删除</Button>
        </Space>
    </div>
);

export default PlaybookDetailHeader;
