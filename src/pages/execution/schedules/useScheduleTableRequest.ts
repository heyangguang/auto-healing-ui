import { message } from 'antd';
import { useCallback, useRef } from 'react';
import { createRequestSequence } from '@/utils/requestSequence';
import { toDayRangeEndISO, toDayRangeStartISO } from '@/utils/dateRange';
import { getExecutionSchedules } from '@/services/auto-healing/execution';
import {
    hasBooleanishValue,
    type ScheduleAdvancedSearch,
    type ScheduleQueryParams,
    type ScheduleRequestParams,
} from './schedulePageHelpers';

export function useScheduleTableRequest(onRefreshOverview: () => void) {
    const requestSequenceRef = useRef(createRequestSequence());
    const latestTableResultRef = useRef<{ data: AutoHealing.ExecutionSchedule[]; total: number }>({ data: [], total: 0 });
    const pendingTableRequestRef = useRef<Promise<{ data: AutoHealing.ExecutionSchedule[]; total: number }> | null>(null);

    const tableRequest = useCallback(async (params: ScheduleRequestParams) => {
        const token = requestSequenceRef.current.next();
        const currentRequest = (async () => {
            onRefreshOverview();
            const apiParams: ScheduleQueryParams = {
                page: params.page || 1,
                page_size: params.pageSize || 15,
            };

            if (params.advancedSearch) {
                const cleanedSearch: ScheduleAdvancedSearch = {};
                Object.entries(params.advancedSearch).forEach(([key, value]) => {
                    const normalizedKey = key.replace(/^__enum__/, '') as keyof ScheduleAdvancedSearch;
                    cleanedSearch[normalizedKey] = value as never;
                });
                const adv = cleanedSearch;
                if (hasBooleanishValue(adv.enabled)) {
                    apiParams.enabled = adv.enabled === 'true' || adv.enabled === true;
                }
                if (hasBooleanishValue(adv.skip_notification)) {
                    apiParams.skip_notification = adv.skip_notification === 'true' || adv.skip_notification === true;
                }
                if (hasBooleanishValue(adv.has_overrides)) {
                    apiParams.has_overrides = adv.has_overrides === 'true' || adv.has_overrides === true;
                }
                if (adv.created_at && Array.isArray(adv.created_at) && adv.created_at.length === 2) {
                    const [createdFrom, createdTo] = adv.created_at;
                    if (createdFrom) {
                        apiParams.created_from = toDayRangeStartISO(createdFrom);
                    }
                    if (createdTo) {
                        apiParams.created_to = toDayRangeEndISO(createdTo);
                    }
                }
                if (adv.name) {
                    apiParams.name = adv.name;
                }
                if (adv.schedule_type) {
                    apiParams.schedule_type = adv.schedule_type;
                }
                if (adv.status) {
                    apiParams.status = adv.status;
                }
            }

            if (params.sorter?.field && params.sorter.order) {
                apiParams.sort_by = params.sorter.field;
                apiParams.sort_order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
            }

            const response = await getExecutionSchedules(apiParams);
            const result = {
                data: response.data || [],
                total: response.total || 0,
            };
            if (requestSequenceRef.current.isCurrent(token)) {
                latestTableResultRef.current = result;
            }
            return result;
        })().catch((error) => {
            if (requestSequenceRef.current.isCurrent(token)) {
                message.error('加载调度列表失败');
            }
            throw error;
        });

        pendingTableRequestRef.current = currentRequest;
        const result = await currentRequest;
        if (requestSequenceRef.current.isCurrent(token)) {
            return result;
        }
        if (pendingTableRequestRef.current && pendingTableRequestRef.current !== currentRequest) {
            return pendingTableRequestRef.current;
        }
        return latestTableResultRef.current;
    }, [onRefreshOverview]);

    return { tableRequest };
}
