import React from 'react';
import { Panel } from 'reactflow';
import { Button, Tooltip } from 'antd';
import { PartitionOutlined } from '@ant-design/icons';

interface AutoLayoutButtonProps {
    onAutoLayout: () => void;
}

const AutoLayoutButton: React.FC<AutoLayoutButtonProps> = ({ onAutoLayout }) => (
    <Panel position="top-right" style={{ margin: 10 }}>
        <Tooltip title="一键整理布局，自动排列所有节点">
            <Button
                icon={<PartitionOutlined />}
                onClick={onAutoLayout}
                size="small"
                style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                    borderColor: '#d9d9d9',
                }}
            >
                整理布局
            </Button>
        </Tooltip>
    </Panel>
);

export default AutoLayoutButton;
