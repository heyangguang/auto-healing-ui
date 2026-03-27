import { Form, message } from 'antd';
import type { FormInstance } from 'antd';
import { useCallback, useRef, useState } from 'react';
import { validateGitRepo } from '@/services/auto-healing/git-repos';
import { buildValidateRequest, type GitRepoFormValues } from './gitRepoFormConfig';

type UseGitRepoValidationStateOptions = {
    form: FormInstance<GitRepoFormValues>;
};

type ApplyLoadedValidationOptions = {
    branches?: string[] | null;
    defaultBranch?: string | null;
};

const DEFAULT_BRANCH = 'main';

export const GIT_REPO_VALIDATION_FIELDS: Array<keyof GitRepoFormValues> = [
    'url',
    'auth_type',
    'token',
    'username',
    'password',
    'private_key',
    'passphrase',
];

function normalizeLoadedValidation(options: ApplyLoadedValidationOptions) {
    const nextDefaultBranch = options.defaultBranch || DEFAULT_BRANCH;
    const branches = options.branches?.length ? options.branches : [nextDefaultBranch];
    return {
        branches,
        defaultBranch: nextDefaultBranch,
    };
}

export function useGitRepoValidationState(options: UseGitRepoValidationStateOptions) {
    const { form } = options;
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [defaultBranch, setDefaultBranch] = useState('');
    const validateRequestIdRef = useRef(0);

    const clearValidationState = useCallback(() => {
        setValidated(false);
        setAvailableBranches([]);
        setDefaultBranch('');
        form.setFieldValue('default_branch', undefined);
    }, [form]);

    const resetValidation = useCallback(() => {
        validateRequestIdRef.current += 1;
        setValidating(false);
        clearValidationState();
    }, [clearValidationState]);

    const applyLoadedValidation = useCallback((options: ApplyLoadedValidationOptions) => {
        const nextValidation = normalizeLoadedValidation(options);
        setAvailableBranches(nextValidation.branches);
        setDefaultBranch(nextValidation.defaultBranch);
        setValidated(true);
    }, []);

    const handleValidate = useCallback(async () => {
        try {
            await form.validateFields(GIT_REPO_VALIDATION_FIELDS);
        } catch {
            return;
        }

        const requestId = validateRequestIdRef.current + 1;
        validateRequestIdRef.current = requestId;
        clearValidationState();
        setValidating(true);

        try {
            const values = form.getFieldsValue();
            const response = await validateGitRepo(buildValidateRequest(values));
            if (validateRequestIdRef.current !== requestId) {
                return;
            }

            const branches = response.branches || [];
            const nextDefaultBranch = response.default_branch || DEFAULT_BRANCH;
            if (branches.length === 0) {
                message.warning('未检测到分支');
                return;
            }

            applyLoadedValidation({
                branches,
                defaultBranch: nextDefaultBranch,
            });
            form.setFieldValue('default_branch', nextDefaultBranch);
            message.success(`验证成功，检测到 ${branches.length} 个分支`);
        } catch (error) {
            if (validateRequestIdRef.current === requestId) {
                message.error(error instanceof Error ? error.message : '仓库验证失败');
            }
        } finally {
            if (validateRequestIdRef.current === requestId) {
                setValidating(false);
            }
        }
    }, [applyLoadedValidation, clearValidationState, form]);

    return {
        applyLoadedValidation,
        availableBranches,
        defaultBranch,
        handleValidate,
        resetValidation,
        validated,
        validating,
    };
}
