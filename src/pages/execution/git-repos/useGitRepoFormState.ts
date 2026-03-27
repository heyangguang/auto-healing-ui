import { history, useParams } from '@umijs/max';
import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useState } from 'react';
import { createGitRepo, updateGitRepo } from '@/services/auto-healing/git-repos';
import {
    buildCreateGitRepoPayload,
    buildUpdateGitRepoPayload,
    type GitRepoFormValues,
} from './gitRepoFormConfig';
import { useGitRepoDetailLoader } from './useGitRepoDetailLoader';
import { GIT_REPO_VALIDATION_FIELDS, useGitRepoValidationState } from './useGitRepoValidationState';

type UseGitRepoFormStateOptions = {
    form: FormInstance<GitRepoFormValues>;
};

export function useGitRepoFormState(options: UseGitRepoFormStateOptions) {
    const { form } = options;
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [submitting, setSubmitting] = useState(false);
    const authType = Form.useWatch('auth_type', form);
    const syncEnabled = Form.useWatch('sync_enabled', form);
    const validation = useGitRepoValidationState({ form });
    const detail = useGitRepoDetailLoader({
        applyLoadedValidation: validation.applyLoadedValidation,
        form,
        isEdit,
        repoId: params.id,
        resetValidation: validation.resetValidation,
    });

    const handleValidate = useCallback(async () => {
        if (isEdit && detail.loadFailed) {
            message.error('仓库详情加载失败，无法验证');
            return;
        }

        await validation.handleValidate();
    }, [detail.loadFailed, isEdit, validation]);

    const handleSubmit = useCallback(async () => {
        if (isEdit && detail.loadFailed) {
            message.error('仓库详情加载失败，无法保存');
            return;
        }
        if (!validation.validated) {
            message.warning('请先验证仓库连接');
            return;
        }

        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (isEdit && params.id) {
                await updateGitRepo(params.id, buildUpdateGitRepoPayload({
                    originalAuthType: detail.originalAuthType,
                    values,
                }));
                message.success('更新成功');
            } else {
                await createGitRepo(buildCreateGitRepoPayload(values));
                message.success('创建成功');
            }

            history.push('/execution/git-repos');
        } catch (error) {
            if (!(error as { errorFields?: unknown[] })?.errorFields) {
                message.error(error instanceof Error ? error.message : '保存仓库失败');
            }
        } finally {
            setSubmitting(false);
        }
    }, [detail.loadFailed, detail.originalAuthType, form, isEdit, params.id, validation.validated]);

    const handleValuesChange = useCallback((changedValues: Partial<GitRepoFormValues>) => {
        const shouldResetValidation = Object.keys(changedValues).some((key) => (
            GIT_REPO_VALIDATION_FIELDS.includes(key as keyof GitRepoFormValues)
        ));

        if (shouldResetValidation) {
            validation.resetValidation();
        }
    }, [validation]);

    return {
        authType,
        availableBranches: validation.availableBranches,
        defaultBranch: validation.defaultBranch,
        handleSubmit,
        handleValidate,
        handleValuesChange,
        isEdit,
        loadFailed: detail.loadFailed,
        loading: detail.loading,
        originalAuthType: detail.originalAuthType,
        params,
        reloadDetail: detail.reloadDetail,
        submitting,
        syncEnabled,
        validated: validation.validated,
        validating: validation.validating,
    };
}
