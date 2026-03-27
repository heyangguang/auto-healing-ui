import React from 'react';
import {
    CodeOutlined,
    CopyOutlined,
    DeleteOutlined,
    EyeOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';

const { Text } = Typography;

type TemplateEditorHeaderProps = {
    canDelete: boolean;
    canSave: boolean;
    form: FormInstance;
    isCreating: boolean;
    isDirty: boolean;
    onDelete: () => void;
    onNameChange: () => void;
    onPreview: () => void;
    onSave: () => void;
    saving: boolean;
    selectedId: string | null;
    showPreview: boolean;
};

const copyTemplateId = async (templateId: string) => {
    try {
        await navigator.clipboard.writeText(templateId);
        message.success('ID 已复制');
    } catch {
        message.error('复制模板 ID 失败，请手动复制');
    }
};

const TemplateEditorHeader: React.FC<TemplateEditorHeaderProps> = ({
    canDelete,
    canSave,
    form,
    isCreating,
    isDirty,
    onDelete,
    onNameChange,
    onPreview,
    onSave,
    saving,
    selectedId,
    showPreview,
}) => (
    <div className="templates-editor-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={{ fontSize: 11 }} type="secondary">
                    {isCreating ? '新建模板' : `ID: ${selectedId}`}
                </Text>
                {selectedId && !isCreating && (
                    <Tooltip title="复制 ID">
                        <CopyOutlined
                            onClick={() => void copyTemplateId(selectedId)}
                            style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }}
                        />
                    </Tooltip>
                )}
            </div>
            <Space>
                <Form component={false} form={form}>
                    <Form.Item name="name" noStyle>
                        <Input
                            onChange={onNameChange}
                            placeholder="请输入模板名称"
                            style={{ fontSize: 18, fontWeight: 600, padding: 0, width: 300 }}
                            variant="borderless"
                        />
                    </Form.Item>
                </Form>
                {isDirty && <Tag color="warning">未保存</Tag>}
            </Space>
        </div>

        <Space>
            <Button disabled={isDirty || isCreating} icon={showPreview ? <CodeOutlined /> : <EyeOutlined />} onClick={onPreview}>
                {showPreview ? '返回编辑' : '预览效果'}
            </Button>
            <Button
                disabled={!canSave}
                icon={<SaveOutlined />}
                loading={saving}
                onClick={onSave}
                type="primary"
            >
                保存
            </Button>
            {selectedId && !isCreating && (
                <Popconfirm
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                    okText="确认"
                    onConfirm={onDelete}
                    title="确认删除此模板?"
                >
                    <Button danger disabled={!canDelete} icon={<DeleteOutlined />}>删除</Button>
                </Popconfirm>
            )}
        </Space>
    </div>
);

export default TemplateEditorHeader;
