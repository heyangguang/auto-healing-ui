import { Button, Checkbox, Modal, Tag } from 'antd';
import { CheckOutlined, ProjectOutlined } from '@ant-design/icons';
import React from 'react';
import type { ReviewGroup } from './templateListHelpers';

type TemplateBatchReviewModalProps = {
    confirmLoading: boolean;
    open: boolean;
    reviewGroups: ReviewGroup[];
    selectedPlaybooks: string[];
    onCancel: () => void;
    onConfirm: () => void;
    onSelectedPlaybooksChange: (playbookIds: string[]) => void;
};

const TemplateBatchReviewModal: React.FC<TemplateBatchReviewModalProps> = ({
    confirmLoading,
    open,
    reviewGroups,
    selectedPlaybooks,
    onCancel,
    onConfirm,
    onSelectedPlaybooksChange,
}) => (
    <Modal
        title={<><CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />批量确认审核</>}
        open={open}
        onCancel={onCancel}
        onOk={onConfirm}
        confirmLoading={confirmLoading}
        okText={`确认 ${selectedPlaybooks.length} 个 Playbook（${reviewGroups.filter((group) => selectedPlaybooks.includes(group.playbook_id)).reduce((sum, group) => sum + group.count, 0)} 个模板）`}
        width={520}
    >
        <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>
            选择要批量确认审核的 Playbook，确认后其下所有待审核的任务模板将标记为已审核。
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <Button
                type="link"
                size="small"
                onClick={() => onSelectedPlaybooksChange(
                    selectedPlaybooks.length === reviewGroups.length
                        ? []
                        : reviewGroups.map((group) => group.playbook_id),
                )}
            >
                {selectedPlaybooks.length === reviewGroups.length ? '取消全选' : '全选'}
            </Button>
        </div>
        {reviewGroups.map((group) => (
            <div
                key={group.playbook_id}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    marginBottom: 6,
                    border: `1px solid ${selectedPlaybooks.includes(group.playbook_id) ? '#1890ff' : '#f0f0f0'}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedPlaybooks.includes(group.playbook_id) ? '#f0f7ff' : '#fafafa',
                    transition: 'all 0.2s',
                }}
                onClick={() => onSelectedPlaybooksChange(
                    selectedPlaybooks.includes(group.playbook_id)
                        ? selectedPlaybooks.filter((playbookId) => playbookId !== group.playbook_id)
                        : [...selectedPlaybooks, group.playbook_id],
                )}
            >
                <Checkbox checked={selectedPlaybooks.includes(group.playbook_id)} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                        <ProjectOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                        {group.playbook_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                        {group.count} 个待审核模板
                    </div>
                </div>
                <Tag color="error" style={{ margin: 0 }}>{group.count}</Tag>
            </div>
        ))}
    </Modal>
);

export default TemplateBatchReviewModal;
