import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import { getCurrentUser } from '@/services/auto-healing/auth';
import defaultSettings from '../config/defaultSettings';
import { errorConfig, TokenManager } from './requestErrorConfig';

import TopNavBar from '@/components/TopNavBar';
import AppLayout from '@/components/AppLayout';

// 本地字体引入（不依赖 Google CDN）
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';

import { initDictCache } from '@/utils/dictCache';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  // 注意: 字典缓存初始化延迟到确认用户身份后执行（平台管理员不需要）

  const fetchUserInfo = async () => {
    try {
      // 检查是否有 token
      const token = TokenManager.getToken();
      if (!token) {
        return undefined;
      }

      const response = await getCurrentUser({ skipErrorHandler: true });
      // 后端返回格式: { code: 0, message: "success", data: { id, username, ... } }
      // 需要从 response.data 获取用户信息
      const userInfo = (response as any).data || response;

      // 需要同时设置 name 和 username，AvatarDropdown 会检查这两个字段
      const currentUserObj = {
        userid: userInfo.id,
        name: userInfo.display_name || userInfo.username,
        username: userInfo.username,
        display_name: userInfo.display_name,
        avatar: undefined,
        access: userInfo.roles?.[0] || 'user',
        permissions: userInfo.permissions || [],
        ...userInfo,
      } as API.CurrentUser;

      // 🆕 同步平台管理员标志到 localStorage（供 request interceptor 使用）
      localStorage.setItem('is-platform-admin', currentUserObj.is_platform_admin ? 'true' : 'false');

      return currentUserObj;
    } catch (_error) {
      TokenManager.clearTokens();
      history.push(loginPath);
    }
    return undefined;
  };

  const { location } = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();

    // 🆕 仅非平台管理员初始化字典缓存（字典API需要租户上下文）
    if (currentUser && !currentUser.is_platform_admin) {
      initDictCache().catch(err => console.warn('[App] 字典初始化失败:', err));
    }

    // 🆕 平台管理员 + 非平台页面 + 非 Impersonation → 立即重定向（在渲染前！）
    if (currentUser?.is_platform_admin) {
      const isPlatformPage = location.pathname.startsWith('/platform/') ||
        location.pathname.startsWith('/user/') ||
        location.pathname.startsWith('/account/') ||
        location.pathname.startsWith('/guide');

      let isImpersonating = false;
      try {
        const impRaw = localStorage.getItem('impersonation-storage');
        if (impRaw) {
          const imp = JSON.parse(impRaw);
          if (imp?.isImpersonating && imp?.session?.expiresAt) {
            isImpersonating = new Date(imp.session.expiresAt) > new Date();
            if (!isImpersonating) localStorage.removeItem('impersonation-storage');
          }
        }
      } catch { /* ignore */ }

      if (!isPlatformPage && !isImpersonating) {
        // 🆕 使用 window.location.href 而非 history.push
        // getInitialState 阶段 history 可能未完全就绪，history.push 不一定生效
        window.location.href = '/platform/tenant-overview';
        return {
          fetchUserInfo,
          currentUser,
          settings: defaultSettings as Partial<LayoutSettings>,
        };
      }
    }

    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的 api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    // 禁用 ProLayout 默认 Header，使用自定义 TopNavBar
    headerRender: () => <TopNavBar />,
    // 禁用 ProLayout 默认的侧边菜单（由 SideNav 组件管理）
    menuRender: false,
    // 禁用面包屑（使用自定义导航，不需要 ProLayout 面包屑）
    breadcrumbRender: false,
    // 禁用默认 Footer（在 AppLayout 中管理）
    footerRender: false,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
        return;
      }

      // 🆕 平台管理员路由守卫：
      // 未在 Impersonation 模式下访问租户级页面 → 重定向到平台管理页
      if (initialState?.currentUser?.is_platform_admin) {
        const isPlatformPage = location.pathname.startsWith('/platform/') ||
          location.pathname === '/user/login' ||
          location.pathname.startsWith('/user/') ||
          location.pathname.startsWith('/account/') ||
          location.pathname === '/guide' ||
          location.pathname.startsWith('/guide');

        // 检查是否在 Impersonation 模式
        const impersonationRaw = localStorage.getItem('impersonation-storage');
        let isImpersonating = false;
        if (impersonationRaw) {
          try {
            const imp = JSON.parse(impersonationRaw);
            if (imp?.isImpersonating && imp?.session?.expiresAt) {
              isImpersonating = new Date(imp.session.expiresAt) > new Date();
              if (!isImpersonating) localStorage.removeItem('impersonation-storage');
            }
          } catch { /* ignore */ }
        }

        if (!isPlatformPage && !isImpersonating) {
          console.log('[App] 平台管理员访问租户页面，重定向到平台管理');
          history.push('/platform/tenant-overview');
        }
      }
    },
    menuHeaderRender: false,
    childrenRender: (children) => {
      return (
        <>
          <AppLayout>
            {children}
          </AppLayout>
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // 不设置 baseURL，由 proxy 处理 /api/ 请求转发
  ...errorConfig,
};
