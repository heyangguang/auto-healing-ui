import React from 'react';
import { Button, Input } from 'antd';
import {
    AppstoreOutlined,
    ArrowLeftOutlined,
    ClearOutlined,
    ExperimentOutlined,
    SaveOutlined,
} from '@ant-design/icons';

type FlowEditorHeaderProps = {
    canSave: boolean;
    flowName: string;
    hasFlowId: boolean;
    onBack: () => void;
    onLayout: () => void;
    onNameChange: (value: string) => void;
    onResetState: () => void;
    onRunDryRun: () => void;
    onSave: () => void;
};

export const FlowEditorHeader: React.FC<FlowEditorHeaderProps> = ({
    canSave,
    flowName,
    hasFlowId,
    onBack,
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
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ExperimentOutlined />} onClick={onRunDryRun} disabled={!hasFlowId}>Dry-Run</Button>
            <Button icon={<ClearOutlined />} onClick={onResetState}>重置状态</Button>
            <Button icon={<AppstoreOutlined />} onClick={onLayout}>一键整理</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={onSave} disabled={!canSave}>保存流程</Button>
        </div>
    </div>
);
