import type { Dispatch, SetStateAction } from 'react';

type EmptyRecord = Record<PropertyKey, never>;

export type ExtraVarsValueMap = Record<string, any> | EmptyRecord;
export type ExtraVarsMappings = Record<string, string> | EmptyRecord;
export type VariableInputMode = 'static' | 'expression';
export type VariableModeMap = Record<string, VariableInputMode>;
export type VariableModesSetter = Dispatch<SetStateAction<VariableModeMap>>;

export type ExtraVarsVariable = Omit<AutoHealing.PlaybookVariable, 'required'> & {
    required?: boolean;
    options?: string[];
};

export interface ExtraVarsEditorProps {
    taskTemplateId?: string;
    value?: ExtraVarsValueMap;
    variableMappings?: ExtraVarsMappings;
    onChange?: (vars: ExtraVarsValueMap) => void;
    onMappingsChange?: (mappings: ExtraVarsMappings) => void;
    onBatchChange?: (vars: ExtraVarsValueMap, mappings: ExtraVarsMappings) => void;
}

export interface ExtraVarsEditorRef {
    validateRequiredVars: () => { valid: boolean; missing: string[] };
    getRequiredVarNames: () => string[];
}

export type ExtraVarsFormValuesChange = (
    changedValues: ExtraVarsValueMap,
    allValues: ExtraVarsValueMap,
) => void;

export const hasConfiguredValue = (value: unknown): boolean => (
    value !== undefined && value !== '' && value !== null
);
