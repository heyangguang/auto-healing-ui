import { fetchAllPages } from './fetchAllPages';

describe('fetchAllPages', () => {
  it('collects pages from direct and nested item envelopes without broad casts', async () => {
    const directFetcher = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: 'a' }], total: 3 })
      .mockResolvedValueOnce({ data: [{ id: 'b' }], total: 3 })
      .mockResolvedValueOnce({ data: [{ id: 'c' }], total: 3 });

    await expect(fetchAllPages(directFetcher, 1)).resolves.toEqual([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
    ]);

    const nestedFetcher = jest
      .fn()
      .mockResolvedValueOnce({ data: { items: [{ id: 'x' }], total: 2 } })
      .mockResolvedValueOnce({ items: [{ id: 'y' }], pagination: { total: 2 } });

    await expect(fetchAllPages(nestedFetcher, 1)).resolves.toEqual([
      { id: 'x' },
      { id: 'y' },
    ]);
  });

  it('throws when maxPages is reached before all data is loaded', async () => {
    const pagedFetcher = jest
      .fn()
      .mockResolvedValue({ data: [{ id: 'a' }], total: 3 });

    await expect(fetchAllPages(pagedFetcher, 1, 2)).rejects.toThrow('fetchAllPages exceeded maxPages=2');
  });
});
