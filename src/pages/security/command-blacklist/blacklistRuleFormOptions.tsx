import React from 'react';
import {
    BugOutlined,
    LockOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import type { MatchTypeOption } from './blacklistRuleFormTypes';

export const MATCH_TYPE_OPTIONS: MatchTypeOption[] = [
    { value: 'contains', label: '包含匹配', desc: '行中任意位置包含该文本即命中', icon: <SearchOutlined /> },
    { value: 'regex', label: '正则匹配', desc: '使用正则表达式匹配行内容', icon: <BugOutlined /> },
    { value: 'exact', label: '精确匹配', desc: '整行去空格后必须完全等于该文本', icon: <LockOutlined /> },
];

export const SEVERITY_OPTIONS = [
    { value: 'critical', label: '严重' },
    { value: 'high', label: '高危' },
    { value: 'medium', label: '中危' },
];

export const CATEGORY_OPTIONS = [
    { value: 'filesystem', label: '文件系统' },
    { value: 'network', label: '网络' },
    { value: 'system', label: '系统' },
    { value: 'database', label: '数据库' },
];

export const FILE_TYPE_COLORS: Record<string, string> = {
    entry: 'blue',
    task: 'green',
    template: 'orange',
    handlers: 'purple',
    vars: 'cyan',
    defaults: 'geekblue',
    meta: '#999',
};

export const PAGE_SIZE = 50;
