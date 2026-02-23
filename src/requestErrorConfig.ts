import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history, request } from '@umijs/max';
import { message, notification } from 'antd';

const loginPath = '/user/login';

// Token 存储 key
const TOKEN_KEY = 'auto_healing_token';
const REFRESH_TOKEN_KEY = 'auto_healing_refresh_token';

// Token 管理工具
export const TokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    cachedTokenExpiry = null; // 清除缓存，强制重新解析
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    cachedTokenExpiry = null;
  },
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

      // 🆕 更新租户信息
      if (data.tenants && data.current_tenant_id) {
        const tenantStorage = {
          currentTenantId: data.current_tenant_id,
          tenants: data.tenants,
        };
        localStorage.setItem('tenant-storage', JSON.stringify(tenantStorage));
        console.log('[Auth] 租户信息已更新');
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

        const errorMsg = data?.error?.message || data?.message || `请求失败 (${status})`;
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

      // 主动检查并刷新 token
      const token = await ensureFreshToken();
      const headers = config.headers || {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // 🆕 注入 X-Tenant-ID (排除平台级 API 和认证 API)
      const isPlatformAPI = url.startsWith('/api/v1/platform/') ||
        url.startsWith('/auth/');

      if (!isPlatformAPI) {
        // 从 localStorage 读取当前租户 ID
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
      return response;
    },
  ],
};
