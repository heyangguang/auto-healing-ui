import { extractErrorMsg } from './errorMsg';

describe('extractErrorMsg', () => {
  it('prefers backend-attached messages over response envelopes and generic errors', () => {
    expect(extractErrorMsg({
      _backendMessage: '后端优先错误',
      response: { data: { message: '不会被选中' } },
      message: 'fallback message',
    }, '默认错误')).toBe('后端优先错误');

    expect(extractErrorMsg({
      response: { data: { error: { message: '结构化错误' } } },
    }, '默认错误')).toBe('结构化错误');

    expect(extractErrorMsg({
      message: 'plain error',
    }, '默认错误')).toBe('plain error');
  });
});
