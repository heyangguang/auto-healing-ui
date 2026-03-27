export type SSEEventParser = {
    flush: () => void;
    push: (text: string) => void;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function unwrapSSEPayload(payload: unknown): unknown {
    return isRecord(payload) && 'data' in payload ? payload.data : payload;
}

export function createSSEEventParser(callbacks: {
    onEvent: (event: string, payload: unknown) => void;
    onParseError?: (rawData: string, error: unknown) => void;
}): SSEEventParser {
    let buffer = '';
    let currentEvent = '';
    let currentDataLines: string[] = [];

    const flushEvent = () => {
        if (!currentEvent) {
            currentDataLines = [];
            return;
        }

        const rawData = currentDataLines.join('\n');
        let payload: unknown = rawData;
        if (rawData) {
            try {
                payload = JSON.parse(rawData);
            } catch (error) {
                callbacks.onParseError?.(rawData, error);
            }
        }

        callbacks.onEvent(currentEvent, payload);
        currentEvent = '';
        currentDataLines = [];
    };

    const processLine = (rawLine: string) => {
        const line = rawLine.replace(/\r$/, '');
        if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            return;
        }
        if (line.startsWith('data:')) {
            currentDataLines.push(line.slice(5).trimStart());
            return;
        }
        if (line === '') {
            flushEvent();
        }
    };

    return {
        flush: () => {
            if (buffer) {
                processLine(buffer);
                buffer = '';
            }
            flushEvent();
        },
        push: (text: string) => {
            buffer += text;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                processLine(line);
            }
        },
    };
}

export function dispatchDryRunStreamEvent(
    event: string,
    payload: unknown,
    callbacks: import('./sseTypes').DryRunSSECallbacks,
) {
    const eventData = unwrapSSEPayload(payload);

    switch (event) {
        case 'flow_start':
            if (isRecord(eventData)) {
                callbacks.onFlowStart?.(
                    String(eventData.flow_id || ''),
                    String(eventData.flow_name || ''),
                );
            }
            break;
        case 'node_start':
            if (isRecord(eventData)) {
                callbacks.onNodeStart?.(eventData as unknown as import('./sseTypes').SSENodeStartData);
            }
            break;
        case 'node_log':
            if (isRecord(eventData)) {
                callbacks.onNodeLog?.(eventData as unknown as import('./sseTypes').SSENodeLogData);
            }
            break;
        case 'node_complete':
            if (isRecord(eventData)) {
                callbacks.onNodeComplete?.(eventData as unknown as import('./sseTypes').SSENodeCompleteData);
            }
            break;
        case 'flow_complete':
            if (isRecord(eventData)) {
                callbacks.onFlowComplete?.(eventData as unknown as import('./sseTypes').SSEFlowCompleteData);
            }
            break;
        default:
            break;
    }
}
