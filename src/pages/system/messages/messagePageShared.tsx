import React from 'react';
import {
  CheckOutlined,
} from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';
import type {
  AdvancedSearchField,
  SearchField,
  StandardColumnDef,
} from '@/components/StandardTable';
import type {
  SiteMessage,
  SiteMessageCategory,
  SiteMessageQueryParams,
} from '@/services/auto-healing/siteMessage';
import { extractPlainText } from '@/utils/safeHtml';
import dayjs from 'dayjs';
import { reportSystemMessageActionError } from './actionError';

const { Text } = Typography;

type TableSorter = {
  field: string;
  order: 'ascend' | 'descend';
};

type MessageAdvancedSearch = {
  keyword?: string;
  category?: string;
  is_read?: string;
};

export interface SiteMessageTableRequestParams {
  page: number;
  pageSize: number;
  searchField?: string;
  searchValue?: string;
  advancedSearch?: MessageAdvancedSearch;
  sorter?: TableSorter;
}

export interface SiteMessageListParams extends SiteMessageQueryParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export const systemMessageSearchFields: SearchField[] = [
  { key: 'keyword', label: '关键字' },
];

export const systemMessageHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <title>站内信图标</title>
    <path d="M24 4C17.4 4 12 9.4 12 16v8l-4 4v2h32v-2l-4-4v-8c0-6.6-5.4-12-12-12z" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M20 34c0 2.2 1.8 4 4 4s4-1.8 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="36" cy="10" r="4" fill="currentColor" opacity="0.3" />
  </svg>
);

export function buildCategoryMap(categories: SiteMessageCategory[]) {
  return categories.reduce<Record<string, string>>((accumulator, category) => {
    accumulator[category.value] = category.label;
    return accumulator;
  }, {});
}

export function buildSystemMessageAdvancedSearchFields(
  categories: SiteMessageCategory[],
): AdvancedSearchField[] {
  return [
    {
      key: 'category',
      label: '分类',
      type: 'select',
      options: categories.map((category) => ({ label: category.label, value: category.value })),
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
  ];
}

export function buildSiteMessageRequestParams(
  params: SiteMessageTableRequestParams,
): SiteMessageListParams {
  const apiParams: SiteMessageListParams = {
    page: params.page,
    page_size: params.pageSize,
  };

  if (params.searchValue) {
    apiParams.keyword = params.searchValue;
  }
  if (params.advancedSearch?.keyword) {
    apiParams.keyword = params.advancedSearch.keyword;
  }
  if (params.advancedSearch?.category) {
    apiParams.category = params.advancedSearch.category;
  }
  if (params.advancedSearch?.is_read !== undefined && params.advancedSearch.is_read !== '') {
    apiParams.is_read = params.advancedSearch.is_read === 'true';
  }
  if (params.sorter) {
    apiParams.sort = params.sorter.field;
    apiParams.order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  return apiParams;
}

export interface SystemMessageColumnsOptions {
  categoryMap: Record<string, string>;
  onOpenDetail: (record: SiteMessage) => void;
  onMarkAsRead: (record: SiteMessage) => Promise<void>;
}

function createCategoryColumn(
  categoryMap: Record<string, string>,
): StandardColumnDef<SiteMessage> {
  return {
    columnKey: 'category',
    columnTitle: '分类',
    dataIndex: 'category',
    width: 140,
    ellipsis: true,
    render: (_, record) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tooltip title={record.is_read ? '已读' : '未读'}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: record.is_read ? '#d9d9d9' : '#1677ff', flexShrink: 0 }} />
        </Tooltip>
        <Text type="secondary" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {categoryMap[record.category] || record.category}
        </Text>
      </span>
    ),
  };
}

function createTitleColumn(
  onOpenDetail: (record: SiteMessage) => void,
): StandardColumnDef<SiteMessage> {
  return {
    columnKey: 'title',
    columnTitle: '标题',
    dataIndex: 'title',
    fixedColumn: true,
    width: 240,
    ellipsis: true,
    render: (_, record) => (
      <a style={{ fontWeight: record.is_read ? 400 : 600, color: '#1677ff', cursor: 'pointer' }} onClick={(event) => { event.stopPropagation(); onOpenDetail(record); }}>
        {record.title}
      </a>
    ),
  };
}

function createSummaryColumn(): StandardColumnDef<SiteMessage> {
  return {
    columnKey: 'summary',
    columnTitle: '内容摘要',
    dataIndex: 'content',
    ellipsis: true,
    render: (_, record) => {
      const summary = extractPlainText(record.content);
      const shortened = summary.length > 60 ? `${summary.substring(0, 60)}…` : summary;
      return <Text type="secondary" style={{ fontSize: 12 }}>{shortened}</Text>;
    },
  };
}

function createActionColumn(
  onMarkAsRead: (record: SiteMessage) => Promise<void>,
): StandardColumnDef<SiteMessage> {
  return {
    columnKey: 'actions',
    columnTitle: '操作',
    fixedColumn: true,
    width: 50,
    render: (_, record) => (
      !record.is_read ? (
        <Tooltip title="标记已读">
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={(event) => {
            event.stopPropagation();
            void onMarkAsRead(record).catch((error) => {
              reportSystemMessageActionError('行内标记已读', error);
            });
          }} />
        </Tooltip>
      ) : null
    ),
  };
}

export function createSystemMessageColumns({
  categoryMap,
  onOpenDetail,
  onMarkAsRead,
}: SystemMessageColumnsOptions): StandardColumnDef<SiteMessage>[] {
  return [
    createCategoryColumn(categoryMap),
    createTitleColumn(onOpenDetail),
    createSummaryColumn(),
    {
      columnKey: 'created_at',
      columnTitle: '时间',
      dataIndex: 'created_at',
      width: 160,
      sorter: true,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
        </Text>
      ),
    },
    createActionColumn(onMarkAsRead),
  ];
}
