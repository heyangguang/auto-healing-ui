import { renderHook, waitFor } from '@testing-library/react';
import { useStandardTableSearchSchema } from './useStandardTableSearchSchema';

describe('useStandardTableSearchSchema', () => {
  it('loads dynamic schema fields and merges them ahead of static extras', async () => {
    const searchSchemaRequest = jest.fn().mockResolvedValueOnce({
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
        searchSchemaRequest,
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
      expect(result.current.schemaLoadError).toBeNull();
    });
  });

  it('keeps static fields but exposes the schema error when loading fails', async () => {
    const searchSchemaRequest = jest.fn().mockRejectedValueOnce(new Error('schema failed'));

    const { result } = renderHook(() =>
      useStandardTableSearchSchema(
        [{ key: 'name', label: '名称', type: 'input' }],
        searchSchemaRequest,
      ),
    );

    await waitFor(() => {
      expect(result.current.effectiveAdvancedSearchFields).toEqual([
        { key: 'name', label: '名称', type: 'input' },
      ]);
      expect(result.current.schemaLoadError).toBe('后端搜索 Schema 加载失败: schema failed');
    });
  });
});
