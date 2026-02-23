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
  // 并行初始化字典缓存（不阻塞页面渲染）
  initDictCache().catch(err => console.warn('[App] 字典初始化失败:', err));

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
      return {
        userid: userInfo.id,
        name: userInfo.display_name || userInfo.username,
        username: userInfo.username,
        display_name: userInfo.display_name,
        avatar: undefined,
        access: userInfo.roles?.[0] || 'user',
        permissions: userInfo.permissions || [],
        ...userInfo,
      } as API.CurrentUser;
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
    // 禁用默认 Footer（在 AppLayout 中管理）
    footerRender: false,
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
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
