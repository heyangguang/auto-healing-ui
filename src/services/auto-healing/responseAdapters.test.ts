import {
  normalizePaginatedResponse,
  unwrapData,
  unwrapItems,
} from './responseAdapters';

describe('responseAdapters', () => {
  it('unwraps data envelopes into plain payloads', () => {
    expect(unwrapData({ data: { id: 'user-1' } })).toEqual({ id: 'user-1' });
    expect(unwrapData({ id: 'user-2' })).toEqual({ id: 'user-2' });
  });

  it('unwraps array items from top-level and nested envelopes', () => {
    expect(unwrapItems([{ id: 'a' }])).toEqual([{ id: 'a' }]);
    expect(unwrapItems({ data: [{ id: 'b' }] })).toEqual([{ id: 'b' }]);
    expect(unwrapItems({ data: { items: [{ id: 'c' }] } })).toEqual([{ id: 'c' }]);
  });

  it('normalizes paginated responses into one stable shape', () => {
    expect(
      normalizePaginatedResponse({
        data: { items: [{ id: 'row-1' }], total: 12, page: 2, page_size: 20 },
      }),
    ).toEqual({
      data: [{ id: 'row-1' }],
      total: 12,
      page: 2,
      page_size: 20,
    });
  });
});
