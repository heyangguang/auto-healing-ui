import {
  batchToggleCommandBlacklistRules,
  createCommandBlacklistRule,
  deleteCommandBlacklistRule,
  getCommandBlacklist,
  getCommandBlacklistRule,
  getCommandBlacklistSearchSchema,
  simulateBlacklist,
  toggleCommandBlacklistRule,
  updateCommandBlacklistRule,
} from './commandBlacklist';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing commandBlacklist service', () => {
  it('normalizes blacklist list, detail and simulation responses', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: [{ id: 'rule-1', name: '危险命令' }], total: 7 })
      .mockResolvedValueOnce({ data: { id: 'rule-1', name: '危险命令' } })
      .mockResolvedValueOnce({ data: { id: 'rule-2', name: '新规则' } })
      .mockResolvedValueOnce({ data: { id: 'rule-1', name: '已更新规则' } })
      .mockResolvedValueOnce({ data: { id: 'rule-1', is_active: true } })
      .mockResolvedValueOnce({
        data: {
          results: [{ line: 1, content: 'rm -rf', matched: true }],
          total_lines: 1,
          match_count: 1,
          matched_files: { '/tmp/a.sh': 1 },
        },
      });

    await expect(getCommandBlacklist({ page: 1, page_size: 20 })).resolves.toEqual({
      data: [{ id: 'rule-1', name: '危险命令' }],
      total: 7,
      page: 1,
      page_size: 1,
    });
    await expect(getCommandBlacklistRule('rule-1')).resolves.toEqual({ id: 'rule-1', name: '危险命令' });
    await expect(createCommandBlacklistRule({ name: '新规则' })).resolves.toEqual({ id: 'rule-2', name: '新规则' });
    await expect(updateCommandBlacklistRule('rule-1', { name: '已更新规则' })).resolves.toEqual({ id: 'rule-1', name: '已更新规则' });
    await expect(toggleCommandBlacklistRule('rule-1')).resolves.toEqual({ id: 'rule-1', is_active: true });
    await expect(simulateBlacklist({ pattern: 'rm -rf', match_type: 'contains', content: 'rm -rf /' })).resolves.toEqual({
      results: [{ line: 1, content: 'rm -rf', matched: true }],
      total_lines: 1,
      match_count: 1,
      matched_files: { '/tmp/a.sh': 1 },
    });
  });

  it('forwards blacklist mutations and schema requests', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ message: 'deleted' })
      .mockResolvedValueOnce({ message: 'updated', count: 2 })
      .mockResolvedValueOnce({ fields: [{ key: 'name', label: '规则名称' }] });

    await expect(deleteCommandBlacklistRule('rule-9')).resolves.toEqual({ message: 'deleted' });
    await expect(batchToggleCommandBlacklistRules(['rule-1', 'rule-2'], false)).resolves.toEqual({
      message: 'updated',
      count: 2,
    });
    await expect(getCommandBlacklistSearchSchema()).resolves.toEqual({
      fields: [{ key: 'name', label: '规则名称' }],
    });

    expect(request).toHaveBeenNthCalledWith(1, '/api/v1/tenant/command-blacklist/rule-9', {
      method: 'DELETE',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/api/v1/tenant/command-blacklist/batch-toggle', {
      method: 'POST',
      data: { ids: ['rule-1', 'rule-2'], is_active: false },
    });
    expect(request).toHaveBeenNthCalledWith(3, '/api/v1/tenant/command-blacklist/search-schema', {
      method: 'GET',
    });
  });
});
