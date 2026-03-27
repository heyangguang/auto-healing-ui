/**
 * SSE 辅助函数
 * 用于连接后端 SSE 流式接口
 */
import { getTenantContextHeaders } from '@/utils/tenantContext';
import * as sseParser from './sseParser';
import type {
    SSEFlowCompleteData,
    SSENodeCompleteData,
    SSENodeLogData,
    SSENodeStartData,
} from './sseTypes';
import type {
    AuthenticatedSSECallbacks,
    DryRunSSECallbacks,
    DryRunStreamRequest,
    SSEConnection,
} from './sseTypes';

export type {
    DryRunSSECallbacks,
    NodeStatus,
    SSEConnection,
    SSEFlowCompleteData,
    SSENodeCompleteData,
    SSENodeLogData,
    SSENodeStartData,
} from './sseTypes';

// 获取认证 Token
const getAuthToken = (): string => {
    return localStorage.getItem('auto_healing_token')
        || sessionStorage.getItem('auto_healing_token')
        || '';
};

function coerceSSEPayload<T>(value: Record<string, unknown>): T {
    return value as unknown as T;
}

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
            const parser = sseParser.createSSEEventParser({
                onEvent: (event, payload) => callbacks.onEvent?.(event, payload),
            });

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    parser.flush();
                    break;
                }

                parser.push(decoder.decode(value, { stream: true }));
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

/**
 * 创建 Dry-Run SSE 流
 * 使用 fetch + ReadableStream 实现 POST SSE
 */
export const createDryRunStream = async (
    flowId: string,
    request: DryRunStreamRequest,
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
        const parser = sseParser.createSSEEventParser({
            onEvent: (event, payload) => sseParser.dispatchDryRunStreamEvent(event, payload, callbacks),
            onParseError: (rawData, error) => {
                console.error('Failed to parse SSE data:', rawData, error);
            },
        });

        // 读取流
        const readStream = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        parser.flush();
                        break;
                    }
                    parser.push(decoder.decode(value, { stream: true }));
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
                }
            }
        };

        readStream();

    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
            callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
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
                const data = sseParser.unwrapSSEPayload(payload);
                switch (event) {
                    case 'connected':
                        console.log('[SSE] Instance stream connected:', instanceId);
                        break;
                    case 'node_start':
                        if (sseParser.isRecord(data)) {
                            callbacks.onNodeStart?.(coerceSSEPayload<SSENodeStartData>(data));
                        }
                        break;
                    case 'node_log':
                        if (sseParser.isRecord(data)) {
                            callbacks.onNodeLog?.(coerceSSEPayload<SSENodeLogData>(data));
                        }
                        break;
                    case 'node_complete':
                        if (sseParser.isRecord(data)) {
                            callbacks.onNodeComplete?.(coerceSSEPayload<SSENodeCompleteData>(data));
                        }
                        break;
                    case 'flow_complete':
                        if (sseParser.isRecord(data)) {
                            callbacks.onFlowComplete?.(coerceSSEPayload<SSEFlowCompleteData>(data));
                        }
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

export const __TEST_ONLY__ = {
    createSSEEventParser: sseParser.createSSEEventParser,
    dispatchDryRunStreamEvent: sseParser.dispatchDryRunStreamEvent,
};
