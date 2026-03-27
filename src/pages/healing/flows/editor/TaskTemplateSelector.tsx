import React from 'react';
import { Modal, Space, Spin } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import TaskTemplateSelectorView from './TaskTemplateSelectorView';
import type { TaskTemplateSelectorProps } from './taskTemplateSelectorTypes';
import { useTaskTemplateSelectorState } from './useTaskTemplateSelectorState';

const TaskTemplateSelector: React.FC<TaskTemplateSelectorProps> = ({
    open,
    value,
    onSelect,
    onCancel,
}) => {
    const selector = useTaskTemplateSelectorState({ open, value });

    const handleConfirm = () => {
        if (!selector.selectedTaskId || !selector.selectedTask) {
            return;
        }
        onSelect(selector.selectedTaskId, selector.selectedTask);
    };

    return (
        <Modal
            title={(
                <Space>
                    <CodeOutlined />
                    选择任务模板
                </Space>
            )}
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="确定选择"
            okButtonProps={{ disabled: !selector.canConfirm }}
            width={1000}
            destroyOnHidden
        >
            <Spin spinning={selector.initLoading} tip="加载中...">
                <TaskTemplateSelectorView {...selector} />
            </Spin>
        </Modal>
    );
};

export default TaskTemplateSelector;
