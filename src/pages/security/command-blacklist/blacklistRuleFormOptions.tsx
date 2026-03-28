import React from 'react';
import {
    BugOutlined,
    LockOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import {
    getBlacklistCategoryOptions,
    getBlacklistMatchTypeMeta,
    getBlacklistMatchTypeOptions,
    getBlacklistSeverityOptions,
} from '@/constants/securityDicts';
import type { MatchTypeOption } from './blacklistRuleFormTypes';

const MATCH_TYPE_ICONS: Record<string, React.ReactNode> = {
    contains: <SearchOutlined />,
    regex: <BugOutlined />,
    exact: <LockOutlined />,
};

export const getMatchTypeFormOptions = (): MatchTypeOption[] =>
    getBlacklistMatchTypeOptions().map(option => {
        const meta = getBlacklistMatchTypeMeta(option.value);
        return {
            value: option.value as MatchTypeOption['value'],
            label: option.label,
            desc: meta.desc || meta.label,
            icon: MATCH_TYPE_ICONS[option.value] || <SearchOutlined />,
        };
    });

export const getSeverityFormOptions = () => getBlacklistSeverityOptions();
export const getCategoryFormOptions = () => getBlacklistCategoryOptions();

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
