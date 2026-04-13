import { __TEST_ONLY__ } from './sse';

describe('sse helpers', () => {
  it('keeps event/data state across chunk boundaries', () => {
    const onEvent = jest.fn();
    const parser = __TEST_ONLY__.createSSEEventParser({ onEvent });

    parser.push('event: node_start\n');
    parser.push('data: {"data":{"node_id":"node-1","status":"running"}}\n\n');

    expect(onEvent).toHaveBeenCalledWith('node_start', {
      data: { node_id: 'node-1', status: 'running' },
    });
  });

  it('joins multi-line data payloads before dispatch', () => {
    const onEvent = jest.fn();
    const parser = __TEST_ONLY__.createSSEEventParser({ onEvent });

    parser.push('event: message\n');
    parser.push('data: first line\n');
    parser.push('data: second line\n\n');

    expect(onEvent).toHaveBeenCalledWith('message', 'first line\nsecond line');
  });

  it('falls back to relative api paths when SSE base points to loopback from a remote browser host', () => {
    expect(
      __TEST_ONLY__.resolveSSEStreamUrl('/api/v1/tenant/execution-runs/run-1/stream', {
        configuredBase: 'http://localhost:8080',
        browserHostname: 'demo.example.com',
      }),
    ).toBe('/api/v1/tenant/execution-runs/run-1/stream');
  });

  it('keeps explicit non-loopback SSE bases when they are intentionally configured', () => {
    expect(
      __TEST_ONLY__.resolveSSEStreamUrl('/api/v1/tenant/site-messages/events', {
        configuredBase: 'https://api.example.com',
        browserHostname: 'demo.example.com',
      }),
    ).toBe('https://api.example.com/api/v1/tenant/site-messages/events');
  });
});
