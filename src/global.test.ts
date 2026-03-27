const mockWarning = jest.fn();
const mockNotificationOpen = jest.fn();
const mockNotificationDestroy = jest.fn();

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  return {
    ...actual,
    message: {
      ...actual.message,
      warning: mockWarning,
    },
    notification: {
      ...actual.notification,
      open: mockNotificationOpen,
      destroy: mockNotificationDestroy,
    },
  };
});

describe('global runtime', () => {
  it('handles PWA offline events without React hook calls', () => {
    jest.isolateModules(() => {
      require('./global');
    });

    window.dispatchEvent(new Event('sw.offline'));

    expect(mockWarning).toHaveBeenCalledWith('当前处于离线状态');
  });
});
