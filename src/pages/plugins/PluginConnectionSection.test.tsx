import { BASIC_AUTH_USERNAME_RULES } from './pluginFormHelpers';

describe('PluginConnectionSection', () => {
  it('keeps the basic auth username rule strict', () => {
    expect(BASIC_AUTH_USERNAME_RULES).toEqual([
      { required: true, whitespace: true, message: '请输入用户名' },
    ]);
  });
});
