/**
 * SSE 辅助函数
 * 用于连接后端 SSE 流式接口
 */
import { getTenantContextHeaders } from '@/utils/tenantContext';

// 获取认证 Token
const getAuthToken = (): string => {
    return localStorage.getItem('auto_healing_token')
        || sessionStorage.getItem('auto_healing_token')
        || '';
};

export interface SSEConnection {
    close: () => void;
}

type AuthenticatedSSECallbacks = {
    onOpen?: () => void;
    onEvent?: (event: string, payload: any) => void;
    onError?: (error: Error) => void;
};

export const createAuthenticatedEventStream = (
    url: string,
    callbacks: AuthenticatedSSECallbacks,
): SSEConnection => {
    const controller = new AbortController();
    const token = getAuthToken();

    const headers: Record<string, string> = {
        Accept: 'text/event-stream',
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    Object.assign(headers, getTenantContextHeaders(url, localStorage.getItem('is-platform-admin') === 'true'));

    void (async () => {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error(`HTTP ${response.status}`);
            }

            callbacks.onOpen?.();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let currentEvent = '';
            let currentData = '';

            const flushEvent = () => {
                if (!currentEvent) {
                    currentData = '';
                    return;
                }

                let payload: any = currentData;
                if (currentData) {
                    try {
                        payload = JSON.parse(currentData);
                    } catch {
                        payload = currentData;
                    }
                }

                callbacks.onEvent?.(currentEvent, payload);
                currentEvent = '';
                currentData = '';
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    flushEvent();
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const rawLine of lines) {
                    const line = rawLine.replace(/\r$/, '');
                    if (line.startsWith('event:')) {
                        currentEvent = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        const next = line.slice(5).trimStart();
                        currentData = currentData ? `${currentData}\n${next}` : next;
                    } else if (line === '') {
                        flushEvent();
                    }
                }
            }
        } catch (error: any) {
            if (error?.name !== 'AbortError') {
                callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
            }
        }
    })();

    return {
        close: () => controller.abort(),
    };
};

// 节点状态类型 - 与 healing-flows.md 文档一致
export type NodeStatus = 'pending' | 'running' | 'success' | 'partial' | 'failed' | 'error' | 'skipped' | 'waiting_approval';

// SSE 事件数据类型
export interface SSENodeStartData {
    node_id: string;
    node_name: string;
    node_type: string;
    status: string;
}

export interface SSENodeLogData {
    node_id: string;
    level: string;
    message: string;
    details?: Record<string, any>;
}

export interface SSENodeCompleteData {
    node_id: string;
    node_name: string;
    node_type: string;
    status: string;
    message?: string;
    /** 节点输入（上游数据 + 当前全局上下文快照） */
    input?: Record<string, any>;
    /** 执行过程日志（详细记录每一步操作） */
    process?: string[];
    /** 节点输出（传给下游的数据） */
    output?: Record<string, any>;
    /** 节点输出分支句柄（如 success, failed, partial, approved, rejected 等） */
    output_handle?: string;
}

export interface SSEFlowCompleteData {
    success: boolean;
    message: string;
    status?: string;
}

export interface DryRunSSECallbacks {
    onFlowStart?: (flowId: string, flowName: string) => void;
    onNodeStart?: (data: SSENodeStartData) => void;
    onNodeLog?: (data: SSENodeLogData) => void;
    onNodeComplete?: (data: SSENodeCompleteData) => void;
    onFlowComplete?: (data: SSEFlowCompleteData) => void;
    onError?: (error: Error) => void;
}

/**
 * 创建 Dry-Run SSE 流
 * 使用 fetch + ReadableStream 实现 POST SSE
 */
export const createDryRunStream = async (
    flowId: string,
    request: { mock_incident: any; from_node_id?: string; context?: Record<string, any>; mock_approvals?: Record<string, 'approved' | 'rejected'> },
    callbacks: DryRunSSECallbacks
): Promise<AbortController> => {
    const controller = new AbortController();
    const token = getAuthToken();
    const url = `/api/v1/tenant/healing/flows/${flowId}/dry-run-stream`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'text/event-stream',
                ...getTenantContextHeaders(url, localStorage.getItem('is-platform-admin') === 'true'),
            },
            body: JSON.stringify(request),
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is null');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const processEvents = (text: string) => {
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留未完成的行

            let currentEvent = '';
            let currentData = '';

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    currentEvent = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    currentData = line.slice(6);
                } else if (line === '' && currentEvent && currentData) {
                    // 事件完成，处理它
                    try {
                        const parsed = JSON.parse(currentData);
                        const eventData = parsed.data;

                        switch (currentEvent) {
                            case 'flow_start':
                                callbacks.onFlowStart?.(eventData.flow_id, eventData.flow_name);
                                break;
                            case 'node_start':
                                callbacks.onNodeStart?.(eventData);
                                break;
                            case 'node_log':
                                callbacks.onNodeLog?.(eventData);
                                break;
                            case 'node_complete':
                                callbacks.onNodeComplete?.(eventData);
                                break;
                            case 'flow_complete':
                                callbacks.onFlowComplete?.(eventData);
                                break;
                        }
                    } catch (e) {
                        console.error('Failed to parse SSE data:', currentData, e);
                    }
                    currentEvent = '';
                    currentData = '';
                }
            }
        };

        // 读取流
        const readStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value, { stream: true });
                    processEvents(text);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    callbacks.onError?.(error);
                }
            }
        };

        readStream();

    } catch (error: any) {
        if (error.name !== 'AbortError') {
            callbacks.onError?.(error);
        }
    }

    return controller;
};

/**
 * 创建 Instance Events SSE 流（用于实际执行监控）
 */
export const createInstanceEventStream = (
    instanceId: string,
    callbacks: DryRunSSECallbacks
): SSEConnection => {
    const sseBase = (process.env.SSE_API_BASE || '').replace(/\/+$/, '');
    const connection = createAuthenticatedEventStream(
        `${sseBase}/api/v1/tenant/healing/instances/${instanceId}/events`,
        {
            onEvent: (event, payload) => {
                const data = payload?.data ?? payload;
                switch (event) {
                    case 'connected':
                        console.log('[SSE] Instance stream connected:', instanceId);
                        break;
                    case 'node_start':
                        callbacks.onNodeStart?.(data);
                        break;
                    case 'node_log':
                        callbacks.onNodeLog?.(data);
                        break;
                    case 'node_complete':
                        callbacks.onNodeComplete?.(data);
                        break;
                    case 'flow_complete':
                        callbacks.onFlowComplete?.(data);
                        connection.close();
                        break;
                    default:
                        break;
                }
            },
            onError: () => {
                callbacks.onError?.(new Error('SSE connection error'));
            },
        },
    );

    return connection;
};
