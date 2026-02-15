import { request } from '@umijs/max';

// ==================== 任务模板 ====================

/**
 * 获取任务模板列表
 */
export async function getExecutionTasks(params?: {
    page?: number;
    page_size?: number;
    playbook_id?: string;
    search?: string;
    executor_type?: string;
    status?: string;
    target_hosts?: string;
    playbook_name?: string;
    repository_name?: string;
    has_logs?: boolean;
    has_runs?: boolean;
    min_run_count?: number;
    last_run_status?: string;
}) {
    return request<{ data: AutoHealing.ExecutionTask[]; total: number }>('/api/v1/execution-tasks', {
        method: 'GET',
        params,
    });
}

/**
 * 获取任务模板详情
 */
export async function getExecutionTask(id: string) {
    return request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/execution-tasks/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建任务模板
 */
export async function createExecutionTask(data: AutoHealing.CreateExecutionTaskRequest) {
    return request<{ data: AutoHealing.ExecutionTask }>('/api/v1/execution-tasks', {
        method: 'POST',
        data,
    });
}

/**
 * 更新任务模板
 */
export async function updateExecutionTask(id: string, data: AutoHealing.UpdateExecutionTaskRequest) {
    return request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/execution-tasks/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除任务模板
 */
export async function deleteExecutionTask(id: string) {
    return request<void>(`/api/v1/execution-tasks/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 执行任务
 */
export async function executeTask(id: string, data?: AutoHealing.ExecuteTaskRequest) {
    return request<{ data: AutoHealing.ExecutionRun }>(`/api/v1/execution-tasks/${id}/execute`, {
        method: 'POST',
        data,
    });
}

/**
 * 确认任务模板变量审核
 */
export async function confirmExecutionTaskReview(id: string) {
    return request<{ data: AutoHealing.ExecutionTask }>(`/api/v1/execution-tasks/${id}/confirm-review`, {
        method: 'POST',
    });
}

/**
 * 获取任务的执行历史
 */
export async function getTaskRuns(id: string, params?: {
    page?: number;
    page_size?: number;
}) {
    return request<{ data: AutoHealing.ExecutionRun[]; total: number }>(`/api/v1/execution-tasks/${id}/runs`, {
        method: 'GET',
        params,
    });
}

// ==================== 执行记录 ====================

/**
 * 获取执行记录列表
 */
export async function getExecutionRuns(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    task_id?: string;
    search?: string; // Support Global ID/Keyword search
    triggered_by?: string;
    started_after?: string;
    started_before?: string;
}) {
    return request<{ data: AutoHealing.ExecutionRun[]; total: number }>('/api/v1/execution-runs', {
        method: 'GET',
        params,
    });
}

/**
 * 获取执行记录统计概览
 */
export async function getExecutionRunStats() {
    return request<{
        data: {
            total_count: number;
            success_count: number;
            failed_count: number;
            partial_count: number;
            cancelled_count: number;
            success_rate: number;
            avg_duration_sec: number;
            today_count: number;
        };
    }>('/api/v1/execution-runs/stats', { method: 'GET' });
}

/**
 * 获取执行趋势（按天分组）
 */
export async function getExecutionRunTrend(days = 7) {
    return request<{
        data: {
            days: number;
            items: { date: string; status: string; count: number }[];
        };
    }>('/api/v1/execution-runs/trend', { method: 'GET', params: { days } });
}

/**
 * 获取触发方式分布
 */
export async function getExecutionTriggerDistribution() {
    return request<{
        data: { triggered_by: string; count: number }[];
    }>('/api/v1/execution-runs/trigger-distribution', { method: 'GET' });
}

/**
 * 获取失败率最高的 Top N 任务
 */
export async function getExecutionTopFailed(limit = 5) {
    return request<{
        data: { task_id: string; task_name: string; total: number; failed: number; fail_rate: number }[];
    }>('/api/v1/execution-runs/top-failed', { method: 'GET', params: { limit } });
}

/**
 * 获取最活跃的 Top N 任务
 */
export async function getExecutionTopActive(limit = 5) {
    return request<{
        data: { task_id: string; task_name: string; total: number }[];
    }>('/api/v1/execution-runs/top-active', { method: 'GET', params: { limit } });
}

/**
 * 获取执行记录详情
 */
export async function getExecutionRun(id: string) {
    return request<{ data: AutoHealing.ExecutionRun }>(`/api/v1/execution-runs/${id}`, {
        method: 'GET',
    });
}

/**
 * 获取执行日志
 */
export async function getExecutionLogs(id: string, params?: {
    page?: number;
    page_size?: number;
    log_level?: string;
}) {
    return request<{ data: AutoHealing.ExecutionLog[] }>(`/api/v1/execution-runs/${id}/logs`, {
        method: 'GET',
        params,
    });
}

/**
 * 取消执行
 */
export async function cancelExecutionRun(id: string) {
    return request<AutoHealing.SuccessResponse>(`/api/v1/execution-runs/${id}/cancel`, {
        method: 'POST',
    });
}

/**
 * 创建 SSE 实时日志流连接
 * @param id 执行记录 ID
 * @param onLog 日志回调
 * @param onDone 完成回调
 * @returns 关闭连接的函数
 */
export function createLogStream(
    id: string,
    onLog: (log: AutoHealing.ExecutionLog) => void,
    onDone: (result: { status: string; exit_code: number; stats?: AutoHealing.ExecutionRun['stats'] }) => void,
): () => void {
    // SSE 直接连接后端，绕过 dev server 代理（代理会缓冲 SSE 响应）
    // 在开发环境使用后端端口 8080，生产环境使用当前 origin
    const isDev = window.location.port === '8000';
    const baseUrl = isDev ? `${window.location.protocol}//${window.location.hostname}:8080` : window.location.origin;

    // 浏览器 EventSource API 不支持自定义请求头，需通过 URL 参数传递 JWT Token
    const token = localStorage.getItem('auto_healing_token');
    const url = token
        ? `${baseUrl}/api/v1/execution-runs/${id}/stream?token=${encodeURIComponent(token)}`
        : `${baseUrl}/api/v1/execution-runs/${id}/stream`;

    console.log('[SSE] Creating EventSource:', url);
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
    };

    eventSource.addEventListener('log', (event) => {
        console.log('[SSE] Received log event:', event.data.substring(0, 100));
        try {
            const data = JSON.parse(event.data);
            onLog(data);
        } catch (e) {
            console.error('Failed to parse log event:', e);
        }
    });

    eventSource.addEventListener('done', (event) => {
        console.log('[SSE] Received done event:', event.data);
        try {
            const data = JSON.parse(event.data);
            onDone(data);
        } catch (e) {
            console.error('Failed to parse done event:', e);
        }
        eventSource.close();
    });

    eventSource.onerror = (e) => {
        console.error('[SSE] Error:', e);
        eventSource.close();
    };

    return () => {
        console.log('[SSE] Closing connection');
        eventSource.close();
    };
}


// ==================== 定时调度 ====================

/**
 * 获取定时调度列表
 */
export async function getExecutionSchedules(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    task_id?: string;
    enabled?: boolean;
    schedule_type?: string;  // 'cron' | 'once'
    status?: string;         // 'running' | 'pending' | 'completed' | 'disabled'
}) {
    return request<{ data: AutoHealing.ExecutionSchedule[]; total: number }>('/api/v1/execution-schedules', {
        method: 'GET',
        params,
    });
}

/**
 * 获取定时调度详情
 */
export async function getExecutionSchedule(id: string) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/execution-schedules/${id}`, {
        method: 'GET',
    });
}

/**
 * 创建定时调度
 */
export async function createExecutionSchedule(data: AutoHealing.CreateExecutionScheduleRequest) {
    return request<{ data: AutoHealing.ExecutionSchedule }>('/api/v1/execution-schedules', {
        method: 'POST',
        data,
    });
}

/**
 * 更新定时调度
 */
export async function updateExecutionSchedule(id: string, data: AutoHealing.UpdateExecutionScheduleRequest) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/execution-schedules/${id}`, {
        method: 'PUT',
        data,
    });
}

/**
 * 删除定时调度
 */
export async function deleteExecutionSchedule(id: string) {
    return request<void>(`/api/v1/execution-schedules/${id}`, {
        method: 'DELETE',
    });
}

/**
 * 启用定时调度
 */
export async function enableExecutionSchedule(id: string) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/execution-schedules/${id}/enable`, {
        method: 'POST',
    });
}

/**
 * 禁用定时调度
 */
export async function disableExecutionSchedule(id: string) {
    return request<{ data: AutoHealing.ExecutionSchedule }>(`/api/v1/execution-schedules/${id}/disable`, {
        method: 'POST',
    });
}

