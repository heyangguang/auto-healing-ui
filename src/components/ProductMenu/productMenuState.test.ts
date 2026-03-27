import { resolveActiveCategoryId } from './productMenuState';

describe('productMenuState', () => {
  it('keeps the current category when it is still visible', () => {
    expect(resolveActiveCategoryId([
      { id: 'execution' },
      { id: 'healing' },
    ], 'healing')).toBe('healing');
  });

  it('falls back to the first visible non-guide category when current one is hidden', () => {
    expect(resolveActiveCategoryId([
      { id: 'guide' },
      { id: 'execution' },
      { id: 'security' },
    ], 'healing')).toBe('execution');
  });
});
