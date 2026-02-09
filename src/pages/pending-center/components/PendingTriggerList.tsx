import React, { useRef } from 'react';
import { Button, message, Modal, Tag } from 'antd';
import { ProTable, ProColumns, ActionType } from '@ant-design/pro-components';
import { getPendingTriggers, triggerHealing } from '@/services/auto-healing/healing';
import { AlertOutlined, WarningOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const PendingTriggerList: React.FC = () => {
    const actionRef = useRef<ActionType>();

    const handleTrigger = async (id: string, external_id: string) => {
        Modal.confirm({
            title: '确认启动自愈？',
            content: `确定要为工单 ${external_id} 启动自愈流程吗？`,
            okText: '启动',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await triggerHealing(id);
                    message.success('已启动自愈流程');
                    actionRef.current?.reload();
                } catch (error) {
                    message.error('启动失败');
                }
            },
        });
    };

    const getSeverityTag = (severity: string | number) => {
        const s = String(severity).toLowerCase();
        if (s === '1' || s === 'critical') return <Tag color="error" icon={<AlertOutlined />}>严重</Tag>;
        if (s === '2' || s === 'high') return <Tag color="warning" icon={<WarningOutlined />}>高</Tag>;
        if (s === '3' || s === 'medium') return <Tag color="processing" icon={<InfoCircleOutlined />}>中</Tag>;
        return <Tag color="default" icon={<CheckCircleOutlined />}>低</Tag>;
    };

    const columns: ProColumns<AutoHealing.Incident>[] = [
        {
            title: '工单标题',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: '工单ID',
            dataIndex: 'external_id',
            key: 'external_id',
            width: 180,
            copyable: true,
        },
        {
            title: '等级',
            dataIndex: 'severity',
            key: 'severity',
            width: 100,
            render: (_, record) => getSeverityTag(record.severity),
            valueType: 'select',
            valueEnum: {
                critical: { text: '严重' },
                high: { text: '高' },
                medium: { text: '中' },
                low: { text: '低' },
            },
        },
        {
            title: '影响CI',
            dataIndex: 'affected_ci',
            key: 'affected_ci',
            width: 150,
        },
        {
            title: '影响服务',
            dataIndex: 'affected_service',
            key: 'affected_service',
            width: 150,
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
            width: 100,
            render: (_, record) => [
                <Button
                    key="trigger"
                    type="primary"
                    size="small"
                    onClick={() => handleTrigger(record.id, record.external_id)}
                >
                    启动
                </Button>
            ],
        },
    ];

    return (
        <ProTable<AutoHealing.Incident>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={async (params) => {
                const { current = 1, pageSize = 10, ...rest } = params;
                const res = await getPendingTriggers({ page: current, page_size: pageSize, ...rest });
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

export default PendingTriggerList;
