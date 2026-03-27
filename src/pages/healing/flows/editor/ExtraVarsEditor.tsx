import React, { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import { Form, Spin, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { getExecutionTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import ExtraVarsOptionalSection from './ExtraVarsOptionalSection';
import ExtraVarsVariableRow from './ExtraVarsVariableRow';
import type {
    ExtraVarsEditorProps,
    ExtraVarsEditorRef,
    ExtraVarsMappings,
    ExtraVarsValueMap,
    ExtraVarsVariable,
    VariableInputMode,
    VariableModeMap,
} from './extraVarsTypes';
import { hasConfiguredValue } from './extraVarsTypes';

const { Text } = Typography;

const MESSAGE_BOX_STYLE = {
    border: '1px solid #f0f0f0',
    borderRadius: 0,
    padding: '16px',
    textAlign: 'center' as const,
};

const LOADING_BOX_STYLE = {
    ...MESSAGE_BOX_STYLE,
    padding: '24px',
};

const inferVariables = (extraVars: ExtraVarsValueMap): ExtraVarsVariable[] => (
    Object.keys(extraVars).map((key) => ({
        name: key,
        type: 'string',
        required: false,
        description: '',
        default: extraVars[key],
    }))
);

const buildExpressionModes = (variableMappings: ExtraVarsMappings): VariableModeMap => {
    const modes: VariableModeMap = {};
    Object.entries(variableMappings).forEach(([variableName, expression]) => {
        if (expression) {
            modes[variableName] = 'expression';
        }
    });
    return modes;
};

const ExtraVarsEditor = forwardRef<ExtraVarsEditorRef, ExtraVarsEditorProps>(({
    taskTemplateId,
    value = {},
    variableMappings = {},
    onChange,
    onMappingsChange,
    onBatchChange,
}, ref) => {
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<ExtraVarsVariable[]>([]);
    const [defaultVars, setDefaultVars] = useState<ExtraVarsValueMap>({});
    const [requiredForm] = Form.useForm<ExtraVarsValueMap>();
    const [varModes, setVarModes] = useState<VariableModeMap>({});
    const prevTaskTemplateIdRef = useRef<string | undefined>(undefined);

    const requiredVars = useMemo(() => variables.filter((variable) => variable.required), [variables]);
    const optionalVars = useMemo(() => variables.filter((variable) => !variable.required), [variables]);

    const configuredOptionalVars = useMemo(() => (
        optionalVars.filter((variable) => (
            hasConfiguredValue(value[variable.name]) || Boolean(variableMappings[variable.name])
        ))
    ), [optionalVars, value, variableMappings]);

    const loadVariables = async (notifyParent = false) => {
        if (!taskTemplateId) {
            return;
        }

        setLoading(true);
        try {
            const taskRes = await getExecutionTask(taskTemplateId);
            const task = taskRes.data;
            const extraVars = task?.extra_vars || {};

            setDefaultVars(extraVars);
            if (task?.playbook?.id) {
                const playbookRes = await getPlaybook(task.playbook.id);
                setVariables(playbookRes.data?.variables || []);
            } else {
                setVariables(inferVariables(extraVars));
            }

            setVarModes(buildExpressionModes(variableMappings));
            if (notifyParent) {
                onChange?.(extraVars);
            }
        } catch (error) {
            console.error('Failed to load variables:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskTemplateId) {
            const isNewTemplate = prevTaskTemplateIdRef.current !== undefined
                && prevTaskTemplateIdRef.current !== taskTemplateId;
            loadVariables(isNewTemplate);
            prevTaskTemplateIdRef.current = taskTemplateId;
            return;
        }

        setVariables([]);
        setDefaultVars({});
        prevTaskTemplateIdRef.current = undefined;
    }, [taskTemplateId]);

    useEffect(() => {
        if (requiredVars.length === 0) {
            return;
        }

        const requiredValues: ExtraVarsValueMap = {};
        requiredVars.forEach((variable) => {
            requiredValues[variable.name] = value[variable.name] ?? defaultVars[variable.name];
        });
        requiredForm.setFieldsValue(
            requiredValues as Parameters<typeof requiredForm.setFieldsValue>[0],
        );
    }, [requiredVars, value, defaultVars, requiredForm]);

    useEffect(() => {
        if (Object.keys(variableMappings).length === 0) {
            return;
        }

        setVarModes((currentModes) => {
            const nextModes = { ...currentModes };
            let changed = false;

            Object.entries(variableMappings).forEach(([variableName, expression]) => {
                if (expression && nextModes[variableName] !== 'expression') {
                    nextModes[variableName] = 'expression';
                    changed = true;
                }
            });

            return changed ? nextModes : currentModes;
        });
    }, [variableMappings]);

    useImperativeHandle(ref, () => ({
        validateRequiredVars: () => {
            const missing = requiredVars
                .filter((variable) => !hasConfiguredValue(value[variable.name]) && !variableMappings[variable.name])
                .map((variable) => variable.name);

            return { valid: missing.length === 0, missing };
        },
        getRequiredVarNames: () => requiredVars.map((variable) => variable.name),
    }), [requiredVars, value, variableMappings]);

    const handleModeChange = (varName: string, mode: VariableInputMode) => {
        setVarModes((currentModes) => ({ ...currentModes, [varName]: mode }));
        if (mode === 'static') {
            const nextMappings = { ...variableMappings };
            delete nextMappings[varName];
            onMappingsChange?.(nextMappings);
            return;
        }

        const nextValue = { ...value };
        delete nextValue[varName];
        onChange?.(nextValue);
    };

    const handleExpressionChange = (varName: string, expression: string) => {
        const nextMappings = { ...variableMappings, [varName]: expression };
        if (!expression) {
            delete nextMappings[varName];
        }
        onMappingsChange?.(nextMappings);
    };

    const handleRequiredChange = (_changedValues: ExtraVarsValueMap, allValues: ExtraVarsValueMap) => {
        const nextValue = { ...value, ...allValues };
        const filteredValue = Object.fromEntries(
            Object.entries(nextValue).filter(([, currentValue]) => hasConfiguredValue(currentValue)),
        );
        onChange?.(filteredValue);
    };

    if (!taskTemplateId) {
        return (
            <div style={{ ...MESSAGE_BOX_STYLE, color: '#999' }}>
                <Text type="secondary">请先选择任务模板</Text>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={LOADING_BOX_STYLE}>
                <Spin size="small" />
            </div>
        );
    }

    if (variables.length === 0) {
        return (
            <div style={{ ...MESSAGE_BOX_STYLE, color: '#999' }}>
                <Text type="secondary">该任务模板没有定义额外变量</Text>
            </div>
        );
    }

    return (
        <>
            {requiredVars.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>必填变量</Text>
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                            可选择静态值或表达式
                        </Text>
                    </div>
                    {requiredVars.map((variable) => (
                        <ExtraVarsVariableRow
                            key={variable.name}
                            variable={variable}
                            isRequired
                            mode={varModes[variable.name] || 'static'}
                            form={requiredForm}
                            onFormValuesChange={handleRequiredChange}
                            expressionMappings={variableMappings}
                            onExpressionChange={handleExpressionChange}
                            onModeChange={handleModeChange}
                        />
                    ))}
                </div>
            )}

            <ExtraVarsOptionalSection
                optionalVars={optionalVars}
                requiredVars={requiredVars}
                configuredOptionalVars={configuredOptionalVars}
                value={value}
                defaultVars={defaultVars}
                variableMappings={variableMappings}
                varModes={varModes}
                setVarModes={setVarModes}
                onBatchChange={onBatchChange}
                onChange={onChange}
                onMappingsChange={onMappingsChange}
            />
        </>
    );
});

export default ExtraVarsEditor;
