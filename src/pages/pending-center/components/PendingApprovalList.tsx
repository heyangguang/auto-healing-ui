import React, { useRef } from 'react';
import { Button, message, Modal, Input, Tag, Space } from 'antd';
import { ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import { getPendingApprovals, approveTask, rejectTask } from '@/services/auto-healing/healing';
import { ClockCircleOutlined } from '@ant-design/icons';

const PendingApprovalList: React.FC = () => {
    const actionRef = useRef<ActionType>();

    const handleApprove = async (id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `批准任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入审批意见（可选）"
                        onChange={(e) => comment = e.target.value}
                    />
                </div>
            ),
            okText: '批准',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await approveTask(id, { comment });
                    message.success('已批准');
                    actionRef.current?.reload();
                } catch (error) {
                    message.error('操作失败');
                }
            }
        });
    };

    const handleReject = async (id: string, nodeName: string) => {
        let comment = '';
        Modal.confirm({
            title: `拒绝任务: ${nodeName}`,
            content: (
                <div style={{ marginTop: 16 }}>
                    <Input.TextArea
                        placeholder="请输入拒绝原因（必填）"
                        onChange={(e) => comment = e.target.value}
                    />
                </div>
            ),
            okText: '拒绝',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                if (!comment) {
                    message.error('请输入拒绝原因');
                    return Promise.reject();
                }
                try {
                    await rejectTask(id, { comment });
                    message.success('已拒绝');
                    actionRef.current?.reload();
                } catch (error) {
                    message.error('操作失败');
                }
            }
        });
    };

    const columns: ProColumns<AutoHealing.ApprovalTask>[] = [
        {
            title: '节点名称',
            dataIndex: 'node_name',
            key: 'node_name',
            ellipsis: true,
            render: (text) => text || '审批节点',
        },
        {
            title: '流程实例',
            dataIndex: 'flow_instance_id',
            key: 'flow_instance_id',
            width: 180,
            render: (_, record) => <Tag>FLOW-{record.flow_instance_id?.substring(0, 8)}</Tag>,
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            search: false,
            render: () => <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>,
        },
        {
            title: '审批人',
            dataIndex: 'approvers',
            width: 200,
            search: false,
            render: (_, record) => (record.approvers || []).join(', ') || '-',
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            valueType: 'dateTime',
            width: 180,
            search: false,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleApprove(record.id, record.node_name || '节点')}
                    >
                        批准
                    </Button>
                    <Button
                        danger
                        size="small"
                        onClick={() => handleReject(record.id, record.node_name || '节点')}
                    >
                        拒绝
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <ProTable<AutoHealing.ApprovalTask>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={async (params) => {
                const { current = 1, pageSize = 10, ...rest } = params;
                const res = await getPendingApprovals({ page: current, page_size: pageSize, ...rest });
                return {
                    data: res.data || [],
                    total: res.total || 0,
                    success: true,
                };
            }}
            pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
            }}
            search={{
                labelWidth: 'auto',
            }}
            dateFormatter="string"
            toolBarRender={() => []}
        />
    );
};

export default PendingApprovalList;
