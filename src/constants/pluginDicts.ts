/**
 * 插件（Plugin）相关字典值
 *
 * 数据源：后端 API > localStorage 缓存 > 硬编码兜底
 */
import { getDictItems, onDictRefresh } from '@/utils/dictCache';

// ==================== 硬编码兜底 ====================

const FB_COLORS: Record<string, string> = {
    active: '#52c41a', inactive: '#d9d9d9', error: '#ff4d4f',
};

const FB_LABELS: Record<string, string> = {
    active: '活跃', inactive: '停用', error: '异常',
};

const FB_MAP: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '活跃' },
    inactive: { color: 'default', text: '停用' },
    error: { color: 'error', text: '异常' },
};

// ==================== 动态变量 ====================

export let PLUGIN_STATUS_COLORS: Record<string, string> = { ...FB_COLORS };
export let PLUGIN_STATUS_LABELS: Record<string, string> = { ...FB_LABELS };
export let PLUGIN_STATUS_MAP: Record<string, { color: string; text: string }> = { ...FB_MAP };

// ==================== 刷新逻辑 ====================

function refresh() {
    const items = getDictItems('plugin_status');
    if (items?.length) {
        const colors: Record<string, string> = {};
        const labels: Record<string, string> = {};
        const map: Record<string, any> = {};
        items.forEach(i => {
            colors[i.dict_key] = i.color || '#8c8c8c';
            labels[i.dict_key] = i.label;
            map[i.dict_key] = { color: i.tag_color || 'default', text: i.label };
        });
        PLUGIN_STATUS_COLORS = colors;
        PLUGIN_STATUS_LABELS = labels;
        PLUGIN_STATUS_MAP = map;
    }
}

onDictRefresh(refresh);
refresh();
