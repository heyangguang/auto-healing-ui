import {
  buildCategoryMap,
  buildSiteMessageRequestParams,
  buildSystemMessageAdvancedSearchFields,
} from './messagePageShared';

describe('messagePageShared', () => {
  it('builds category map and advanced search options from categories', () => {
    const categories = [
      { value: 'system', label: '系统' },
      { value: 'security', label: '安全' },
    ];

    expect(buildCategoryMap(categories)).toEqual({
      system: '系统',
      security: '安全',
    });
    expect(buildSystemMessageAdvancedSearchFields(categories)).toEqual([
      {
        key: 'category',
        label: '分类',
        type: 'select',
        options: [
          { label: '系统', value: 'system' },
          { label: '安全', value: 'security' },
        ],
      },
      {
        key: 'is_read',
        label: '阅读状态',
        type: 'select',
        options: [
          { label: '未读', value: 'false' },
          { label: '已读', value: 'true' },
        ],
      },
    ]);
  });

  it('maps keyword, category, read-state and sorter to site-message request params', () => {
    expect(buildSiteMessageRequestParams({
      page: 2,
      pageSize: 50,
      searchValue: 'fallback keyword',
      advancedSearch: {
        keyword: 'urgent',
        category: 'system',
        is_read: 'false',
      },
      sorter: {
        field: 'created_at',
        order: 'ascend',
      },
    })).toEqual({
      page: 2,
      page_size: 50,
      keyword: 'urgent',
      category: 'system',
      is_read: false,
      sort: 'created_at',
      order: 'asc',
    });
  });
});
