import { globalSearch } from './search';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing search service', () => {
  it('unwraps the common search envelope into a stable payload', async () => {
    (request as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            category: 'flows',
            category_label: '自愈流程',
            total: 1,
            items: [
              {
                id: 'flow-1',
                title: 'Disk Heal',
                description: 'flow',
                path: '/healing/flows/flow-1',
                extra: { status: 'active' },
              },
            ],
          },
        ],
        total_count: 1,
      },
    });

    await expect(globalSearch({ q: 'disk', limit: 5 })).resolves.toEqual({
      results: [
        {
          category: 'flows',
          category_label: '自愈流程',
          total: 1,
          items: [
            {
              id: 'flow-1',
              title: 'Disk Heal',
              description: 'flow',
              path: '/healing/flows/flow-1',
              extra: { status: 'active' },
            },
          ],
        },
      ],
      total_count: 1,
    });
  });
});
