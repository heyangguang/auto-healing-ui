export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
};

export const variableTypeConfig: Record<string, { text: string; color: string }> = {
    string: { text: '字符串', color: '#1890ff' },
    number: { text: '数字', color: '#52c41a' },
    boolean: { text: '布尔', color: '#faad14' },
    list: { text: '列表', color: '#722ed1' },
    object: { text: '对象', color: '#13c2c2' },
    dict: { text: '字典', color: '#13c2c2' },
    enum: { text: '枚举', color: '#eb2f96' },
    choice: { text: '选择', color: '#eb2f96' },
    password: { text: '密码', color: '#f5222d' },
};

export const normalizeVariableEditorType = (type: AutoHealing.PlaybookVariableType) => {
    if (type === 'dict') return 'object';
    if (type === 'choice') return 'enum';
    return type;
};

export const parseDefaultValue = (value: unknown): string => {
    if (value === undefined || value === null) return '';
    const stringValue = String(value);
    const defaultMatch = stringValue.match(/\|\s*default\s*\(\s*(.+?)\s*\)\s*\}\}/);
    if (defaultMatch) {
        let extracted = defaultMatch[1].trim();
        if (
            (extracted.startsWith("'") && extracted.endsWith("'"))
            || (extracted.startsWith('"') && extracted.endsWith('"'))
        ) {
            extracted = extracted.slice(1, -1);
        }
        return extracted;
    }
    if (/^\{\{\s*\w+/.test(stringValue) && !stringValue.includes('default')) {
        return '';
    }
    if (stringValue === '[object Object]') {
        return '{}';
    }
    return stringValue;
};

export const hasVariableDefaultValue = (value: unknown): boolean => {
    if (value === undefined || value === null) {
        return false;
    }
    if (typeof value === 'string' && /^\{\{\s*\w+/.test(value) && !value.includes('default')) {
        return false;
    }
    return true;
};

export const updateVariableList = (
    variables: AutoHealing.PlaybookVariable[],
    variableName: string,
    updater: (variable: AutoHealing.PlaybookVariable) => AutoHealing.PlaybookVariable,
) => variables.map((variable) => (
    variable.name === variableName ? updater(variable) : variable
));

export const replaceVariable = (
    variables: AutoHealing.PlaybookVariable[],
    variableName: string,
    patch: Partial<AutoHealing.PlaybookVariable>,
) => updateVariableList(variables, variableName, (current) => ({ ...current, ...patch }));

export const parseDefaultList = (value: string): string[] => {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const parseDefaultObject = (value: string): Record<string, string> => {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return Object.fromEntries(
                Object.entries(parsed).map(([key, item]) => [key, String(item ?? '')]),
            );
        }
    } catch {
        // ignore
    }
    return {};
};
