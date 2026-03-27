import React from 'react';
import { Alert, Modal, Typography } from 'antd';
import { EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { ModalForm, ProFormText, ProFormTextArea } from '@ant-design/pro-components';

const { Text } = Typography;

type PlaybookDialogsProps = {
    deleteConfirmOpen: boolean;
    deleteTarget?: AutoHealing.Playbook;
    editModalOpen: boolean;
    onCloseDelete: () => void;
    onDelete: () => void;
    onEditFinish: (values: { name: string; description?: string }) => Promise<boolean>;
    onEditOpenChange: (open: boolean) => void;
    relatedTaskCount: number;
    selectedPlaybook?: AutoHealing.Playbook;
};

export default function PlaybookDialogs(props: PlaybookDialogsProps) {
    const { deleteConfirmOpen, deleteTarget, editModalOpen, onCloseDelete, onDelete, onEditFinish, onEditOpenChange, relatedTaskCount, selectedPlaybook } = props;

    return (
        <>
            <Modal
                title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />确认删除</>}
                open={deleteConfirmOpen}
                onCancel={onCloseDelete}
                onOk={onDelete}
                okText="删除"
                okButtonProps={{ danger: true, disabled: relatedTaskCount > 0 }}
            >
                {relatedTaskCount > 0 ? (
                    <Alert type="error" message={<>无法删除：关联 <b>{relatedTaskCount}</b> 个任务模板</>} description="请先删除关联的任务模板后再删除此 Playbook" showIcon />
                ) : (
                    <>
                        <p>确定删除 Playbook <Text strong>{deleteTarget?.name}</Text> 吗？</p>
                        <Alert type="warning" message="删除后关联的扫描日志也会被删除" showIcon />
                    </>
                )}
            </Modal>

            <ModalForm
                title={<><EditOutlined style={{ marginRight: 8 }} />编辑 Playbook</>}
                open={editModalOpen}
                onOpenChange={onEditOpenChange}
                modalProps={{ destroyOnHidden: true, width: 520 }}
                initialValues={selectedPlaybook}
                layout="vertical"
                onFinish={onEditFinish}
            >
                <ProFormText name="name" label="模板名称" placeholder="请输入 Playbook 模板名称" rules={[{ required: true, message: '请输入模板名称' }]} fieldProps={{ size: 'large' }} />
                <ProFormTextArea name="description" label="描述" placeholder="可选，描述此 Playbook 的用途" fieldProps={{ rows: 4, showCount: true, maxLength: 500 }} />
            </ModalForm>
        </>
    );
}
