/**
 * 全站路由 & 导航 唯一配置文件
 *
 * ✅ 新增 / 修改 / 删除菜单只需编辑本文件，全局自动生效
 *    （TopNavBar、左侧 SideNav、"产品与服务"弹窗、全局搜索 全部自动读取此处配置）
 *
 * 导航元数据字段说明：
 *   - categoryId:    分类标识（父路由上定义，如 'assets'、'execution'）
 *   - categoryLabel: 分类中文名（父路由上定义，如 '资源配置'、'作业中心'）
 *   - label:         菜单项中文名（子路由上定义，如 '资产管理'）
 *   - desc:          菜单描述文字
 *   - navIcon:       图标标识（见 src/config/navData.tsx 的 ICON_MAP）
 *   - navAccess:     导航可见性权限变量名（对应 access.ts 中的权限）
 *
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
        path: '/user/register',
        layout: false,
        name: 'register',
        component: './user/register',
      },
      {
        path: '/user/register-result',
        layout: false,
        name: 'register-result',
        component: './user/register-result',
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
    // 导航元数据
    categoryId: 'dashboard',
    categoryLabel: '仪表盘',
    label: '监控面板',
    desc: '系统运行态势总览',
    navIcon: 'fundProjectionScreen',
  },

  // ==================== 资源配置 ====================
  {
    path: '/resources',
    name: 'resources',
    icon: 'database',
    access: 'canViewPlugins',
    categoryId: 'assets',
    categoryLabel: '资源配置',
    routes: [
      {
        path: '/resources',
        redirect: '/resources/cmdb',
      },
      {
        path: '/resources/cmdb',
        name: 'cmdb',
        component: './cmdb',
        label: '资产管理',
        desc: '主机与云资源统一管理',
        navIcon: 'database',
        navAccess: 'canViewPlugins',
      },
      {
        path: '/resources/incidents',
        name: 'incidents',
        component: './incidents',
        label: '工单管理',
        desc: '故障事件工单跟踪',
        navIcon: 'alert',
        navAccess: 'canViewPlugins',
      },
      {
        path: '/resources/secrets',
        name: 'secrets',
        component: './execution/secrets',
        label: '密钥管理',
        desc: 'SSH 与 API 凭证安全存储',
        navIcon: 'key',
        navAccess: 'canViewTasks',
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
        label: '插件管理',
        desc: '扩展插件安装与配置',
        navIcon: 'appstore',
        navAccess: 'canViewPlugins',
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
    categoryId: 'execution',
    categoryLabel: '作业中心',
    routes: [
      {
        path: '/execution',
        redirect: '/execution/git-repos',
      },
      {
        path: '/execution/git-repos',
        name: 'git-repos',
        component: './execution/git-repos',
        label: '代码仓库',
        desc: '代码与配置仓库管理',
        navIcon: 'code',
        navAccess: 'canViewRepositories',
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
        label: '剧本管理',
        desc: 'Ansible Playbook 管理',
        navIcon: 'book',
        navAccess: 'canViewPlaybooks',
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
        label: '任务模板',
        desc: '常用任务参数模板',
        navIcon: 'fileText',
        navAccess: 'canViewTasks',
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
        label: '任务执行',
        desc: '任务即时执行',
        navIcon: 'thunderbolt',
        navAccess: 'canViewTasks',
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
        label: '定时任务',
        desc: '周期性任务调度管理',
        navIcon: 'schedule',
        navAccess: 'canViewTasks',
      },
      {
        path: '/execution/logs',
        name: 'logs',
        component: './execution/logs',
        label: '执行记录',
        desc: '任务执行历史记录',
        navIcon: 'history',
        navAccess: 'canViewTasks',
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
    categoryId: 'pending',
    categoryLabel: '待办审批',
    routes: [
      {
        path: '/pending',
        redirect: '/pending/triggers',
      },
      {
        path: '/pending/triggers',
        name: '自愈审批',
        component: './pending-center/triggers',
        label: '自愈审批',
        desc: '待触发自愈工单',
        navIcon: 'carryOut',
        navAccess: 'canViewPendingTrigger',
      },
      {
        path: '/pending/approvals',
        name: '任务审批',
        component: './pending-center/approvals',
        label: '任务审批',
        desc: '待审批任务处理',
        navIcon: 'solution',
        navAccess: 'canViewApprovals',
      },
      {
        path: '/pending/impersonation',
        name: '访问审批',
        component: './pending-center/impersonation-approvals',
        access: 'canViewImpersonationApprovals',
        label: '访问审批',
        desc: '平台管理员租户访问申请',
        navIcon: 'userSwitch',
        navAccess: 'canViewImpersonationApprovals',
      },
      {
        path: '/pending/exemptions',
        name: '豁免审批',
        component: './pending-center/exemption-approvals',
        access: 'canApproveExemption',
        label: '豁免审批',
        desc: '安全豁免申请审批',
        navIcon: 'safetyCertificate',
        navAccess: 'canApproveExemption',
      },
    ],
  },
  // ==================== 通知模块 ====================
  {
    path: '/notification',
    name: 'notification',
    icon: 'bell',
    access: 'canViewChannels',
    categoryId: 'notification',
    categoryLabel: '通知中心',
    routes: [
      {
        path: '/notification',
        redirect: '/notification/channels',
      },
      {
        path: '/notification/channels',
        name: 'channels',
        component: './notification/channels',
        label: '通知渠道',
        desc: '邮件、钉钉等通知方式',
        navIcon: 'mail',
        navAccess: 'canViewChannels',
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
        label: '通知模板',
        desc: '告警消息模板配置',
        navIcon: 'fileText',
        navAccess: 'canViewTemplates',
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
        label: '通知记录',
        desc: '历史通知发送记录',
        navIcon: 'history',
        navAccess: 'canViewNotifications',
      },
    ],
  },
  // ==================== 自愈引擎 ====================
  {
    path: '/healing',
    name: 'healing',
    icon: 'tool',
    access: 'canViewFlows',
    categoryId: 'healing',
    categoryLabel: '自愈引擎',
    routes: [
      {
        path: '/healing',
        redirect: '/healing/flows',
      },
      {
        path: '/healing/flows',
        name: 'flows',
        component: './healing/flows',
        label: '自愈流程',
        desc: '可视化自愈流程编排',
        navIcon: 'apartment',
        navAccess: 'canViewFlows',
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
        label: '自愈规则',
        desc: '故障自愈规则配置',
        navIcon: 'safetyCertificate',
        navAccess: 'canViewRules',
      },
      {
        path: '/healing/instances',
        name: 'instances',
        component: './healing/instances',
        label: '自愈实例',
        desc: '自愈流程运行实例',
        navIcon: 'playCircle',
        navAccess: 'canViewInstances',
      },
      {
        path: '/healing/instances/:id',
        component: './healing/instances/detail',
        hideInMenu: true,
      },
    ],
  },


  // ==================== 平台功能 (Platform Features) ====================
  {
    path: '/platform',
    name: 'platform',
    icon: 'cluster',
    access: 'isPlatformAdmin',
    categoryId: 'platform',
    categoryLabel: '平台管理',
    routes: [
      {
        path: '/platform',
        redirect: '/platform/tenant-overview',
      },
      {
        path: '/platform/tenant-overview',
        name: 'tenantOverview',
        component: './platform/tenant-overview',
        label: '租户运营总览',
        desc: '所有租户运营数据概览',
        navIcon: 'fundProjectionScreen',
        navAccess: 'isPlatformAdmin',
      },
      {
        path: '/platform/tenants',
        name: 'tenants',
        component: './platform/tenants',
        label: '租户管理',
        desc: '多租户创建与配置',
        navIcon: 'global',
        navAccess: 'canViewPlatformTenants',
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
        label: '平台用户',
        desc: '跨租户用户管理',
        navIcon: 'team',
        navAccess: 'canViewPlatformUsers',
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
        label: '平台角色',
        desc: '平台级角色与权限管理',
        navIcon: 'safetyCertificate',
        navAccess: 'canViewPlatformRoles',
      },

      {
        path: '/platform/messages',
        name: 'platformMessages',
        component: './platform/messages',
        label: '平台消息',
        desc: '平台级消息推送',
        navIcon: 'mail',
        navAccess: 'canSendPlatformMessage',
      },
      {
        path: '/platform/settings',
        name: 'platformSettings',
        component: './platform/settings',
        label: '平台设置',
        desc: '全局平台参数配置',
        navIcon: 'control',
        navAccess: 'canManagePlatformSettings',
      },
      {
        path: '/platform/audit-logs',
        name: 'platformAuditLogs',
        component: './platform/audit-logs',
        label: '平台审计日志',
        desc: '平台管理员操作审计',
        navIcon: 'audit',
        navAccess: 'canViewPlatformAudit',
      },
      {
        path: '/platform/impersonation',
        name: 'impersonation',
        component: './platform/impersonation',
        label: '租户访问管理',
        desc: '审批制租户数据访问',
        navIcon: 'eye',
        navAccess: 'isPlatformAdmin',
      },
      {
        path: '/platform/tenant-ops-detail',
        name: 'tenantOpsDetail',
        component: './platform/tenant-ops-detail',
        label: '租户运营明细',
        desc: '租户运营数据明细报表',
        navIcon: 'barChart',
        navAccess: 'isPlatformAdmin',
      },
    ],
  },
  // ==================== 系统管理 (租户级) ====================
  {
    path: '/system',
    name: 'system',
    icon: 'setting',
    access: 'canViewUsers',
    categoryId: 'system',
    categoryLabel: '系统管理',
    routes: [
      {
        path: '/system',
        redirect: '/system/users',
      },
      {
        path: '/system/users',
        name: 'users',
        component: './system/users',
        label: '用户管理',
        desc: '系统账户与登录管理',
        navIcon: 'user',
        navAccess: 'canViewUsers',
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
        label: '角色管理',
        desc: 'RBAC 角色定义与分配',
        navIcon: 'safetyCertificate',
        navAccess: 'canViewRoles',
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
        label: '权限列表',
        desc: '系统功能权限点查询',
        navIcon: 'lock',
        navAccess: 'canViewPlatformPermissions',
      },

      {
        path: '/system/audit-logs',
        name: 'audit-logs',
        component: './system/audit-logs',
        label: '审计日志',
        desc: '全量操作行为记录',
        navIcon: 'audit',
        navAccess: 'canViewAuditLogs',
      },
      {
        path: '/system/messages',
        name: 'messages',
        component: './system/messages',
        access: 'canViewSiteMessages',
        label: '站内通知',
        desc: '系统消息与通知管理',
        navIcon: 'message',
        navAccess: 'canViewSiteMessages',
      },
    ],
  },
  // ==================== 安全防护 ====================
  {
    path: '/security',
    name: 'security',
    icon: 'safetyCertificate',
    access: 'canViewBlacklist',
    categoryId: 'security',
    categoryLabel: '安全防护',
    routes: [
      {
        path: '/security',
        redirect: '/security/command-blacklist',
      },
      {
        path: '/security/command-blacklist',
        name: 'command-blacklist',
        component: './security/command-blacklist',
        label: '指令黑名单',
        desc: '高危指令拦截与安全防护',
        navIcon: 'stop',
        navAccess: 'canViewBlacklist',
      },
      {
        path: '/security/command-blacklist/create',
        component: './security/command-blacklist/BlacklistRuleForm',
        hideInMenu: true,
      },
      {
        path: '/security/command-blacklist/:id/edit',
        component: './security/command-blacklist/BlacklistRuleForm',
        hideInMenu: true,
      },
      {
        path: '/security/exemptions',
        name: 'exemptions',
        component: './security/exemptions',
        label: '安全豁免',
        desc: '高危指令豁免申请与管理',
        navIcon: 'safetyCertificate',
        navAccess: 'canViewExemptions',
      },
      {
        path: '/security/exemptions/create',
        component: './security/exemptions/ExemptionForm',
        hideInMenu: true,
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
