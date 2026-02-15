import type { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name 布局配置
 * @description 使用 top 布局模式，顶部导航由 TopNavBar 自定义渲染
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // IBM Blue
  colorPrimary: '#0f62fe',
  layout: 'top',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: false,
  colorWeak: false,
  title: 'Auto Healing',
  pwa: true,
  logo: '/logo.svg',
  iconfontUrl: '',
  token: {
    header: {
      colorBgHeader: '#001529',
      colorHeaderTitle: '#fff',
      heightLayoutHeader: 48,
    },
    sider: {
      colorMenuBackground: '#fff',
    },
  },
};

export default Settings;
