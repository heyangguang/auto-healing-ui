/**
 * 运维自愈系统 API 服务模块
 */

// 认证
export * from './auth';

// 用户管理
export * from './users';

// 角色管理
export * from './roles';

// 权限管理
export * from './permissions';

// 插件管理
export * from './plugins';

// 工单管理
export * from './incidents';

// CMDB
export * from './cmdb';

// 密钥管理
export * from './secrets';

// Git 仓库
export * from './git-repos';

// 执行任务
export * from './execution';

// 通知模块
export * from './notification';

// 自愈引擎 (exclude resetIncidentScan to avoid conflict with incidents module)
export {
    getFlows, getFlow, createFlow, updateFlow, deleteFlow, dryRunFlow,
    getNodeSchema as getNodeSchemas, retryInstance,
    getPendingTriggers, triggerHealing, dismissIncident, getDismissedTriggers,
    getRules as getHealingRules, getRule as getHealingRule,
    createRule as createHealingRule, updateRule as updateHealingRule,
    deleteRule as deleteHealingRule, activateRule, deactivateRule,
    getInstances as getHealingInstances, getInstance as getHealingInstance,
    cancelInstance,
    getApprovals, getPendingApprovals, getApproval, approveTask, rejectTask,
    getFlowStats as getHealingFlowStats,
    getRuleStats as getHealingRuleStats,
    getInstanceStats as getHealingInstanceStats,
} from './healing';

// 全局搜索
export * from './search';
