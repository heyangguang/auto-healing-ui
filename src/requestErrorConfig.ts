import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history, request } from '@umijs/max';
import { message, notification } from 'antd';

const loginPath = '/user/login';

// Token 存储 key
const TOKEN_KEY = 'auto_healing_token';
const REFRESH_TOKEN_KEY = 'auto_healing_refresh_token';
const REMEMBER_KEY = 'auto_healing_remember';

// 获取当前存储引擎：记住登录 → localStorage，否则 → sessionStorage
const getStorage = (): Storage => {
  return localStorage.getItem(REMEMBER_KEY) === 'true' ? localStorage : sessionStorage;
};

// Token 管理工具
export const TokenManager = {
  getToken: () => getStorage().getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => getStorage().getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    const storage = getStorage();
    storage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    cachedTokenExpiry = null; // 清除缓存，强制重新解析
  },
  clearTokens: () => {
    // 清除两个存储中的 token + 记住登录偏好
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    cachedTokenExpiry = null;
  },
  // 设置"记住登录"偏好
  setRememberMe: (remember: boolean) => {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  },
  getRememberMe: () => localStorage.getItem(REMEMBER_KEY) === 'true',
};

// ==================== 主动刷新 Token 机制 ====================

// 解析 JWT 获取过期时间
const parseJwtExpiry = (token: string): number | null => {
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp ? payload.exp * 1000 : null; // 转换为毫秒
  } catch {
    return null;
  }
};

// 缓存 JWT 过期时间，避免每次请求重复解析
let cachedTokenExpiry: { token: string; expiry: number | null } | null = null;

// 检查 token 是否即将过期（提前 5 分钟刷新）
const isTokenExpiringSoon = (token: string): boolean => {
  let expiry: number | null;
  if (cachedTokenExpiry && cachedTokenExpiry.token === token) {
    expiry = cachedTokenExpiry.expiry;
  } else {
    expiry = parseJwtExpiry(token);
    cachedTokenExpiry = { token, expiry };
  }
  if (!expiry) return true;
  const bufferTime = 5 * 60 * 1000; // 5 分钟
  return Date.now() >= expiry - bufferTime;
};

// 刷新 token 状态管理
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// 刷新 token
const doRefreshToken = async (): Promise<string | null> => {
  const refreshTokenValue = TokenManager.getRefreshToken();
  if (!refreshTokenValue) {
    return null;
  }

  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshTokenValue }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      TokenManager.setTokens(data.access_token, data.refresh_token);
      console.log('[Auth] Token 已自动刷新');

      // 🆕 更新租户信息：只更新列表，保留用户当前选择的租户
      if (data.tenants) {
        const existingRaw = localStorage.getItem('tenant-storage');
        let preservedTenantId = data.current_tenant_id; // 默认使用后端返回的
        if (existingRaw) {
          try {
            const existing = JSON.parse(existingRaw);
            // 如果用户当前选择的租户在新列表中仍然存在，则保留
            if (existing.currentTenantId && data.tenants.some((t: any) => t.id === existing.currentTenantId)) {
              preservedTenantId = existing.currentTenantId;
            }
          } catch { /* ignore */ }
        }
        const tenantStorage = {
          currentTenantId: preservedTenantId,
          tenants: data.tenants,
        };
        localStorage.setItem('tenant-storage', JSON.stringify(tenantStorage));
        console.log('[Auth] 租户列表已更新，当前租户:', preservedTenantId);
      }

      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
};

// 确保同一时间只有一个刷新请求
const refreshToken = async (): Promise<string | null> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = doRefreshToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
};

// 主动检查并刷新 token（在每次请求前调用）
const ensureFreshToken = async (): Promise<string | null> => {
  const token = TokenManager.getToken();
  if (!token) return null;

  // 如果 token 即将过期，主动刷新
  if (isTokenExpiringSoon(token)) {
    console.log('[Auth] Token 即将过期，主动刷新...');
    const newToken = await refreshToken();
    return newToken || token;
  }

  return token;
};

// ==================== 错误处理配置 ====================

enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

interface ResponseStructure {
  success?: boolean;
  data?: any;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType, error } =
        res as unknown as ResponseStructure;
      if (!success && error) {
        const err: any = new Error(error.message || errorMessage);
        err.name = 'BizError';
        err.info = { errorCode: error.code || errorCode, errorMessage: error.message || errorMessage, showType, data };
        throw err;
      }
    },
    errorHandler: async (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode as any,
              });
              break;
            case ErrorShowType.REDIRECT:
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // 🆕 处理租户权限错误 (40300)
        if (data?.code === 40300) {
          const errorMsg = data?.message || '无权访问该租户';

          // 平台管理员 Impersonation 相关错误 → 静默处理（路由守卫会重定向）
          if (errorMsg.includes('Impersonation')) {
            console.log('[Request] 平台管理员未 Impersonation，已由路由守卫处理');
            return;
          }

          message.error(errorMsg);

          // 如果用户未分配任何租户,跳转到提示页
          if (errorMsg.includes('未分配任何租户')) {
            // 清除租户信息
            localStorage.removeItem('tenant-storage');
            history.push('/no-tenant');
          }
          return;
        }

        // 401 未授权 - 尝试刷新 token 并重试
        if (status === 401) {
          const url = error.config?.url || '';
          if (history.location.pathname === loginPath || url.includes('/auth/')) {
            TokenManager.clearTokens();
            return;
          }

          // 尝试刷新 token
          const newToken = await refreshToken();
          if (newToken) {
            // 用新 token 重试请求
            error.config.headers['Authorization'] = `Bearer ${newToken}`;
            return request(error.config.url, error.config);
          } else {
            // 刷新失败，跳转登录
            TokenManager.clearTokens();
            message.error('登录已过期，请重新登录');
            history.push(loginPath);
          }
          return;
        }

        if (status === 403) {
          // 静默处理：权限不足由路由 access 和 UI 按钮 disabled 状态处理
          // 避免工作台多个 API 同时 403 导致满屏弹窗
          console.warn('[403] 没有权限访问:', error.config?.url);
          return;
        }

        // 后端错误响应有两种格式：
        // 1. {error: {code: "...", message: "..."}} — response.Error() 标准格式
        // 2. {error: "错误信息"}                     — gin.H{} 简单格式
        // 3. {message: "错误信息"}                   — 部分旧接口
        const rawError = data?.error;
        const errorMsg = (typeof rawError === 'string' ? rawError : rawError?.message)
          || data?.message
          || `请求失败 (${status})`;
        message.error(errorMsg);
      } else if (error.request) {
        message.error('网络连接失败，请检查网络');
      } else {
        message.error('请求发生错误，请稍后重试');
      }
      return;
    },
  },

  // 请求拦截器 - 注入 JWT Token、X-Tenant-ID,并主动检查刷新
  requestInterceptors: [
    async (config: RequestOptions) => {
      // 跳过认证相关接口
      const url = config.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return config;
      }

      // 主动检查并刷新 token（轮询请求跳过刷新，避免后台请求续期）
      let token: string | null;
      if ((config as any).skipTokenRefresh) {
        token = TokenManager.getToken();
      } else {
        token = await ensureFreshToken();
      }
      const headers = config.headers || {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 🆕 注入 X-Tenant-ID (仅 /api/v1/tenant/* 路由需要租户上下文)
      // 新路由结构：public/auth/common/platform 组均不需要 X-Tenant-ID
      const needsTenantContext = url.startsWith('/api/v1/tenant/');

      // 🆕 检查 Impersonation 状态
      const impersonationRaw = localStorage.getItem('impersonation-storage');
      let isImpersonating = false;
      let impersonationSession: { requestId: string; tenantId: string; expiresAt: string } | null = null;

      if (impersonationRaw) {
        try {
          const parsed = JSON.parse(impersonationRaw);
          if (parsed.isImpersonating && parsed.session) {
            // 检查会话是否过期
            if (new Date(parsed.session.expiresAt) > new Date()) {
              isImpersonating = true;
              impersonationSession = parsed.session;
            }
          }
        } catch { /* ignore */ }
      }

      // 🆕 检查是否为平台管理员（从 localStorage 读取标志）
      const isPlatformAdmin = localStorage.getItem('is-platform-admin') === 'true';

      if (isImpersonating && impersonationSession && needsTenantContext) {
        // Impersonation 模式：使用申请单指定的租户 ID + Impersonation 请求头
        headers['X-Tenant-ID'] = impersonationSession.tenantId;
        headers['X-Impersonation'] = 'true';
        headers['X-Impersonation-Request-ID'] = impersonationSession.requestId;
      } else if (needsTenantContext && !isPlatformAdmin) {
        // 普通用户模式：从 localStorage 读取当前租户 ID
        // 注意：平台管理员未 Impersonation 时不注入 X-Tenant-ID
        const tenantStorage = localStorage.getItem('tenant-storage');
        if (tenantStorage) {
          try {
            const { currentTenantId } = JSON.parse(tenantStorage);
            if (currentTenantId) {
              headers['X-Tenant-ID'] = currentTenantId;
            }
          } catch (error) {
            console.error('[Request] 解析租户信息失败:', error);
          }
        }
      }

      return { ...config, headers };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // 🆕 检测后端 X-Refresh-Token 信号：JWT 中的 tenant_ids 已过时，需要刷新
      // 场景：管理员将用户添加到新租户后，用户的旧 JWT 不包含该租户，
      //       后端回退到数据库查询确认有权限后，通知前端刷新 token 以更新缓存
      const shouldRefresh = response.headers?.['x-refresh-token'];
      if (shouldRefresh === 'true') {
        console.log('[Auth] 收到 X-Refresh-Token 信号，后台刷新 Token 更新租户缓存...');
        // 异步刷新，不阻塞当前响应
        refreshToken().catch(() => {
          console.warn('[Auth] 后台刷新 Token 失败，下次请求将重试');
        });
      }
      return response;
    },
  ],
};
