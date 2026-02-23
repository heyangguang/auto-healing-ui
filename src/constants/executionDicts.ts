/**
 * 执行管理相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

export interface ExecutorTypeConfig {
    label: string;
    color: string;
}

const FB_EXECUTOR: Record<string, ExecutorTypeConfig> = {
    local: { label: '本地', color: '#52c41a' },
    docker: { label: 'Docker', color: '#1677ff' },
    ssh: { label: 'SSH', color: '#722ed1' },
};

const FB_RUN_COLORS: Record<string, string> = {
    success: '#52c41a', failed: '#ff4d4f', running: '#1677ff',
    partial: '#faad14', cancelled: '#d9d9d9',
};

const FB_RUN_LABELS: Record<string, string> = {
    success: '成功', failed: '失败', running: '运行中',
    partial: '部分成功', cancelled: '已取消',
};

const FB_RUN_MAP: Record<string, { color: string; text: string }> = {
    success: { color: 'success', text: '成功' },
    failed: { color: 'error', text: '失败' },
    running: { color: 'processing', text: '运行中' },
    partial: { color: 'warning', text: '部分成功' },
    cancelled: { color: 'default', text: '取消' },
};

// ==================== 动态变量 ====================

export let EXECUTOR_TYPE_CONFIG: Record<string, ExecutorTypeConfig> = { ...FB_EXECUTOR };
export let RUN_STATUS_COLORS: Record<string, string> = { ...FB_RUN_COLORS };
export let RUN_STATUS_LABELS: Record<string, string> = { ...FB_RUN_LABELS };
export let RUN_STATUS_MAP: Record<string, { color: string; text: string }> = { ...FB_RUN_MAP };

/**
 * 获取执行器类型配置（带后备值）
 */
export function getExecutorConfig(type: string): ExecutorTypeConfig {
    return EXECUTOR_TYPE_CONFIG[type] || { label: type || '未知', color: '#8c8c8c' };
}

// ==================== 刷新逻辑 ====================

function refresh() {
    const executor = getDictItems('executor_type');
    if (executor?.length) {
        const map: Record<string, ExecutorTypeConfig> = {};
        executor.forEach(i => { map[i.dict_key] = { label: i.label, color: i.color || '#8c8c8c' }; });
        EXECUTOR_TYPE_CONFIG = { ...FB_EXECUTOR, ...map };
    }

    const run = getDictItems('run_status');
    if (run?.length) {
        const colors: Record<string, string> = {};
        const labels: Record<string, string> = {};
        const map: Record<string, any> = {};
        run.forEach(i => {
            colors[i.dict_key] = i.color || '#8c8c8c';
            labels[i.dict_key] = i.label;
            map[i.dict_key] = { color: i.tag_color || 'default', text: i.label };
        });
        RUN_STATUS_COLORS = { ...FB_RUN_COLORS, ...colors };
        RUN_STATUS_LABELS = { ...FB_RUN_LABELS, ...labels };
        RUN_STATUS_MAP = { ...FB_RUN_MAP, ...map };
    }
}

onDictRefresh(refresh);
refresh();

/* ========== Select Options 辅助 ========== */

/** 运行状态下拉选项 */
export function getRunStatusOptions() {
    return Object.entries(RUN_STATUS_LABELS).map(([value, label]) => ({ label, value }));
}
