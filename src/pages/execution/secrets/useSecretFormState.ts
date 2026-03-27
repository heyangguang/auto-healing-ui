import { history, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useState } from 'react';
import { createSecretsSource, updateSecretsSource } from '@/services/auto-healing/secrets';
import {
    buildSecretsSourcePayload,
    getAvailableSourceTypes,
    type SecretFormValues,
} from './secretFormConfig';
import { useSecretFormDetailLoader } from './useSecretFormDetailLoader';
import { useSecretFormFieldEffects } from './useSecretFormFieldEffects';
import { EDIT_NOT_READY_MESSAGE } from './secretFormUtils';

type UseSecretFormStateOptions = {
    form: FormInstance<SecretFormValues>;
};

export function useSecretFormState(options: UseSecretFormStateOptions) {
    const { form } = options;
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [submitting, setSubmitting] = useState(false);
    const authType = Form.useWatch('auth_type', form) || 'ssh_key';
    const sourceType = Form.useWatch('type', form) || 'file';
    const vaultAuthType = Form.useWatch('vault_auth_type', form) || 'token';
    const webhookAuthType = Form.useWatch('webhook_auth_type', form) || 'none';
    const availableSourceTypes = getAvailableSourceTypes(authType);
    const detail = useSecretFormDetailLoader({
        form,
        isEdit,
        sourceId: params.id,
    });

    useSecretFormFieldEffects({
        availableSourceTypes,
        form,
        isEdit,
        sourceType,
        vaultAuthType,
        webhookAuthType,
    });

    const handleSubmit = useCallback(async () => {
        if (isEdit && detail.loadedSourceId !== params.id) {
            throw new Error(detail.loadError || EDIT_NOT_READY_MESSAGE);
        }

        const values = await form.validateFields();
        setSubmitting(true);

        try {
            const payload = buildSecretsSourcePayload({
                isEdit,
                originalConfig: detail.originalConfigRef.current || {},
                values,
            });

            if (isEdit && params.id) {
                await updateSecretsSource(params.id, payload);
                message.success('更新成功');
            } else {
                await createSecretsSource(payload);
                message.success('创建成功');
            }

            history.push('/resources/secrets');
        } finally {
            setSubmitting(false);
        }
    }, [detail.loadError, detail.loadedSourceId, detail.originalConfigRef, form, isEdit, params.id]);

    return {
        authType,
        availableSourceTypes,
        handleSubmit,
        isEdit,
        loadedVaultAuthType: detail.loadedVaultAuthType,
        loadedWebhookAuthType: detail.loadedWebhookAuthType,
        loadError: detail.loadError,
        loading: detail.loading,
        sourceType,
        submitting,
        vaultAuthType,
        webhookAuthType,
    };
}
