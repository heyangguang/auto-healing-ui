import React from 'react';
import { Tag, } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    StopOutlined,
    QuestionCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';

interface StatusBadgeProps {
    status: string;
    size?: 'default' | 'small';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'success':
            return <Tag icon={<CheckCircleOutlined />} color="#52c41a">成功</Tag>;       // 绿色
        case 'partial':
            return <Tag icon={<ExclamationCircleOutlined />} color="#fa8c16">部分成功</Tag>; // 橙色
        case 'failed':
            return <Tag icon={<CloseCircleOutlined />} color="#ff4d4f">失败</Tag>;       // 红色
        case 'running':
            return <Tag icon={<SyncOutlined spin />} color="#1890ff">运行中</Tag>;       // 蓝色
        case 'pending':
            return <Tag icon={<ClockCircleOutlined />} color="#722ed1">排队中</Tag>;     // 紫色
        case 'cancelled':
            return <Tag icon={<StopOutlined />} color="#8c8c8c">已取消</Tag>;           // 灰色
        case 'timeout':
            return <Tag icon={<ClockCircleOutlined />} color="#eb2f96">超时</Tag>;       // 洋红色
        default:
            return <Tag icon={<QuestionCircleOutlined />} color="default">未知</Tag>;
    }
};

export default StatusBadge;
