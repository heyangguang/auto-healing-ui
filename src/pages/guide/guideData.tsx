/**
 * 产品指南 — 数据源
 *
 * 每条指南包含：
 *   - 基本信息（id / title / desc / icon）
 *   - category: 分类标识（quick / module / flow）
 *   - steps: 分步引导（仅快速指南使用，用于工作台 Drawer）
 *   - markdownFile: Markdown 文件路径（用于独立指南页面）
 */
import React from 'react';
import {
    DashboardOutlined,
    ThunderboltOutlined,
    ReadOutlined,
    ToolOutlined,
    BellOutlined,
    ScheduleOutlined,
    DatabaseOutlined,
    AlertOutlined,
    KeyOutlined,
    AppstoreOutlined,
    CodeOutlined,
    SettingOutlined,
    NodeIndexOutlined,
    ApiOutlined,
} from '@ant-design/icons';

export interface GuideStep {
    title: string;
    desc: string;
    /** 点击「前往配置」跳转路径 */
    path: string;
    /** 小贴士列表 */
    tips?: string[];
}

/** 指南分类 */
export type GuideCategory = 'quick' | 'module' | 'flow';

export const GUIDE_CATEGORY_LABELS: Record<GuideCategory, string> = {
    quick: '快速指南',
    module: '功能手册',
    flow: '用户视角指南',
};

export interface GuideArticle {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
    /** 分类 */
    category: GuideCategory;
    /** 分步引导（仅 quick 类使用） */
    steps: GuideStep[];
    /** Markdown 文件路径 (相对于 public/) */
    markdownFile: string;
}

/* ══════════════════════════════════════════════════
   指南内容
   ══════════════════════════════════════════════════ */

export const GUIDE_ARTICLES: GuideArticle[] = [
    /* ──────── 快速指南 (quick) ──────── */
    {
        id: 'quick-healing',
        title: '快速创建自愈流程',
        desc: '从零开始配置一个完整的自动化运维流程',
        icon: <ThunderboltOutlined />,
        category: 'quick',
        markdownFile: '/guides/quick-healing.md',
        steps: [
            {
                title: '纳管主机',
                desc: '在 CMDB 中添加需要管理的目标主机，确保主机网络可达且已配置 SSH 密钥。',
                path: '/resources/cmdb',
                tips: ['确保平台服务器与目标主机之间网络互通', '建议按业务或环境对主机进行分组管理', '添加后平台会自动检测主机连通性'],
            },
            {
                title: '导入 Playbook',
                desc: '从 Git 仓库同步或手动导入 Ansible Playbook 剧本，作为自愈动作的执行脚本。',
                path: '/execution/playbooks',
                tips: ['推荐通过 Git 仓库自动同步，保持版本一致', '平台会自动扫描并注册仓库中的 Playbook', '支持手动导入单个 .yml 文件'],
            },
            {
                title: '创建任务模板',
                desc: '将 Playbook 封装为任务模板，配置默认参数、目标主机组和超时时间。',
                path: '/execution/templates',
                tips: ['任务模板是自愈规则的最小执行单元', '可预设默认 Extra Vars 简化运行配置', '建议设置合理的超时时间避免任务挂起'],
            },
            {
                title: '配置自愈规则',
                desc: '定义触发条件（如告警关键词匹配）、匹配策略和要执行的任务模板。',
                path: '/healing/rules',
                tips: ['规则支持多条件组合（AND/OR）', '可设置优先级控制规则匹配顺序', '建议先用 Dry Run 模式测试规则'],
            },
            {
                title: '启用自愈流程',
                desc: '在流程编辑器中编排完整的自愈 DAG 流程，启用后即可自动响应告警。',
                path: '/healing/flows',
                tips: ['DAG 编辑器支持拖拽编排节点', '高危操作建议插入人工审批节点', '流程启用后会立即开始监听告警事件'],
            },
        ],
    },
    {
        id: 'playbook-standards',
        title: 'Playbook 编写规范',
        desc: '了解 Ansible Playbook 最佳实践和变量管理',
        icon: <ReadOutlined />,
        category: 'quick',
        markdownFile: '/guides/playbook-standards.md',
        steps: [
            {
                title: '规范目录结构',
                desc: '按照 Ansible 最佳实践组织 roles、tasks、vars 目录结构，确保仓库整洁可维护。',
                path: '/execution/git-repos',
                tips: ['playbooks/ 目录放入口文件，roles/ 放复用逻辑', '使用 group_vars/ 管理环境差异', '仓库根目录的 .yml 也会被自动识别'],
            },
            {
                title: '变量管理',
                desc: '使用平台的变量扫描功能，自动识别 Playbook 中的变量并统一管理默认值。',
                path: '/execution/playbooks',
                tips: ['变量名使用 snake_case 命名规范', '敏感变量通过密钥管理存储，不要硬编码', '导入后平台会自动扫描 {{ variable }} 引用'],
            },
            {
                title: '角色复用',
                desc: '将通用操作封装为 Ansible Role，在多个 Playbook 间共享复用。',
                path: '/execution/playbooks',
                tips: ['通用操作（如日志清理、健康检查）适合封装为 Role', '使用 defaults/main.yml 设置可覆盖的默认值', 'Role 前缀命名避免变量冲突'],
            },
            {
                title: '测试验证',
                desc: '通过模拟运行（Dry Run）验证 Playbook 正确性，检查任务日志排查问题。',
                path: '/execution/execute',
                tips: ['Dry Run 模式不会实际执行变更', '关注任务日志中的变量值输出', '先在测试主机验证后再用于生产环境'],
            },
        ],
    },
    {
        id: 'rule-config',
        title: '规则配置指南',
        desc: '如何配置触发条件、匹配策略和执行动作',
        icon: <ToolOutlined />,
        category: 'quick',
        markdownFile: '/guides/rule-config.md',
        steps: [
            {
                title: '选择数据源',
                desc: '确定告警来源：可以是平台插件推送、工单系统集成或自定义 Webhook。',
                path: '/resources/plugins',
                tips: ['常见数据源：Zabbix、Prometheus、ServiceNow', '自定义 Webhook 支持任意系统接入', '同一规则只能绑定一个数据源插件'],
            },
            {
                title: '配置匹配条件',
                desc: '设置告警匹配规则：支持关键词匹配、正则表达式、字段值比较等灵活条件。',
                path: '/healing/rules',
                tips: ['支持 AND/OR 条件组合', '可使用 expr 表达式引擎编写复杂逻辑', '字段匹配支持通配符 * 和正则'],
            },
            {
                title: '设置执行动作',
                desc: '选择匹配成功后要执行的任务模板，可配置参数映射和条件分支。',
                path: '/healing/rules',
                tips: ['告警字段可自动映射为任务参数', '支持三种模式：自动执行、审批、仅通知', '参数映射语法：{{ .alert.field_name }}'],
            },
            {
                title: '测试触发',
                desc: '使用模拟数据验证规则是否正确匹配和触发，确保配置无误。',
                path: '/healing/instances',
                tips: ['在自愈实例页面查看规则触发记录', '观察匹配日志排查条件配置问题', '确认参数映射结果是否符合预期'],
            },
        ],
    },
    {
        id: 'notification-config',
        title: '通知模板配置',
        desc: '配置邮件、钉钉、Webhook 多渠道告警通知',
        icon: <BellOutlined />,
        category: 'quick',
        markdownFile: '/guides/notification-config.md',
        steps: [
            {
                title: '添加通知渠道',
                desc: '配置通知发送方式：邮件 SMTP、钉钉机器人、企业微信或自定义 Webhook。',
                path: '/notification/channels',
                tips: ['钉钉需要 Webhook URL 和签名密钥', 'SMTP 需要服务器地址、端口和认证信息', 'Webhook 支持 Basic Auth 认证'],
            },
            {
                title: '创建通知模板',
                desc: '定义通知内容模板，使用变量引用动态填充告警详情、主机信息等。',
                path: '/notification/templates',
                tips: ['模板内容支持 {{ .variable }} 变量语法', '同一模板可以被多个规则复用', '不同渠道可使用不同的模板格式'],
            },
            {
                title: '配置模板变量',
                desc: '选择模板中可用的变量（事件名称、触发时间、受影响主机等），预览渲染效果。',
                path: '/notification/templates',
                tips: ['常用变量：event_name、severity、host_ip', '编辑器支持实时预览变量渲染效果', '可自定义变量用于传递额外信息'],
            },
            {
                title: '发送测试',
                desc: '通过测试功能验证通知是否能正常送达，检查渠道连通性和模板渲染。',
                path: '/notification/records',
                tips: ['添加渠道后建议立即发送测试消息', '测试记录可在通知记录页面查看', '失败时检查网络连通和认证信息'],
            },
        ],
    },
    {
        id: 'schedule-management',
        title: '定时任务管理',
        desc: '创建和管理定时执行的自动化运维任务',
        icon: <ScheduleOutlined />,
        category: 'quick',
        markdownFile: '/guides/schedule-management.md',
        steps: [
            {
                title: '选择任务模板',
                desc: '从已有的任务模板中选择要定时执行的任务。',
                path: '/execution/templates',
                tips: ['需要先创建好任务模板才能配置定时', '一个定时任务只能关联一个任务模板', '任务模板中的参数可以在定时任务中覆盖'],
            },
            {
                title: '配置 Cron 表达式',
                desc: '设置任务执行周期：支持可视化 Cron 配置和手动输入表达式。',
                path: '/execution/schedules',
                tips: ['格式：分钟 小时 日 月 星期', '示例：0 2 * * * 表示每天凌晨 2 点', '*/30 * * * * 表示每隔 30 分钟'],
            },
            {
                title: '设置目标与参数',
                desc: '指定任务执行的目标主机组和运行时参数。',
                path: '/execution/schedules',
                tips: ['可以选择主机组或指定单台主机', 'Extra Vars 会覆盖任务模板的默认值', '目标主机离线时任务将自动跳过'],
            },
            {
                title: '启用调度',
                desc: '保存并启用定时任务，可在日历视图中查看任务排期。',
                path: '/execution/schedules',
                tips: ['可随时暂停/恢复调度不会丢失配置', '工作台日历可直观查看排期', '前次未完成时新的调度会自动跳过'],
            },
        ],
    },
    {
        id: 'cmdb-management',
        title: '主机资产管理',
        desc: '纳管主机、分组管理和状态监控',
        icon: <DatabaseOutlined />,
        category: 'quick',
        markdownFile: '/guides/cmdb-management.md',
        steps: [
            {
                title: '添加主机',
                desc: '手动添加或批量导入需要管理的主机，填写 IP、端口和认证信息。',
                path: '/resources/cmdb',
                tips: ['支持手动添加和 CSV 批量导入', 'SSH 端口默认为 22，可自定义', '添加后自动检测主机连通性'],
            },
            {
                title: '配置密钥',
                desc: '在密钥管理中添加 SSH 密钥或密码凭证，用于连接目标主机。',
                path: '/resources/secrets',
                tips: ['支持 SSH 私钥和密码两种认证方式', '建议为不同环境配置不同的密钥', '密钥信息加密存储，安全可靠'],
            },
            {
                title: '分组管理',
                desc: '将主机按业务、环境或用途分组，方便批量操作和权限控制。',
                path: '/resources/cmdb',
                tips: ['推荐分组：按环境、按业务、按地域', '分组支持嵌套层级管理', '任务执行时可按分组批量选择主机'],
            },
            {
                title: '状态监控',
                desc: '查看主机在线/离线状态，平台会定期检测主机连通性。',
                path: '/resources/cmdb',
                tips: ['🟢 在线：可执行任务', '🔴 离线：任务自动跳过', '🟡 维护中：暂停自动任务执行'],
            },
        ],
    },

    /* ──────── 功能手册 (module) — 按菜单逐一拆分 ──────── */

    // ━━ 仪表盘 ━━
    {
        id: 'mod-dashboard',
        title: '仪表盘',
        desc: '全局监控与态势总览中心',
        icon: <DashboardOutlined />,
        category: 'module',
        markdownFile: '/guides/01-dashboard.md',
        steps: [],
    },

    // ━━ 资产配置 ━━
    {
        id: 'mod-cmdb',
        title: '资产管理 (CMDB)',
        desc: '主机纳管、分组、维护模式与连通性检测',
        icon: <DatabaseOutlined />,
        category: 'module',
        markdownFile: '/guides/02-assets-cmdb.md',
        steps: [],
    },
    {
        id: 'mod-incidents',
        title: '工单管理 (Incidents)',
        desc: '告警工单生命周期、状态字典与自愈引擎联动',
        icon: <AlertOutlined />,
        category: 'module',
        markdownFile: '/guides/03-incidents.md',
        steps: [],
    },
    {
        id: 'mod-secrets',
        title: '密钥管理 (Secrets)',
        desc: 'SSH 密钥与凭证加密存储、优先级选择策略',
        icon: <KeyOutlined />,
        category: 'module',
        markdownFile: '/guides/04-secrets.md',
        steps: [],
    },
    {
        id: 'mod-plugins',
        title: '插件管理 (Plugins)',
        desc: 'ITSM/CMDB 外部系统集成、字段映射与同步管理',
        icon: <AppstoreOutlined />,
        category: 'module',
        markdownFile: '/guides/05-plugins.md',
        steps: [],
    },

    // ━━ 作业中心 ━━
    {
        id: 'mod-git-repos',
        title: '代码仓库 (Git Repos)',
        desc: 'Git 仓库同步、认证方式与 Playbook 自动发现',
        icon: <CodeOutlined />,
        category: 'module',
        markdownFile: '/guides/06-git-repos.md',
        steps: [],
    },
    {
        id: 'mod-playbooks',
        title: 'Playbook 管理',
        desc: 'Playbook 模板状态、变量扫描与变更检测',
        icon: <ReadOutlined />,
        category: 'module',
        markdownFile: '/guides/07-playbooks.md',
        steps: [],
    },
    {
        id: 'mod-templates',
        title: '任务模板 (Templates)',
        desc: '可执行任务封装、执行器类型与通知配置',
        icon: <ToolOutlined />,
        category: 'module',
        markdownFile: '/guides/08-templates.md',
        steps: [],
    },
    {
        id: 'mod-exec-logs',
        title: '执行记录 (Logs)',
        desc: '任务执行流水线、主机级结果与控制台日志',
        icon: <CodeOutlined />,
        category: 'module',
        markdownFile: '/guides/09-exec-logs.md',
        steps: [],
    },
    {
        id: 'mod-schedules',
        title: '定时任务 (Schedules)',
        desc: 'Cron 表达式调度、暂停恢复与日历视图',
        icon: <ScheduleOutlined />,
        category: 'module',
        markdownFile: '/guides/10-schedules.md',
        steps: [],
    },

    // ━━ 自愈引擎 ━━
    {
        id: 'mod-healing-rules',
        title: '自愈规则 (Rules)',
        desc: '条件匹配引擎、触发模式与操作符字典',
        icon: <ToolOutlined />,
        category: 'module',
        markdownFile: '/guides/11-healing-rules.md',
        steps: [],
    },
    {
        id: 'mod-healing-flows',
        title: '自愈流程 (Flows)',
        desc: 'DAG 可视化编排、节点类型与表达式引擎',
        icon: <NodeIndexOutlined />,
        category: 'module',
        markdownFile: '/guides/12-healing-flows.md',
        steps: [],
    },
    {
        id: 'mod-healing-instances',
        title: '自愈实例 (Instances)',
        desc: '流程运行记录、节点状态追踪与 SSE 实时推送',
        icon: <ThunderboltOutlined />,
        category: 'module',
        markdownFile: '/guides/13-healing-instances.md',
        steps: [],
    },

    // ━━ 通知管理 ━━
    {
        id: 'mod-notification',
        title: '通知管理',
        desc: '多渠道消息推送、通知模板变量与重试机制',
        icon: <BellOutlined />,
        category: 'module',
        markdownFile: '/guides/14-notification.md',
        steps: [],
    },

    // ━━ 系统管理 ━━
    {
        id: 'mod-system',
        title: '系统管理',
        desc: '用户角色 RBAC、租户隔离与审计日志追溯',
        icon: <SettingOutlined />,
        category: 'module',
        markdownFile: '/guides/15-system-admin.md',
        steps: [],
    },

    /* ──────── 用户视角指南 (flow) ──────── */
    {
        id: 'flow-configure-healing',
        title: '实战: 如何从零拼装自愈流程',
        desc: '端到端流程：从告警接收到自动化恢复通知',
        icon: <ThunderboltOutlined />,
        category: 'flow',
        markdownFile: '/guides/09-flow-configure-healing.md',
        steps: [],
    },
    {
        id: 'flow-connect-incidents',
        title: '实战: 接入第三方工单系统',
        desc: '以 Webhook 为例接入 Prometheus 告警',
        icon: <NodeIndexOutlined />,
        category: 'flow',
        markdownFile: '/guides/10-flow-connect-incidents.md',
        steps: [],
    },
    {
        id: 'flow-develop-inject-plugins',
        title: '实战: 开发并注入一个自定义插件',
        desc: '如何编写胶水层转换非标准告警有效载荷',
        icon: <ApiOutlined />,
        category: 'flow',
        markdownFile: '/guides/11-flow-develop-inject-plugins.md',
        steps: [],
    },
];
