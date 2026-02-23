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
  // ==================== 无租户提示页 ====================
  {
    path: '/no-tenant',
    layout: false,
    component: './NoTenant',
  },
  // ==================== 工作台 ====================
  {
    path: '/workbench',
    name: '工作台',
    icon: 'home',
    component: './workbench',
    hideInMenu: true,
  },
  // ==================== 产品指南 ====================
  {
    path: '/guide',
    name: '产品指南',
    component: './guide',
    hideInMenu: true,
  },
  {
    path: '/guide/:id',
    component: './guide',
    hideInMenu: true,
  },
  // ==================== 监控面板 ====================
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'dashboard',
    component: './dashboard/analysis',
    access: 'canViewDashboard',
  },

  // ==================== 资源配置 ====================
  {
    path: '/resources',
    name: 'resources',
    icon: 'database',
    access: 'canViewPlugins',
    routes: [
      {
        path: '/resources',
        redirect: '/resources/cmdb',
      },
      {
        path: '/resources/cmdb',
        name: 'cmdb',
        component: './cmdb',
      },
      {
        path: '/resources/incidents',
        name: 'incidents',
        component: './incidents',
      },
      {
        path: '/resources/secrets',
        name: 'secrets',
        component: './execution/secrets',
      },
      {
        path: '/resources/secrets/create',
        component: './execution/secrets/SecretForm',
        hideInMenu: true,
      },
      {
        path: '/resources/secrets/:id/edit',
        component: './execution/secrets/SecretForm',
        hideInMenu: true,
      },
      {
        path: '/resources/plugins',
        name: 'plugins',
        component: './plugins',
      },
      {
        path: '/resources/plugins/create',
        component: './plugins/PluginForm',
        hideInMenu: true,
      },
      {
        path: '/resources/plugins/:id/edit',
        component: './plugins/PluginForm',
        hideInMenu: true,
      },
    ],
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
        path: '/execution/git-repos/create',
        component: './execution/git-repos/GitRepoForm',
        hideInMenu: true,
      },
      {
        path: '/execution/git-repos/:id/edit',
        component: './execution/git-repos/GitRepoForm',
        hideInMenu: true,
      },
      {
        path: '/execution/playbooks/import',
        component: './execution/playbooks/PlaybookImport',
        hideInMenu: true,
      },
      {
        path: '/execution/playbooks',
        name: 'playbooks',
        component: './execution/playbooks',
      },
      {
        path: '/execution/templates/create',
        component: './execution/templates/TemplateForm',
        hideInMenu: true,
      },
      {
        path: '/execution/templates/:id/edit',
        component: './execution/templates/TemplateForm',
        hideInMenu: true,
      },
      {
        path: '/execution/templates',
        name: 'templates',
        component: './execution/templates',
      },
      {
        path: '/execution/templates/:id',
        component: './execution/templates/detail',
        hideInMenu: true,
      },
      {
        path: '/execution/execute',
        name: 'execute',
        component: './execution/execute',
      },
      {
        path: '/execution/schedules/create',
        component: './execution/schedules/ScheduleForm',
        hideInMenu: true,
      },
      {
        path: '/execution/schedules/:id/edit',
        component: './execution/schedules/ScheduleForm',
        hideInMenu: true,
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
  // ==================== 待办审批 ====================
  {
    path: '/pending',
    name: '待办审批',
    icon: 'carryOut',
    access: 'canViewApprovals',
    routes: [
      {
        path: '/pending',
        redirect: '/pending/triggers',
      },
      {
        path: '/pending/triggers',
        name: '自愈审批',
        component: './pending-center/triggers',
      },
      {
        path: '/pending/approvals',
        name: '任务审批',
        component: './pending-center/approvals',
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
        path: '/notification/channels/create',
        component: './notification/channels/ChannelForm',
        hideInMenu: true,
      },
      {
        path: '/notification/channels/:id/edit',
        component: './notification/channels/ChannelForm',
        hideInMenu: true,
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
        path: '/healing/rules/create',
        component: './healing/rules/RuleForm',
        hideInMenu: true,
      },
      {
        path: '/healing/rules/:id/edit',
        component: './healing/rules/RuleForm',
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


  // ==================== 平台功能 (Platform Features) 🆕 ====================
  // ⚠️  重要：新增或删除平台路由后，必须同步更新 src/config/menu.tsx 中的 platform 数组，
  //    否则全站导航（顶部"产品与服务"弹窗）不会显示新菜单项！
  {
    path: '/platform',
    name: 'platform',
    icon: 'cluster',
    access: 'isPlatformAdmin',
    routes: [
      {
        path: '/platform',
        redirect: '/platform/tenants',
      },
      {
        path: '/platform/tenants',
        name: 'tenants',
        component: './platform/tenants',
      },
      {
        path: '/platform/tenants/create',
        component: './platform/tenants/TenantForm',
        hideInMenu: true,
      },
      {
        path: '/platform/tenants/:id/edit',
        component: './platform/tenants/TenantForm',
        hideInMenu: true,
      },
      {
        path: '/platform/tenants/:id/members',
        component: './platform/tenants/TenantMembers',
        hideInMenu: true,
      },

      {
        path: '/platform/users',
        name: 'platformUsers',
        component: './platform/users',
      },
      {
        path: '/platform/users/create',
        component: './platform/users/UserForm',
        hideInMenu: true,
      },
      {
        path: '/platform/users/:id/edit',
        component: './platform/users/UserForm',
        hideInMenu: true,
      },

      {
        path: '/platform/roles',
        name: 'platformRoles',
        component: './platform/roles',
      },

      {
        path: '/platform/messages',
        name: 'platformMessages',
        component: './platform/messages', // 平台消息发送页面
      },
      {
        path: '/platform/settings',
        name: 'platformSettings',
        component: './platform/settings',
      },
      {
        path: '/platform/audit-logs',
        name: 'platformAuditLogs',
        component: './platform/audit-logs',
      },
    ],
  },
  // ==================== 系统管理 (租户级) ====================
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
        path: '/system/users/create',
        component: './system/users/UserForm',
        hideInMenu: true,
      },
      {
        path: '/system/users/:id/edit',
        component: './system/users/UserForm',
        hideInMenu: true,
      },
      {
        path: '/system/roles',
        name: 'roles',
        component: './system/roles',
      },
      {
        path: '/system/roles/create',
        component: './system/roles/RoleForm',
        hideInMenu: true,
      },
      {
        path: '/system/roles/:id/edit',
        component: './system/roles/RoleForm',
        hideInMenu: true,
      },
      {
        path: '/system/permissions',
        name: 'permissions',
        component: './system/permissions',
        access: 'canViewPlatformPermissions',
      },

      {
        path: '/system/audit-logs',
        name: 'audit-logs',
        component: './system/audit-logs',
      },
      {
        path: '/system/messages',
        name: 'messages',
        component: './system/messages',
        access: 'canViewSiteMessages',
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
    redirect: '/workbench',
  },
  {
    component: '404',
    path: '/*',
  },
];
