import { useMemo, useState } from 'react';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import type { FilterNotification } from './scheduleFormHelpers';

export function useScheduleTemplatePicker(templates: AutoHealing.ExecutionTask[]) {
    const [searchText, setSearchText] = useState('');
    const [filterExecutor, setFilterExecutor] = useState('');
    const [filterNotification, setFilterNotification] = useState<FilterNotification>('');
    const [onlyReady, setOnlyReady] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const filteredTemplates = useMemo(() => {
        let result = templates;
        if (searchText) {
            const keyword = searchText.toLowerCase();
            result = result.filter((template) => (
                template.name?.toLowerCase().includes(keyword)
                || template.playbook?.name?.toLowerCase().includes(keyword)
                || template.description?.toLowerCase().includes(keyword)
            ));
        }
        if (filterExecutor) result = result.filter((template) => template.executor_type === filterExecutor);
        if (filterNotification === 'yes') result = result.filter((template) => hasEffectiveNotificationConfig(template.notification_config));
        if (filterNotification === 'no') result = result.filter((template) => !hasEffectiveNotificationConfig(template.notification_config));
        if (onlyReady) result = result.filter((template) => !template.needs_review && (!template.playbook || template.playbook.status === 'ready'));
        return result;
    }, [filterExecutor, filterNotification, onlyReady, searchText, templates]);

    const paginatedTemplates = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTemplates.slice(start, start + pageSize);
    }, [currentPage, filteredTemplates, pageSize]);

    return {
        currentPage,
        filteredTemplates,
        filterExecutor,
        filterNotification,
        onlyReady,
        paginatedTemplates,
        pageSize,
        searchText,
        setCurrentPage,
        setFilterExecutor,
        setFilterNotification,
        setOnlyReady,
        setPageSize,
        setSearchText,
    };
}
