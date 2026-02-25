import { request } from '@umijs/max';

/* ──── 类型定义 ──── */
export interface FavoriteItem {
    id: string;
    user_id: string;
    menu_key: string;
    name: string;
    path: string;
    created_at: string;
}

export interface RecentItem {
    id: string;
    user_id: string;
    menu_key: string;
    name: string;
    path: string;
    accessed_at: string;
}

/* ──── 收藏 API ──── */

/** 获取收藏列表 */
export async function getFavorites() {
    return request<{ code: number; message: string; data: FavoriteItem[] }>(
        '/api/v1/common/user/favorites',
        { method: 'GET' },
    );
}

/** 添加收藏 */
export async function addFavorite(params: { menu_key: string; name: string; path: string }) {
    return request<{ code: number; message: string; data: FavoriteItem }>(
        '/api/v1/common/user/favorites',
        { method: 'POST', data: params },
    );
}

/** 取消收藏 */
export async function removeFavorite(menuKey: string) {
    return request<void>(`/api/v1/common/user/favorites/${menuKey}`, {
        method: 'DELETE',
    });
}

/* ──── 最近访问 API ──── */

/** 获取最近访问 */
export async function getRecents() {
    return request<{ code: number; message: string; data: RecentItem[] }>(
        '/api/v1/common/user/recents',
        { method: 'GET' },
    );
}

/** 记录最近访问 */
export async function recordRecent(params: { menu_key: string; name: string; path: string }) {
    return request<{ code: number; message: string }>(
        '/api/v1/common/user/recents',
        { method: 'POST', data: params },
    );
}
