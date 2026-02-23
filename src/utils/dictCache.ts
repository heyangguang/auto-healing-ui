/**
 * 全局字典缓存管理器
 *
 * 设计原则：
 * 1. 后端 API 为唯一真相源（Single Source of Truth）
 * 2. localStorage 仅用于「闪屏兜底」—— API 响应到达前的 ~20ms 显示上次数据
 * 3. 每次页面加载 / Tab 切回 都从 API 刷新
 * 4. 各 constants 文件的硬编码仅在 API + localStorage 都为空时使用
 */

import { getDictionaries, type DictItem } from '@/services/auto-healing/dictionary';

const STORAGE_KEY = 'dict-cache';
const STORAGE_TS_KEY = 'dict-cache-ts';

/** 全局内存缓存 */
let _cache: Record<string, DictItem[]> = {};
let _loaded = false;

/** 刷新回调列表（constants 文件注册） */
const _refreshCallbacks: Array<() => void> = [];

// ==================== 公开 API ====================

/**
 * 获取某个字典类型的所有条目
 */
export function getDictItems(dictType: string): DictItem[] | undefined {
    return _cache[dictType];
}

/**
 * 是否已加载
 */
export function isDictLoaded(): boolean {
    return _loaded;
}

/**
 * 注册刷新回调（constants 文件在 init 时调用）
 */
export function onDictRefresh(callback: () => void) {
    _refreshCallbacks.push(callback);
}

/**
 * 初始化字典缓存（app.tsx 启动时调用）
 *
 * 流程：
 * 1. 从 localStorage 快速恢复（无网络延迟）
 * 2. 触发一次 refresh 回调让 constants 文件更新
 * 3. 后台请求 API 获取最新数据
 * 4. API 回来后覆盖缓存 + 再次触发 refresh
 */
export async function initDictCache(): Promise<void> {
    // Step 1: 从 localStorage 快速恢复
    _restoreFromStorage();
    if (Object.keys(_cache).length > 0) {
        _loaded = true;
        _notifyRefresh();
    }

    // Step 2: 后台请求 API 获取最新数据
    try {
        await _fetchFromAPI();
        _loaded = true;
        _notifyRefresh();
    } catch (err) {
        console.warn('[DictCache] API 加载失败，使用缓存/兜底:', err);
        // 即使 API 失败，如果 localStorage 有数据，也算 loaded
        if (Object.keys(_cache).length > 0) {
            _loaded = true;
        }
    }
}

/**
 * 强制刷新缓存（Tab 切回时调用）
 */
export async function refreshDictCache(): Promise<void> {
    try {
        await _fetchFromAPI();
        _notifyRefresh();
    } catch (err) {
        console.warn('[DictCache] 刷新字典失败:', err);
    }
}

// ==================== 内部工具 ====================

async function _fetchFromAPI() {
    const res = await getDictionaries();
    if (res?.data) {
        _cache = res.data;
        _saveToStorage();
    }
}

function _restoreFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            _cache = JSON.parse(raw);
        }
    } catch {
        // 忽略解析错误
    }
}

function _saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(_cache));
        localStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
    } catch {
        // 忽略存储错误（如 quota 超限）
    }
}

function _notifyRefresh() {
    _refreshCallbacks.forEach(cb => {
        try { cb(); } catch { /* 忽略单个回调错误 */ }
    });
}

// ==================== visibilitychange 监听 ====================

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && _loaded) {
            // Tab 切回时静默刷新
            refreshDictCache();
        }
    });
}

// ==================== 通用转换工具 ====================

/**
 * 将字典条目数组转为 label Map
 */
export function toLabelsMap(items: DictItem[]): Record<string, string> {
    return Object.fromEntries(items.map(i => [i.dict_key, i.label]));
}

/**
 * 将字典条目数组转为 color Map
 */
export function toColorsMap(items: DictItem[]): Record<string, string> {
    return Object.fromEntries(items.map(i => [i.dict_key, i.color || '#8c8c8c']));
}

/**
 * 将字典条目数组转为 { text, color } Map
 */
export function toTextColorMap(items: DictItem[]): Record<string, { text: string; color: string }> {
    return Object.fromEntries(items.map(i => [i.dict_key, {
        text: i.label,
        color: i.tag_color || i.color || 'default',
    }]));
}

/**
 * 将字典条目数组转为 { text, color, tagColor, badge, bg } 完整 Map
 */
export function toFullMap(items: DictItem[]): Record<string, {
    text: string; color: string; tagColor: string; badge: string; bg: string;
}> {
    return Object.fromEntries(items.map(i => [i.dict_key, {
        text: i.label,
        color: i.color || '#8c8c8c',
        tagColor: i.tag_color || 'default',
        badge: i.badge || 'default',
        bg: i.bg || '',
    }]));
}

/**
 * 将字典条目转为 antd Select options
 */
export function toOptions(items: DictItem[]): Array<{ label: string; value: string }> {
    return items.map(i => ({ label: i.label, value: i.dict_key }));
}
