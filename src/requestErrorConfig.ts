import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { history, request } from '@umijs/max';
import { message, notification } from 'antd';
import { getTenantContextHeaders } from '@/utils/tenantContext';
import {
  __TEST_ONLY__ as REQUEST_AUTH_TEST_ONLY,
  ensureFreshToken,
  getResponseHeaderValue,
  refreshToken,
  TokenManager,
} from '@/utils/requestAuth';

const loginPath = '/user/login';
const LOGIN_EXPIRED_MESSAGE = '登录已过期，请重新登录';

type RequestOptionsWithFlags = RequestOptions & {
  authRetryAttempted?: boolean;
  skipTokenRefresh?: boolean;
  suppressForbiddenError?: boolean;
};
type ErrorPayload = {
  code?: string | number;
  message?: string;
  details?: string;
};
type ResponseStructure = {
  success?: boolean;
  data?: unknown;
  message?: string;
  error?: ErrorPayload;
  errorCode?: string | number;
  errorMessage?: string;
  showType?: ErrorShowType;
};
type BizError = Error & {
  info?: {
    errorCode?: string | number;
    errorMessage?: string;
    showType?: ErrorShowType;
    data?: unknown;
  };
};
type RequestErrorResponse = {
  status?: number;
  data?: {
    code?: number;
    message?: string;
    error?: string | ErrorPayload;
  };
};
type ErrorWithRequestContext = Error & {
  response?: RequestErrorResponse;
  request?: unknown;
  config?: RequestOptionsWithFlags & { url?: string; headers?: Record<string, string> };
  info?: BizError['info'];
};

// ==================== 错误处理配置 ====================

export enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

export const errorConfig: RequestConfig = {
  errorConfig: {
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType, error } =
        res as unknown as ResponseStructure;
      if (!success && error) {
        const err = new Error(error.message || errorMessage) as BizError;
        err.name = 'BizError';
        err.info = { errorCode: error.code || errorCode, errorMessage: error.message || errorMessage, showType, data };
        throw err;
      }
    },
    errorHandler: async (error: unknown, opts: { skipErrorHandler?: boolean } | undefined) => {
      if (opts?.skipErrorHandler) throw error;
      const requestError = error as ErrorWithRequestContext;

      if (requestError.name === 'BizError') {
        const errorInfo = requestError.info;
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
                message: String(errorCode ?? '错误'),
              });
              break;
            case ErrorShowType.REDIRECT:
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (requestError.response) {
        const status = requestError.response.status;
        const data = requestError.response.data;

        if (data?.code === 40300) {
          const errorMsg = data?.message || '无权访问该租户';
          if (errorMsg.includes('Impersonation')) {
            return;
          }

          message.error(errorMsg);
          if (errorMsg.includes('未分配任何租户')) {
            localStorage.removeItem('tenant-storage');
            history.push('/no-tenant');
          }
          return;
        }

        if (status === 401) {
          const url = requestError.config?.url || '';
          if (history.location.pathname === loginPath || url.includes('/auth/')) {
            TokenManager.clearTokens();
            return;
          }

          if (requestError.config?.authRetryAttempted) {
            TokenManager.clearTokens();
            message.error(LOGIN_EXPIRED_MESSAGE);
            history.push(loginPath);
            return;
          }

          const newToken = await refreshToken();
          if (newToken && requestError.config?.url) {
            const retryConfig: RequestOptionsWithFlags = {
              ...requestError.config,
              authRetryAttempted: true,
              headers: {
                ...(requestError.config.headers || {}),
                Authorization: `Bearer ${newToken}`,
              },
              skipTokenRefresh: true,
            };
            return request(requestError.config.url, retryConfig);
          }
          TokenManager.clearTokens();
          message.error(LOGIN_EXPIRED_MESSAGE);
          history.push(loginPath);
          return;
        }

        if (status === 403) {
          if (requestError.config?.suppressForbiddenError) {
            console.warn('[403] Suppressed forbidden response:', requestError.config?.url);
            return;
          }

          const rawError = data?.error;
          const errorMsg = (typeof rawError === 'string' ? rawError : rawError?.message)
            || data?.message
            || '没有权限访问该资源';
          message.error(errorMsg);
          return;
        }

        const rawError = data?.error;
        const errorMsg = (typeof rawError === 'string' ? rawError : rawError?.message)
          || data?.message
          || `请求失败 (${status})`;
        message.error(errorMsg);
      } else if (requestError.request) {
        message.error('网络连接失败，请检查网络');
      } else {
        message.error('请求发生错误，请稍后重试');
      }
      return;
    },
  },

  requestInterceptors: [
    async (config: RequestOptions) => {
      const url = config.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh')) {
        return config;
      }

      let token: string | null;
      if ((config as RequestOptionsWithFlags).skipTokenRefresh) {
        token = TokenManager.getToken();
      } else {
        token = await ensureFreshToken();
      }
      const headers = config.headers || {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const isPlatformAdmin = localStorage.getItem('is-platform-admin') === 'true';
      Object.assign(headers, getTenantContextHeaders(url, isPlatformAdmin));

      return { ...config, headers };
    },
  ],

  responseInterceptors: [
    (response) => {
      const shouldRefresh = getResponseHeaderValue(response.headers, 'X-Refresh-Token');
      if (shouldRefresh === 'true') {
        refreshToken().catch(() => {
          /* noop */
        });
      }
      return response;
    },
  ],
};

export { TokenManager } from '@/utils/requestAuth';

export const __TEST_ONLY__ = {
  LOGIN_EXPIRED_MESSAGE,
  ...REQUEST_AUTH_TEST_ONLY,
};
