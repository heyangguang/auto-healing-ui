import { formatChannelTypeDisplayList, getChannelTypeDisplayLabel, getChannelTypeLabelMap } from './notificationDicts';

describe('notificationDicts', () => {
  it('returns a human-readable channel label for wecom', () => {
    expect(getChannelTypeDisplayLabel('wecom')).toBe('企业微信');
  });

  it('exposes the label map used by dashboard charts', () => {
    expect(getChannelTypeLabelMap()).toMatchObject({
      wecom: '企业微信',
      webhook: 'Webhook',
    });
  });

  it('formats channel type lists with display labels instead of raw keys', () => {
    expect(formatChannelTypeDisplayList(['wecom', 'email'], ', ')).toBe('企业微信, 邮件');
  });
});
