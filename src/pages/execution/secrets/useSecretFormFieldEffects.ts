import { useEffect } from 'react';
import type { FormInstance } from 'antd';
import type { SecretFormValues } from './secretFormConfig';
import { clearFormFields } from './secretFormUtils';

type UseSecretFormFieldEffectsOptions = {
    availableSourceTypes: Array<{ value: string }>;
    form: FormInstance<SecretFormValues>;
    isEdit: boolean;
    sourceType: string;
    vaultAuthType: string;
    webhookAuthType: string;
};

export function useSecretFormFieldEffects(options: UseSecretFormFieldEffectsOptions) {
    const { availableSourceTypes, form, isEdit, sourceType, vaultAuthType, webhookAuthType } = options;

    useEffect(() => {
        if (isEdit) {
            return;
        }
        if (!availableSourceTypes.some((item) => item.value === sourceType)) {
            form.setFieldValue('type', availableSourceTypes[0]?.value);
        }
    }, [availableSourceTypes, form, isEdit, sourceType]);

    useEffect(() => {
        if (sourceType !== 'vault') {
            return;
        }
        if (vaultAuthType === 'token') {
            clearFormFields(form, ['vault_role_id', 'vault_secret_id']);
            return;
        }
        clearFormFields(form, ['vault_token']);
    }, [form, sourceType, vaultAuthType]);

    useEffect(() => {
        if (sourceType !== 'webhook') {
            return;
        }
        if (webhookAuthType === 'basic') {
            clearFormFields(form, ['webhook_bearer_token', 'webhook_api_key_header', 'webhook_api_key']);
            return;
        }
        if (webhookAuthType === 'bearer') {
            clearFormFields(form, ['webhook_basic_username', 'webhook_basic_password', 'webhook_api_key_header', 'webhook_api_key']);
            return;
        }
        if (webhookAuthType === 'api_key') {
            clearFormFields(form, ['webhook_basic_username', 'webhook_basic_password', 'webhook_bearer_token']);
            return;
        }
        clearFormFields(form, ['webhook_basic_username', 'webhook_basic_password', 'webhook_bearer_token', 'webhook_api_key_header', 'webhook_api_key']);
    }, [form, sourceType, webhookAuthType]);
}
