import React from 'react';
import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import { history, type AccessInstance } from '@umijs/max';
import { Divider, Popconfirm, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { StandardColumnDef } from '@/components/StandardTable';
import { formatNextRun } from './schedulePageHelpers';

const { Text } = Typography;

interface BuildScheduleColumnsOptions {
    access: AccessInstance;
    actionLoading: string | null;
    templateMap: Record<string, AutoHealing.ExecutionTask>;
    onDelete: (schedule: AutoHealing.ExecutionSchedule) => void;
    onOpenDetail: (schedule: AutoHealing.ExecutionSchedule) => void;
    onToggle: (schedule: AutoHealing.ExecutionSchedule, enabled: boolean) => void;
}

export function buildScheduleColumns({
    access,
    actionLoading,
    templateMap,
    onDelete,
    onOpenDetail,
    onToggle,
}: BuildScheduleColumnsOptions): StandardColumnDef<AutoHealing.ExecutionSchedule>[] {
    return [
        {
            columnKey: 'name',
            columnTitle: '调度名称',
            dataIndex: 'name',
            width: 200,
            fixedColumn: true,
            sorter: true,
            render: (name: string, record: AutoHealing.ExecutionSchedule) => (
                <Space orientation="vertical" size={0}>
                    <Text strong style={{ fontSize: 13 }}>{name || '未命名'}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {templateMap[record.task_id]?.name || record.task_id?.slice(0, 8)}
                    </Text>
                </Space>
            ),
        },
        {
            columnKey: 'schedule_type',
            columnTitle: '类型',
            dataIndex: 'schedule_type',
            width: 90,
            render: (type: string) => (
                <Tag color={type === 'cron' ? 'blue' : 'purple'} style={{ margin: 0 }}>
                    {type === 'cron' ? '定时循环' : '单次执行'}
                </Tag>
            ),
        },
        {
            columnKey: 'schedule_expr',
            columnTitle: '表达式',
            dataIndex: 'schedule_expr',
            width: 160,
            render: (expr: string, record: AutoHealing.ExecutionSchedule) => (
                <Text code style={{ fontSize: 11 }}>
                    {record.schedule_type === 'cron'
                        ? expr
                        : (record.scheduled_at ? dayjs(record.scheduled_at).format('MM-DD HH:mm') : '-')}
                </Text>
            ),
        },
        {
            columnKey: 'enabled',
            columnTitle: '状态',
            dataIndex: 'enabled',
            width: 80,
            render: (enabled: boolean, record: AutoHealing.ExecutionSchedule) => (
                <Switch
                    size="small"
                    checked={enabled}
                    loading={actionLoading === record.id}
                    onChange={(checked) => onToggle(record, checked)}
                    disabled={!access.canUpdateTask}
                />
            ),
        },
        {
            columnKey: 'next_run_at',
            columnTitle: '下次执行',
            dataIndex: 'next_run_at',
            width: 130,
            sorter: true,
            render: (nextRun: string) => formatNextRun(nextRun),
        },
        {
            columnKey: 'last_run_at',
            columnTitle: '上次执行',
            dataIndex: 'last_run_at',
            width: 130,
            sorter: true,
            render: (lastRun: string) => lastRun
                ? <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{dayjs(lastRun).format('MM-DD HH:mm')}</Text>
                : <Text type="secondary">-</Text>,
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 140,
            fixed: 'right',
            fixedColumn: true,
            render: (_: unknown, record: AutoHealing.ExecutionSchedule) => (
                <Space separator={<Divider orientation="vertical" />}>
                    <a onClick={() => onOpenDetail(record)}>
                        <Tooltip title="查看详情"><EyeOutlined style={{ fontSize: 16 }} /></Tooltip>
                    </a>
                    {access.canUpdateTask && (
                        <a onClick={() => history.push(`/execution/schedules/${record.id}/edit`)}>
                            <Tooltip title="编辑"><EditOutlined style={{ fontSize: 16 }} /></Tooltip>
                        </a>
                    )}
                    {access.canDeleteTask && (
                        <Popconfirm
                            title="确认删除此调度？"
                            onConfirm={() => onDelete(record)}
                            okText="确认"
                            cancelText="取消"
                        >
                            <a style={{ color: '#ff4d4f' }}>
                                <Tooltip title="删除"><DeleteOutlined style={{ fontSize: 16 }} /></Tooltip>
                            </a>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];
}
