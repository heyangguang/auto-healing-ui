/**
 * @name umi 的路由配置
 * @description 运维自愈系统路由配置
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user/login',
        layout: false,
        name: 'login',
        component: './user/login',
      },
      {
        path: '/user',
        redirect: '/user/login',
      },
      {
        component: '404',
        path: '/user/*',
      },
    ],
  },
  // ==================== 仪表板 ====================
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './dashboard/analysis',
  },
  // ==================== 插件管理 ====================
  {
    path: '/plugins',
    name: 'plugins',
    icon: 'api',
    component: './plugins',
    access: 'canViewPlugins',
  },
  {
    path: '/plugins/:id',
    component: './plugins/detail',
    hideInMenu: true,
    access: 'canViewPlugins',
  },
  // ==================== 待办中心 ====================
  {
    path: '/pending-center',
    name: '待办中心',
    icon: 'carryOut',
    component: './pending-center',
    access: 'canViewApprovals',
  },
  // ==================== ITSM 工单 ====================
  {
    path: '/incidents',
    name: 'ITSM 工单',
    icon: 'warning',
    component: './incidents',
    access: 'canViewPlugins',
  },
  // ==================== CMDB ====================
  {
    path: '/cmdb',
    name: '资产管理',
    icon: 'database',
    component: './cmdb',
    access: 'canViewPlugins',
  },
  // ==================== 密钥管理 ====================
  {
    path: '/secrets',
    name: '密钥管理',
    icon: 'key',
    component: './execution/secrets',
    access: 'canViewPlugins',
  },
  // ==================== 执行模块 ====================
  {
    path: '/execution',
    name: 'execution',
    icon: 'thunderbolt',
    access: 'canViewTasks',
    routes: [
      {
        path: '/execution',
        redirect: '/execution/git-repos',
      },
      {
        path: '/execution/git-repos',
        name: 'git-repos',
        component: './execution/git-repos',
      },
      {
        path: '/execution/git-repos/:id',
        component: './execution/git-repos/detail',
        hideInMenu: true,
      },
      {
        path: '/execution/playbooks',
        name: 'playbooks',
        component: './execution/playbooks',
      },
      {
        path: '/execution/templates',
        name: 'templates',
        component: './execution/templates',
      },
      {
        path: '/execution/execute',
        name: 'execute',
        component: './execution/execute',
      },
      {
        path: '/execution/schedules',
        name: 'schedules',
        component: './execution/schedules',
      },
      {
        path: '/execution/logs',
        name: 'logs',
        component: './execution/logs',
      },
      {
        path: '/execution/runs',
        component: './execution/runs',
        hideInMenu: true,
      },
      {
        path: '/execution/runs/:id',
        component: './execution/runs/detail',
        hideInMenu: true,
      },
    ],
  },
  // ==================== 通知模块 ====================
  {
    path: '/notification',
    name: 'notification',
    icon: 'bell',
    access: 'canViewChannels',
    routes: [
      {
        path: '/notification',
        redirect: '/notification/channels',
      },
      {
        path: '/notification/channels',
        name: 'channels',
        component: './notification/channels',
      },
      {
        path: '/notification/templates',
        name: 'templates',
        component: './notification/templates',
      },
      {
        path: '/notification/templates/:id',
        component: './notification/templates/edit',
        hideInMenu: true,
      },
      {
        path: '/notification/records',
        name: 'records',
        component: './notification/records',
      },
    ],
  },
  // ==================== 自愈引擎 ====================
  {
    path: '/healing',
    name: 'healing',
    icon: 'tool',
    access: 'canViewFlows',
    routes: [
      {
        path: '/healing',
        redirect: '/healing/flows',
      },
      {
        path: '/healing/flows',
        name: 'flows',
        component: './healing/flows',
      },
      {
        path: '/healing/flows/editor',
        name: 'editor',
        component: './healing/flows/editor',
        hideInMenu: true,
      },
      {
        path: '/healing/flows/editor/:id',
        component: './healing/flows/editor',
        hideInMenu: true,
      },
      {
        path: '/healing/rules',
        name: 'rules',
        component: './healing/rules',
      },
      {
        path: '/healing/instances',
        name: 'instances',
        component: './healing/instances',
      },
      {
        path: '/healing/instances/:id',
        component: './healing/instances/detail',
        hideInMenu: true,
      },
    ],
  },
  // ==================== 系统管理 ====================
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    access: 'canViewUsers',
    routes: [
      {
        path: '/system',
        redirect: '/system/users',
      },
      {
        path: '/system/users',
        name: 'users',
        component: './system/users',
      },
      {
        path: '/system/roles',
        name: 'roles',
        component: './system/roles',
      },
      {
        path: '/system/permissions',
        name: 'permissions',
        component: './system/permissions',
      },
    ],
  },
  // ==================== 个人中心 ====================
  {
    path: '/account',
    name: 'account',
    icon: 'user',
    hideInMenu: true,
    routes: [
      {
        path: '/account',
        redirect: '/account/profile',
      },
      {
        path: '/account/profile',
        name: 'profile',
        component: './account/profile',
      },
    ],
  },
  // ==================== 默认重定向 ====================
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    component: '404',
    path: '/*',
  },
];
