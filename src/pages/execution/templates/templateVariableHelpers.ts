import { extractDefaultValue } from '@/components/VariableInput';

const OBJECT_VARIABLE_TYPES = new Set(['object', 'dict']);

export type VariableValueMap = AutoHealing.JsonObject;

export type TemplateVariableRecord = AutoHealing.PlaybookVariable & {
    name: string;
    required?: boolean;
    type?: string;
};

function isEmptyCollectionValue(value: unknown) {
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (value && typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).length === 0;
    }
    return false;
}

function normalizeInitialTypedValue(
    variable: TemplateVariableRecord,
    value: AutoHealing.JsonValue | undefined,
): AutoHealing.JsonValue | undefined {
    if (value === undefined || value === null || value === '') {
        return value;
    }
    if (variable.type === 'number' && typeof value === 'string') {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
    }
    if (variable.type === 'boolean' && typeof value === 'string') {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
    }
    return value;
}

export function getPlaybookVariables(playbook?: AutoHealing.Playbook | null): TemplateVariableRecord[] {
    if (!playbook) {
        return [];
    }
    const variables = playbook.variables?.length
        ? playbook.variables
        : playbook.scanned_variables || [];
    return variables as TemplateVariableRecord[];
}

export function filterPlaybookVariables(
    variables: TemplateVariableRecord[],
    options: { searchText?: string; onlyRequired?: boolean },
) {
    const { searchText = '', onlyRequired = false } = options;
    const normalizedSearch = searchText.trim().toLowerCase();
    return variables.filter((variable) => {
        if (onlyRequired && !variable.required) {
            return false;
        }
        if (!normalizedSearch) {
            return true;
        }
        return variable.name.toLowerCase().includes(normalizedSearch);
    });
}

export function buildInitialVariableValues(
    playbook: AutoHealing.Playbook | null | undefined,
    overrides: VariableValueMap = {},
) {
    const initialValues: VariableValueMap = { ...overrides };
    getPlaybookVariables(playbook).forEach((variable) => {
        if (initialValues[variable.name] !== undefined) {
            initialValues[variable.name] = normalizeInitialTypedValue(variable, initialValues[variable.name]);
            return;
        }
        const defaultValue = extractDefaultValue(variable.default);
        if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
            initialValues[variable.name] = normalizeInitialTypedValue(variable, defaultValue);
        }
    });
    return initialValues;
}

function normalizeObjectVariableValue(
    variable: TemplateVariableRecord,
    value: AutoHealing.JsonValue | undefined,
): AutoHealing.JsonObject | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        throw new Error(`变量 ${variable.name} 需要 JSON 对象`);
    }
    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error(`变量 ${variable.name} 需要 JSON 对象`);
        }
        return parsed;
    } catch {
        throw new Error(`变量 ${variable.name} 需要有效的 JSON 对象`);
    }
}

function normalizeVariableSubmissionValue(
    variable: TemplateVariableRecord,
    value: AutoHealing.JsonValue | undefined,
): AutoHealing.JsonValue | undefined {
    if (variable.type === 'number') {
        if (value === undefined || value === null || value === '') {
            return value;
        }
        if (typeof value === 'number') {
            return value;
        }
        const parsed = Number(value);
        if (Number.isNaN(parsed)) {
            throw new Error(`变量 ${variable.name} 需要数字`);
        }
        return parsed;
    }
    if (variable.type === 'boolean') {
        if (value === undefined || value === null || value === '') {
            return value;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        throw new Error(`变量 ${variable.name} 需要布尔值`);
    }
    if (OBJECT_VARIABLE_TYPES.has(variable.type || '')) {
        return normalizeObjectVariableValue(variable, value);
    }
    return value;
}

export function buildSubmissionVariableValues(
    playbook: AutoHealing.Playbook | null | undefined,
    values: VariableValueMap,
    options: { includeUnknown?: boolean; omitBlankString?: boolean; omitEmptyCollection?: boolean } = {},
) {
    const { includeUnknown = true, omitBlankString = false, omitEmptyCollection = false } = options;
    const variableMap = new Map(
        getPlaybookVariables(playbook).map((variable) => [variable.name, variable] as const),
    );
    const normalizedValues: VariableValueMap = {};

    Object.entries(values).forEach(([name, value]) => {
        const variable = variableMap.get(name);
        if (!variable) {
            if (includeUnknown) {
                normalizedValues[name] = value;
            }
            return;
        }

        const normalizedValue = normalizeVariableSubmissionValue(variable, value);
        if (normalizedValue === undefined || normalizedValue === null) {
            return;
        }
        if (omitBlankString && normalizedValue === '') {
            return;
        }
        if (omitEmptyCollection && isEmptyCollectionValue(normalizedValue)) {
            return;
        }
        normalizedValues[name] = normalizedValue;
    });

    return normalizedValues;
}

export function formatVariableDisplayValue(value: unknown) {
    if (value === undefined || value === null) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}
