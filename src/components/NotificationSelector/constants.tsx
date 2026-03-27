import React from 'react';
import { CheckCircleOutlined, RocketOutlined, StopOutlined } from '@ant-design/icons';
import type { TriggerMeta } from './types';

export const TRIGGERS: TriggerMeta[] = [
    { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', tagColor: 'processing' },
    { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', tagColor: 'success' },
    { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', tagColor: 'error' },
];
