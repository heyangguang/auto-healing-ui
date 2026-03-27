import React from 'react';
import { Button, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface ExecutionMissionControlFooterProps {
    disabled: boolean;
    executing: boolean;
    onExecute: () => void;
}

const ExecutionMissionControlFooter: React.FC<ExecutionMissionControlFooterProps> = ({
    disabled,
    executing,
    onExecute,
}) => (
    <div className="main-footer">
        <Space size="middle">
            <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={onExecute}
                loading={executing}
                disabled={disabled}
                style={{
                    height: 50,
                    padding: '0 40px',
                    fontSize: 16,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
                }}
            >
                立即执行 / EXECUTE
            </Button>
        </Space>
    </div>
);

export default ExecutionMissionControlFooter;
