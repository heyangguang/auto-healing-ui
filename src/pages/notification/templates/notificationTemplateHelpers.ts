export type NotificationTemplateStatusFilter = 'all' | 'active' | 'inactive';

type NotificationTemplateAdvancedSearch = {
    name?: string;
    event_type?: AutoHealing.EventType;
    status?: NotificationTemplateStatusFilter;
    format?: AutoHealing.TemplateFormat;
    channel_type?: AutoHealing.ChannelType;
};

export type NotificationTemplateSearchParams = {
    searchField?: string;
    searchValue?: string;
    advancedSearch?: NotificationTemplateAdvancedSearch;
    filters?: { field: string; value: string }[];
};

export type NotificationTemplateQuery = {
    page?: number;
    page_size: number;
    name?: string;
    event_type?: AutoHealing.EventType;
    is_active?: boolean;
    format?: AutoHealing.TemplateFormat;
    supported_channel?: AutoHealing.ChannelType;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
};

export const DEFAULT_TEMPLATE_FORM_VALUES = {
    is_active: true,
    format: 'text',
    supported_channels: ['webhook', 'email'],
    event_type: 'execution_result',
    body_template: '',
} as const;

export const buildPreviewTemplateVariables = () => ({
    execution: { status: 'success', status_emoji: '✅', duration: '1m 20s' },
    task: { name: 'Demo Task', target_hosts: '192.168.1.10', host_count: 5 },
    timestamp: new Date().toLocaleString(),
});

export const hasFormErrorFields = (error: unknown): error is { errorFields: unknown[] } =>
    typeof error === 'object' && error !== null && 'errorFields' in error;

export const parseTemplateSearchParams = (params: NotificationTemplateSearchParams) => {
    const filters = params.filters || [];
    const findFilterValue = (fields: string[]) =>
        filters.find((filter) => fields.includes(filter.field))?.value;

    return {
        searchText: findFilterValue(['name']) || params.advancedSearch?.name || '',
        filterEventType: findFilterValue(['__enum__event_type', 'event_type']) || params.advancedSearch?.event_type || 'all',
        filterStatus: findFilterValue(['__enum__status', 'status', 'is_active']) || params.advancedSearch?.status || 'all',
        filterFormat: findFilterValue(['__enum__format', 'format']) || params.advancedSearch?.format || 'all',
        filterChannel: findFilterValue(['__enum__channel_type', 'channel_type', 'supported_channel']) || params.advancedSearch?.channel_type || 'all',
    };
};

export const buildTemplateFilterParams = (options: {
    filterChannel: string;
    filterEventType: string;
    filterFormat: string;
    filterStatus: string;
    searchText: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    pageSize: number;
}): NotificationTemplateQuery => {
    const params: NotificationTemplateQuery = {
        page_size: options.pageSize,
        sort_by: options.sortBy,
        sort_order: options.sortOrder,
    };

    if (options.searchText.trim()) {
        params.name = options.searchText.trim();
    }
    if (options.filterEventType === 'execution_result' || options.filterEventType === 'execution_started' || options.filterEventType === 'alert') {
        params.event_type = options.filterEventType;
    }
    if (options.filterStatus === 'active' || options.filterStatus === 'inactive') {
        params.is_active = options.filterStatus === 'active';
    }
    if (options.filterFormat === 'text' || options.filterFormat === 'markdown' || options.filterFormat === 'html') {
        params.format = options.filterFormat;
    }
    if (options.filterChannel === 'webhook' || options.filterChannel === 'dingtalk' || options.filterChannel === 'email') {
        params.supported_channel = options.filterChannel;
    }

    return params;
};
