import { Alert, Drawer } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import React from 'react';

type TemplateVariablesDrawerProps = {
    children: React.ReactNode;
    onClose: () => void;
    open: boolean;
};

const TemplateVariablesDrawer: React.FC<TemplateVariablesDrawerProps> = ({
    children,
    onClose,
    open,
}) => (
    <Drawer
        title="可用变量"
        placement="right"
        size={340}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: 16 } }}
    >
        <Alert
            title="点击变量即可复制到剪贴板"
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
        />
        {children}
    </Drawer>
);

export default TemplateVariablesDrawer;
