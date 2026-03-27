import React from 'react';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import type { AdvancedSearchField, SearchField } from '@/components/StandardTable';
import {
    HAS_REQUIRED_VARS_OPTIONS,
    HAS_VARIABLES_OPTIONS,
    PLAYBOOK_STATUS_OPTIONS,
    SCAN_MODE_OPTIONS,
} from '@/constants/playbookDicts';

export const playbookSearchFields: SearchField[] = [
    { key: 'name', label: '模板名称' },
    { key: 'file_path', label: '入口文件' },
    {
        key: '__enum__status', label: 'Playbook 状态',
        description: '筛选 Playbook 生命周期状态',
        options: PLAYBOOK_STATUS_OPTIONS,
    },
    {
        key: '__enum__config_mode', label: '扫描模式', options: SCAN_MODE_OPTIONS,
    },
    {
        key: '__enum__has_variables', label: '包含变量', options: HAS_VARIABLES_OPTIONS,
    },
    {
        key: '__enum__has_required_vars', label: '必填变量', options: HAS_REQUIRED_VARS_OPTIONS,
    },
];

export const playbookAdvancedSearchFields: AdvancedSearchField[] = [
    { key: 'name', label: '模板名称', type: 'input', placeholder: '输入模板名称' },
    { key: 'file_path', label: '入口文件', type: 'input', placeholder: '输入文件路径' },
    {
        key: 'status', label: 'Playbook 状态', type: 'select', options: PLAYBOOK_STATUS_OPTIONS,
    },
    {
        key: 'config_mode', label: '扫描模式', type: 'select', options: SCAN_MODE_OPTIONS,
    },
    {
        key: 'has_variables', label: '包含变量', type: 'select', options: HAS_VARIABLES_OPTIONS,
    },
    {
        key: 'has_required_vars', label: '必填变量', type: 'select', options: HAS_REQUIRED_VARS_OPTIONS,
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

export const playbookHeaderIcon = (
    <svg viewBox="0 0 48 48" fill="none">
        <title>Playbook 执行图标</title>
        <rect x="6" y="4" width="36" height="40" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M14 14h20M14 22h20M14 30h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="34" cy="34" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M34 31v6M31 34h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const playbookStatusConfig: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    pending: { text: '待扫描', color: '#8c8c8c', icon: <ClockCircleOutlined /> },
    scanned: { text: '待上线', color: '#1890ff', icon: <ClockCircleOutlined /> },
    ready: { text: '就绪', color: '#52c41a', icon: <CheckCircleOutlined /> },
    error: { text: '错误', color: '#ff4d4f', icon: <CloseCircleOutlined /> },
    invalid: { text: '无效', color: '#faad14', icon: <CloseCircleOutlined /> },
};
