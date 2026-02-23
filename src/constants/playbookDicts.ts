/**
 * Playbook 相关字典值
 *
 * 将 playbooks/index.tsx 中重复出现的 options 集中管理
 */

// ==================== Playbook 状态选项 ====================
export const PLAYBOOK_STATUS_OPTIONS = [
    { label: '就绪', value: 'ready' },
    { label: '待处理', value: 'pending' },
    { label: '已扫描', value: 'scanned' },
    { label: '错误', value: 'error' },
];

// ==================== 扫描模式选项 ====================
export const SCAN_MODE_OPTIONS = [
    { label: '自动模式', value: 'auto' },
    { label: '增强模式', value: 'enhanced' },
];

// ==================== 布尔筛选选项 ====================
export const HAS_VARIABLES_OPTIONS = [
    { label: '有变量', value: 'true' },
    { label: '无变量', value: 'false' },
];

export const HAS_REQUIRED_VARS_OPTIONS = [
    { label: '有必填变量', value: 'true' },
    { label: '无必填变量', value: 'false' },
];
