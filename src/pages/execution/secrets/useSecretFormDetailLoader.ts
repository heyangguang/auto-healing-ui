import { message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSecretsSource } from '@/services/auto-healing/secrets';
import {
    getSecretFormInitialValues,
    mapSecretsSourceToFormValues,
    type SecretFormValues,
    type SecretsSourceConfig,
    type SecretsSourceRecord,
} from './secretFormConfig';
import { EDIT_LOAD_ERROR_MESSAGE } from './secretFormUtils';

type UseSecretFormDetailLoaderOptions = {
    form: FormInstance<SecretFormValues>;
    isEdit: boolean;
    sourceId?: string;
};

export function useSecretFormDetailLoader(options: UseSecretFormDetailLoaderOptions) {
    const { form, isEdit, sourceId } = options;
    const [loadError, setLoadError] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [loadedSourceId, setLoadedSourceId] = useState<string>();
    const [loadedVaultAuthType, setLoadedVaultAuthType] = useState<string>();
    const [loadedWebhookAuthType, setLoadedWebhookAuthType] = useState<string>();
    const originalConfigRef = useRef<SecretsSourceConfig>({});
    const loadRequestIdRef = useRef(0);

    const resetFormState = useCallback(() => {
        originalConfigRef.current = {};
        setLoadError(undefined);
        setLoadedSourceId(undefined);
        setLoadedVaultAuthType(undefined);
        setLoadedWebhookAuthType(undefined);
        form.resetFields();
        form.setFieldsValue(getSecretFormInitialValues());
    }, [form]);

    useEffect(() => {
        if (!isEdit || !sourceId) {
            loadRequestIdRef.current += 1;
            setLoading(false);
            resetFormState();
            return;
        }

        const requestId = loadRequestIdRef.current + 1;
        loadRequestIdRef.current = requestId;
        setLoading(true);
        resetFormState();

        getSecretsSource(sourceId)
            .then((source) => {
                if (loadRequestIdRef.current !== requestId) {
                    return;
                }
                const record = source as SecretsSourceRecord;
                const config = record.config || {};
                originalConfigRef.current = config;
                setLoadedSourceId(record.id);
                setLoadedVaultAuthType(config.auth?.type || 'token');
                setLoadedWebhookAuthType(config.auth?.type || 'none');
                form.setFieldsValue(mapSecretsSourceToFormValues(record));
            })
            .catch((error: unknown) => {
                if (loadRequestIdRef.current === requestId) {
                    resetFormState();
                    const messageText = error instanceof Error ? error.message : EDIT_LOAD_ERROR_MESSAGE;
                    setLoadError(messageText);
                    message.error(messageText);
                }
            })
            .finally(() => {
                if (loadRequestIdRef.current === requestId) {
                    setLoading(false);
                }
            });
    }, [form, isEdit, resetFormState, sourceId]);

    return {
        loadedSourceId,
        loadedVaultAuthType,
        loadedWebhookAuthType,
        loadError,
        loading,
        originalConfigRef,
    };
}
