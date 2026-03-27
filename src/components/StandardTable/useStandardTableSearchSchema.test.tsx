import { renderHook, waitFor } from '@testing-library/react';
import { request as umiRequest } from '@umijs/max';
import { useStandardTableSearchSchema } from './useStandardTableSearchSchema';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('useStandardTableSearchSchema', () => {
  it('loads dynamic schema fields and merges them ahead of static extras', async () => {
    (umiRequest as jest.Mock).mockResolvedValueOnce({
      data: {
        fields: [
          {
            key: 'status',
            label: '状态',
            type: 'enum',
            options: [{ label: '启用', value: 'active' }],
            default_match_mode: 'exact',
          },
        ],
      },
    });

    const { result } = renderHook(() =>
      useStandardTableSearchSchema(
        [
          { key: 'name', label: '名称', type: 'input' },
          { key: 'status', label: '静态状态', type: 'input' },
        ],
        '/api/v1/schema',
      ),
    );

    await waitFor(() => {
      expect(result.current.effectiveAdvancedSearchFields).toEqual([
        {
          key: 'status',
          label: '状态',
          type: 'select',
          options: [{ label: '启用', value: 'active' }],
          placeholder: undefined,
          description: undefined,
          defaultMatchMode: 'exact',
        },
        {
          key: 'name',
          label: '名称',
          type: 'input',
        },
      ]);
    });
  });

  it('falls back to static fields when schema loading fails', async () => {
    (umiRequest as jest.Mock).mockRejectedValueOnce(new Error('schema failed'));

    const { result } = renderHook(() =>
      useStandardTableSearchSchema(
        [{ key: 'name', label: '名称', type: 'input' }],
        '/api/v1/schema',
      ),
    );

    await waitFor(() => {
      expect(result.current.effectiveAdvancedSearchFields).toEqual([
        { key: 'name', label: '名称', type: 'input' },
      ]);
    });
  });
});
