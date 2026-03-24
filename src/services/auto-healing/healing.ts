import { request } from '@umijs/max';

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
    description?: string;
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
    return request<AutoHealing.PaginatedResponse<AutoHealing.HealingFlow>>('/api/v1/tenant/healing/flows', {
        method: 'GET',
        params,
    });
}

/**
 * 获取自愈流程详情
 */
export async function getFlow(id: string) {
    return request<{ data: AutoHealing.HealingFlow }>(`/api/v1/tenant/healing/flows/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建自愈流程
 */
export async function createFlow(data: AutoHealing.CreateFlowRequest) {
    return request<{ data: AutoHealing.HealingFlow }>('/api/v1/tenant/healing/flows', {
        method: 'POST',
        data,
    });
}

/**
 * 更新自愈流程
 */
export async function updateFlow(id: string, data: AutoHealing.UpdateFlowRequest) {
    return request<{ data: AutoHealing.HealingFlow }>(`/api/v1/tenant/healing/flows/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除自愈流程
 */
export async function deleteFlow(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/flows/${id}`, {
        method: 'DELETE',
    });
}

/**
 * Dry-Run 模拟执行流程
 */
export async function dryRunFlow(id: string, data: AutoHealing.DryRunRequest) {
    return request<{ data: AutoHealing.DryRunResponse }>(`/api/v1/tenant/healing/flows/${id}/dry-run`, {
        method: 'POST',
        data,
    });
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
    page?: number;
    page_size?: number;
    is_active?: boolean;
    flow_id?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.HealingRule>>('/api/v1/tenant/healing/rules', {
        method: 'GET',
        params,
    });
}

/**
 * 获取自愈规则详情
 */
export async function getRule(id: string) {
    return request<AutoHealing.HealingRule>(`/healing/rules/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建自愈规则
 */
export async function createRule(data: AutoHealing.CreateRuleRequest) {
    return request<AutoHealing.HealingRule>('/api/v1/tenant/healing/rules', {
        method: 'POST',
        data,
    });
}

/**
 * 更新自愈规则
 */
export async function updateRule(id: string, data: AutoHealing.UpdateRuleRequest) {
    return request<AutoHealing.HealingRule>(`/healing/rules/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除自愈规则
 */
export async function deleteRule(id: string, force?: boolean) {
    return request<AutoHealing.SuccessResponse>(`/healing/rules/${id}`, {
        method: 'DELETE',
        params: force ? { force: true } : undefined,
    });
}

/**
 * 启用自愈规则
 */
export async function activateRule(id: string) {
    return request<AutoHealing.SuccessResponse>(`/healing/rules/${id}/activate`, {
        method: 'POST',
    });
}

/**
 * 停用自愈规则
 */
export async function deactivateRule(id: string) {
    return request<AutoHealing.SuccessResponse>(`/healing/rules/${id}/deactivate`, {
        method: 'POST',
    });
}

// ==================== 流程实例 ====================

/**
 * 获取流程实例列表
 */
export async function getInstances(params?: {
    page?: number;
    page_size?: number;
    status?: AutoHealing.FlowInstanceStatus;
    flow_id?: string;
}) {
    return request<AutoHealing.PaginatedResponse<AutoHealing.FlowInstance>>('/api/v1/tenant/healing/instances', {
        method: 'GET',
        params,
    });
}

/**
 * 获取流程实例详情
 */
export async function getInstance(id: string) {
    return request<AutoHealing.FlowInstance>(`/healing/instances/${id}`, {
        method: 'GET',
    });
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
        `/healing/instances/${id}/logs`,
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
    return request<AutoHealing.SuccessResponse>(`/healing/instances/${id}/cancel`, {
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
    return request<AutoHealing.PaginatedResponse<AutoHealing.ApprovalTask>>('/api/v1/tenant/healing/approvals', {
        method: 'GET',
        params,
    });
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
    return request<AutoHealing.ApprovalTask>(`/healing/approvals/${id}`, {
        method: 'GET',
    });
}

/**
 * 批准审批任务
 */
export async function approveTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/approvals/${id}/approve`, {
        method: 'POST',
        data,
    });
}

/**
 * 拒绝审批任务
 */
export async function rejectTask(id: string, data?: AutoHealing.ApprovalDecisionRequest) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/tenant/healing/approvals/${id}/reject`, {
        method: 'POST',
        data,
    });
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
