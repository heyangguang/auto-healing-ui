import React from 'react';
import { Badge, Button, Input, Space, Switch, Typography } from 'antd';
import {
    AppstoreOutlined,
    ArrowLeftOutlined,
    ClearOutlined,
    ExperimentOutlined,
    SettingOutlined,
    SaveOutlined,
} from '@ant-design/icons';

type FlowEditorHeaderProps = {
    autoCloseSourceIncident: boolean;
    canSave: boolean;
    flowName: string;
    hasConfiguredCloseTemplate: boolean;
    hasFlowId: boolean;
    onAutoCloseChange: (value: boolean) => void;
    onBack: () => void;
    onConfigureAutoClose: () => void;
    onLayout: () => void;
    onNameChange: (value: string) => void;
    onResetState: () => void;
    onRunDryRun: () => void;
    onSave: () => void;
};

export const FlowEditorHeader: React.FC<FlowEditorHeaderProps> = ({
    autoCloseSourceIncident,
    canSave,
    flowName,
    hasConfiguredCloseTemplate,
    hasFlowId,
    onAutoCloseChange,
    onBack,
    onConfigureAutoClose,
    onLayout,
    onNameChange,
    onResetState,
    onRunDryRun,
    onSave,
}) => (
    <div
        style={{
            position: 'absolute', top: 10, left: 10, right: 10, zIndex: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(255,255,255,0.9)', padding: '8px 16px', borderRadius: 8,
            backdropFilter: 'blur(4px)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack} />
            <Input
                value={flowName}
                onChange={(event) => onNameChange(event.target.value)}
                style={{ width: 300, fontSize: 16, fontWeight: 500 }}
                bordered={false}
                placeholder="流程名称"
            />
            <Space size={6}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    成功后自动关单
                </Typography.Text>
                <Switch checked={autoCloseSourceIncident} onChange={onAutoCloseChange} />
                <Badge dot={autoCloseSourceIncident && !hasConfiguredCloseTemplate}>
                    <Button
                        icon={<SettingOutlined />}
                        onClick={onConfigureAutoClose}
                        size="small"
                        type={hasConfiguredCloseTemplate ? 'default' : 'primary'}
                    >
                        配置策略
                    </Button>
                </Badge>
            </Space>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ExperimentOutlined />} onClick={onRunDryRun} disabled={!hasFlowId}>Dry-Run</Button>
            <Button icon={<ClearOutlined />} onClick={onResetState}>重置状态</Button>
            <Button icon={<AppstoreOutlined />} onClick={onLayout}>一键整理</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave} disabled={!canSave}>保存流程</Button>
        </div>
    </div>
);
