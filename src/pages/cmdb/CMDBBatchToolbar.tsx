import React from 'react';
import {
    ApiOutlined,
    CheckCircleOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';

type CMDBBatchToolbarProps = {
    canTestPlugin: boolean;
    canUpdatePlugin: boolean;
    onBatchResume: () => void;
    onClearSelection: () => void;
    onOpenMaintenance: () => void;
    onOpenTestModal: () => void;
    onSelectAll: () => void;
    selectedCount: number;
};

export const CMDBBatchToolbar: React.FC<CMDBBatchToolbarProps> = ({
    canTestPlugin,
    canUpdatePlugin,
    onBatchResume,
    onClearSelection,
    onOpenMaintenance,
    onOpenTestModal,
    onSelectAll,
    selectedCount,
}) => {
    if (selectedCount === 0) {
        return null;
    }

    return (
        <div className="cmdb-batch-bar" style={{ gap: 6 }}>
            <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>
                已选 {selectedCount} 项
            </span>
            <Button type="link" style={{ padding: 0, fontWeight: 500 }} onClick={onSelectAll}>
                全选所有
            </Button>
            <Button size="small" icon={<ApiOutlined />} disabled={!canTestPlugin} onClick={onOpenTestModal}>
                测试密钥
            </Button>
            <Button
                size="small"
                icon={<ToolOutlined />}
                disabled={!canUpdatePlugin}
                onClick={onOpenMaintenance}
                style={{ borderColor: '#faad14', color: '#faad14' }}
            >
                维护
            </Button>
            <Button
                size="small"
                icon={<CheckCircleOutlined />}
                disabled={!canUpdatePlugin}
                onClick={onBatchResume}
                style={{ borderColor: '#52c41a', color: '#52c41a' }}
            >
                恢复
            </Button>
            <Button type="link" style={{ color: '#8c8c8c' }} onClick={onClearSelection}>
                取消选择
            </Button>
        </div>
    );
};
