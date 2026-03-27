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
});

