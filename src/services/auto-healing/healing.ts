import { request } from '@umijs/max';
import {
    getTenantHealingApprovals,
    postTenantHealingApprovalsIdApprove,
    postTenantHealingApprovalsIdReject,
} from '@/services/generated/auto-healing/approvals';
import {
    getTenantHealingInstances,
    getTenantHealingInstancesId,
} from '@/services/generated/auto-healing/flowInstances';
import {
    deleteTenantHealingFlowsId,
    getTenantHealingFlows,
    getTenantHealingFlowsId,
    postTenantHealingFlows,
    postTenantHealingFlowsIdDryRun,
    putTenantHealingFlowsId,
} from '@/services/generated/auto-healing/healingFlows';
import {
    getTenantHealingRules,
    getTenantHealingRulesId,
    postTenantHealingRules,
    postTenantHealingRulesIdActivate,
} from '@/services/generated/auto-healing/healingRules';
import type { HealingRuleQueryParams } from './healing-rules';
import type { HealingInstanceQueryParams } from './instances';

// ==================== 自愈流程 ====================

/**
 * 获取自愈流程列表
 */
export async function getFlows(params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
    search?: string;
    name?: string;
    name__exact?: string;
    description?: string;
    description__exact?: string;
    node_type?: string;
    min_nodes?: number;
    max_nodes?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    created_from?: string;
    created_to?: string;
    updated_from?: string;
    updated_to?: string;
}) {
    return getTenantHealingFlows(
        (params || {}) as GeneratedAutoHealing.getTenantHealingFlowsParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.HealingFlow>>;
}

/**
 * 获取自愈流程详情
 */
export async function getFlow(id: string) {
    return getTenantHealingFlowsId({ id }) as Promise<{ data: AutoHealing.HealingFlow }>;
}

/**
 * 创建自愈流程
 */
export async function createFlow(data: AutoHealing.CreateFlowRequest) {
    return postTenantHealingFlows({ data }) as Promise<{ data: AutoHealing.HealingFlow }>;
}

/**
 * 更新自愈流程
 */
export async function updateFlow(id: string, data: AutoHealing.UpdateFlowRequest) {
    return putTenantHealingFlowsId({ id }, { data }) as Promise<{ data: AutoHealing.HealingFlow }>;
}

/**
 * 删除自愈流程
 */
export async function deleteFlow(id: string) {
    return deleteTenantHealingFlowsId({ id }) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * Dry-Run 模拟执行流程
 */
export async function dryRunFlow(id: string, data: AutoHealing.DryRunRequest) {
    return postTenantHealingFlowsIdDryRun({ id }, { data }) as Promise<{ data: AutoHealing.DryRunResponse }>;
}

/**
 * 获取节点类型定义
 * 返回所有节点类型的配置项、输入输出变量、分支信息
 */
export async function getNodeSchema() {
    return request<{ data: AutoHealing.NodeSchema }>('/api/v1/tenant/healing/flows/node-schema', {
        method: 'GET',
    });
}

/**
 * 重试流程实例
 */
export async function retryInstance(id: string, data?: AutoHealing.RetryInstanceRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/retry`, {
        method: 'POST',
        data,
    });
}

// ==================== 触发工单 ====================

/**
 * 获取待触发工单列表
 */
export async function getPendingTriggers(params?: {
    page?: number;
    page_size?: number;
    title?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/tenant/healing/pending/trigger', {
        method: 'GET',
        params,
    });
}

/**
 * 手动触发自愈流程
 */
export async function triggerHealing(id: string) {
    return request<{ data: AutoHealing.HealingFlowInstance }>(`/api/v1/tenant/incidents/${id}/trigger`, {
        method: 'POST',
    });
}

/**
 * 忽略待触发工单
 */
export async function dismissIncident(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incidents/${id}/dismiss`, {
        method: 'POST',
    });
}

/**
 * 获取已忽略工单列表
 */
export async function getDismissedTriggers(params?: {
    page?: number;
    page_size?: number;
    title?: string;
    severity?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.Incident>>('/api/v1/tenant/healing/pending/dismissed', {
        method: 'GET',
        params,
    });
}

/**
 * 重置工单扫描状态（将已忽略工单恢复为待处理）
 */
export async function resetIncidentScan(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/incidents/${id}/reset-scan`, {
        method: 'POST',
    });
}

// ==================== 自愈规则 ====================

/**
 * 获取自愈规则列表
 */
export async function getRules(params?: {
    page?: HealingRuleQueryParams['page'];
    page_size?: HealingRuleQueryParams['page_size'];
    search?: HealingRuleQueryParams['search'];
    name?: HealingRuleQueryParams['name'];
    name__exact?: HealingRuleQueryParams['name__exact'];
    description?: HealingRuleQueryParams['description'];
    description__exact?: HealingRuleQueryParams['description__exact'];
    is_active?: HealingRuleQueryParams['is_active'];
    flow_id?: HealingRuleQueryParams['flow_id'];
    trigger_mode?: HealingRuleQueryParams['trigger_mode'];
    priority?: HealingRuleQueryParams['priority'];
    match_mode?: HealingRuleQueryParams['match_mode'];
    has_flow?: HealingRuleQueryParams['has_flow'];
    created_from?: HealingRuleQueryParams['created_from'];
    created_to?: HealingRuleQueryParams['created_to'];
    sort_by?: HealingRuleQueryParams['sort_by'];
    sort_order?: HealingRuleQueryParams['sort_order'];
}) {
    return getTenantHealingRules(
        (params || {}) as GeneratedAutoHealing.getTenantHealingRulesParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.HealingRule>>;
}

/**
 * 获取自愈规则详情
 */
export async function getRule(id: string) {
    return getTenantHealingRulesId({ id }) as Promise<{ data: AutoHealing.HealingRule }>;
}

/**
 * 创建自愈规则
 */
export async function createRule(data: AutoHealing.CreateRuleRequest) {
    return postTenantHealingRules({ data }) as Promise<{ data: AutoHealing.HealingRule }>;
}

/**
 * 更新自愈规则
 */
export async function updateRule(id: string, data: AutoHealing.UpdateRuleRequest) {
    return request<AutoHealing.HealingRule>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除自愈规则
 */
export async function deleteRule(id: string, force?: boolean) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}`, {
        method: 'DELETE',
        params: force ? { force: true } : undefined,
    });
}

/**
 * 启用自愈规则
 */
export async function activateRule(id: string) {
    return postTenantHealingRulesIdActivate({ id }) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 停用自愈规则
 */
export async function deactivateRule(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/rules/${id}/deactivate`, {
        method: 'POST',
    });
}

// ==================== 流程实例 ====================

/**
 * 获取流程实例列表
 */
export async function getInstances(params?: {
    page?: HealingInstanceQueryParams['page'];
    page_size?: HealingInstanceQueryParams['page_size'];
    status?: HealingInstanceQueryParams['status'];
    flow_id?: HealingInstanceQueryParams['flow_id'];
    rule_id?: HealingInstanceQueryParams['rule_id'];
    incident_id?: HealingInstanceQueryParams['incident_id'];
    has_error?: HealingInstanceQueryParams['has_error'];
    approval_status?: HealingInstanceQueryParams['approval_status'];
    flow_name?: HealingInstanceQueryParams['flow_name'];
    rule_name?: HealingInstanceQueryParams['rule_name'];
    incident_title?: HealingInstanceQueryParams['incident_title'];
    error_message?: HealingInstanceQueryParams['error_message'];
    created_from?: HealingInstanceQueryParams['created_from'];
    created_to?: HealingInstanceQueryParams['created_to'];
    started_from?: HealingInstanceQueryParams['started_from'];
    started_to?: HealingInstanceQueryParams['started_to'];
    completed_from?: HealingInstanceQueryParams['completed_from'];
    completed_to?: HealingInstanceQueryParams['completed_to'];
    sort_by?: HealingInstanceQueryParams['sort_by'];
    sort_order?: HealingInstanceQueryParams['sort_order'];
}) {
    return getTenantHealingInstances(
        (params || {}) as GeneratedAutoHealing.getTenantHealingInstancesParams,
    ) as Promise<AutoHealing.PaginatedResponse<AutoHealing.FlowInstance>>;
}

/**
 * 获取流程实例详情
 */
export async function getInstance(id: string) {
    return getTenantHealingInstancesId({ id }) as Promise<{ data: AutoHealing.FlowInstance }>;
}

/**
 * 获取流程实例执行日志
 */
export async function getInstanceLogs(id: string, params?: {
    node_id?: string;
    level?: 'debug' | 'info' | 'warn' | 'error';
    page?: number;
    page_size?: number;
}) {
    return request<{ data: AutoHealing.FlowExecutionLog[]; total: number; page: number; page_size: number }>(
        `/api/v1/tenant/healing/instances/${id}/logs`,
        {
            method: 'GET',
            params,
        },
    );
}

/**
 * 取消流程实例
 */
export async function cancelInstance(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/instances/${id}/cancel`, {
        method: 'POST',
    });
}

// ==================== 审批任务 ====================

/**
 * 获取审批任务列表
 */
export async function getApprovals(params?: {
    page?: number;
    page_size?: number;
    status?: AutoHealing.ApprovalStatus;
}) {
    return getTenantHealingApprovals({ params }) as Promise<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>;
}

/**
 * 获取待审批任务列表
 */
export async function getPendingApprovals(params?: {
    page?: number;
    page_size?: number;
    node_name?: string;
    date_from?: string;
    date_to?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals/pending', {
        method: 'GET',
        params,
    });
}

/**
 * 获取审批任务详情
 */
export async function getApproval(id: string) {
    return request<AutoHealing.ApprovalTask>(`/api/v1/tenant/healing/approvals/${id}`, {
        method: 'GET',
    });
}

/**
 * 批准审批任务
 */
export async function approveTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return postTenantHealingApprovalsIdApprove(
        { id },
        data ? { data } : undefined,
    ) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 拒绝审批任务
 */
export async function rejectTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return postTenantHealingApprovalsIdReject(
        { id },
        data ? { data } : undefined,
    ) as Promise<AutoHealing.SuccessResponse>;
}

/**
 * 获取自愈流程统计
 * GET /api/v1/tenant/healing/flows/stats
 */
export async function getFlowStats() {
    return request<{
        code: number;
        data: { total: number; active_count: number; inactive_count: number };
    }>('/api/v1/tenant/healing/flows/stats', { method: 'GET' });
}

/**
 * 获取自愈规则统计
 * GET /api/v1/tenant/healing/rules/stats
 */
export async function getRuleStats() {
    return request<{
        code: number;
        data: {
            total: number;
            active_count: number;
            inactive_count: number;
            by_trigger_mode: Array<{ trigger_mode: string; count: number }>;
        };
    }>('/api/v1/tenant/healing/rules/stats', { method: 'GET' });
}

/**
 * 获取自愈实例统计
 * GET /api/v1/tenant/healing/instances/stats
 */
export async function getInstanceStats() {
    return request<{
        code: number;
        data: {
            total: number;
            by_status: Array<{ status: string; count: number }>;
        };
    }>('/api/v1/tenant/healing/instances/stats', { method: 'GET' });
}
