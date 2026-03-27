import { message } from 'antd';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type MutableRefObject,
} from 'react';
import {
    confirmExecutionTaskReview,
    getExecutionTask,
} from '@/services/auto-healing/execution';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import {
    getCachedNotificationChannelInventory,
    getCachedNotificationTemplateInventory,
    invalidateSelectorInventory,
    selectorInventoryKeys,
} from '@/utils/selectorInventoryCache';
import { createRequestSequence } from '@/utils/requestSequence';

function isCurrentTemplateAction(options: {
    currentIdRef: MutableRefObject<string | undefined>;
    requestSequence: ReturnType<typeof createRequestSequence>;
    templateId: string;
    token: number;
}) {
    const {
        currentIdRef,
        requestSequence,
        templateId,
        token,
    } = options;
    return requestSequence.isCurrent(token) && currentIdRef.current === templateId;
}

function hasRejectedReferenceResult(results: PromiseSettledResult<unknown>[]) {
    return results.some((result) => result.status === 'rejected');
}

export function useTemplateDetailData(id?: string) {
    const [channels, setChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [confirming, setConfirming] = useState(false);
    const [detailLoadError, setDetailLoadError] = useState<string>();
    const [loading, setLoading] = useState(true);
    const [referenceLoadError, setReferenceLoadError] = useState<string>();
    const [secretsSources, setSecretsSources] = useState<AutoHealing.SecretsSource[]>([]);
    const [task, setTask] = useState<AutoHealing.ExecutionTask>();
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const currentIdRef = useRef<string | undefined>(id);
    const loadRequestSequenceRef = useRef(createRequestSequence());
    const confirmRequestSequenceRef = useRef(createRequestSequence());

    const loadTemplateDetail = useCallback(async (templateId: string) => {
        const token = loadRequestSequenceRef.current.next();
        setLoading(true);
        setDetailLoadError(undefined);
        setReferenceLoadError(undefined);

        const [taskResult, secretsResult, channelsResult, templatesResult] = await Promise.allSettled([
            getExecutionTask(templateId),
            getSecretsSources(),
            getCachedNotificationChannelInventory(),
            getCachedNotificationTemplateInventory(),
        ]);

        if (!isCurrentTemplateAction({
            currentIdRef,
            requestSequence: loadRequestSequenceRef.current,
            templateId,
            token,
        })) {
            return;
        }

        if (taskResult.status === 'rejected') {
            setTask(undefined);
            setSecretsSources([]);
            setChannels([]);
            setTemplates([]);
            setDetailLoadError('加载任务模板详情失败');
            setLoading(false);
            return;
        }

        setTask(taskResult.value.data);
        setSecretsSources(secretsResult.status === 'fulfilled' ? secretsResult.value.data || [] : []);
        setChannels(channelsResult.status === 'fulfilled' ? channelsResult.value : []);
        setTemplates(templatesResult.status === 'fulfilled' ? templatesResult.value : []);

        if (hasRejectedReferenceResult([secretsResult, channelsResult, templatesResult])) {
            setReferenceLoadError('模板详情依赖数据加载失败');
        }

        if (isCurrentTemplateAction({
            currentIdRef,
            requestSequence: loadRequestSequenceRef.current,
            templateId,
            token,
        })) {
            setLoading(false);
        }
    }, []);

    const handleConfirmReview = useCallback(async () => {
        if (!id) {
            return;
        }

        const templateId = id;
        const token = confirmRequestSequenceRef.current.next();
        setConfirming(true);

        try {
            await confirmExecutionTaskReview(templateId);
            if (!isCurrentTemplateAction({
                currentIdRef,
                requestSequence: confirmRequestSequenceRef.current,
                templateId,
                token,
            })) {
                return;
            }

            invalidateSelectorInventory(selectorInventoryKeys.executionTasks);
            message.success('变量变更已确认');
            await loadTemplateDetail(templateId);
        } catch {
            message.error('确认失败');
        } finally {
            if (isCurrentTemplateAction({
                currentIdRef,
                requestSequence: confirmRequestSequenceRef.current,
                templateId,
                token,
            })) {
                setConfirming(false);
            }
        }
    }, [id, loadTemplateDetail]);

    useEffect(() => {
        currentIdRef.current = id;
        setTask(undefined);
        setSecretsSources([]);
        setChannels([]);
        setTemplates([]);
        setDetailLoadError(undefined);
        setReferenceLoadError(undefined);

        if (!id) {
            setLoading(false);
            return () => {
                loadRequestSequenceRef.current.invalidate();
                confirmRequestSequenceRef.current.invalidate();
            };
        }

        void loadTemplateDetail(id);

        return () => {
            loadRequestSequenceRef.current.invalidate();
            confirmRequestSequenceRef.current.invalidate();
        };
    }, [id, loadTemplateDetail]);

    return {
        channels,
        confirming,
        detailLoadError,
        handleConfirmReview,
        loading,
        referenceLoadError,
        reload: loadTemplateDetail,
        secretsSources,
        task,
        templates,
    };
}
