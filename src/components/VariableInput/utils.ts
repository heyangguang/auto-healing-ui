export const extractDefaultValue = (defaultVal: unknown): string | null => {
    if (defaultVal === undefined || defaultVal === null) return null;

    if (typeof defaultVal === 'number' || typeof defaultVal === 'boolean') {
        return String(defaultVal);
    }

    if (Array.isArray(defaultVal)) {
        return null;
    }

    const str = String(defaultVal).trim();
    const jinja2Patterns = [
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*'([^']+)'\s*\)\s*\}\}/,
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*"([^"]+)"\s*\)\s*\}\}/,
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*(\d+)\s*\)\s*\}\}/,
        /\{\{\s*\w+\s*\|\s*default\s*\(\s*([^)]+)\s*\)\s*\}\}/,
    ];

    for (const pattern of jinja2Patterns) {
        const match = str.match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    if (str.includes('{{') && str.includes('}}')) {
        return null;
    }

    if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
        return null;
    }

    return str || null;
};

export const inferVariableType = (variable: AutoHealing.PlaybookVariable): string => {
    const name = variable.name.toLowerCase();
    const defaultVal = variable.default;

    if (variable.type && variable.type !== 'string') {
        return variable.type;
    }

    if (variable.enum && variable.enum.length > 0) {
        return 'enum';
    }

    if (name.includes('password') || name.includes('secret') || name.includes('key') || name.includes('token')) {
        return 'password';
    }
    if (name.includes('port') || name.includes('timeout') || name.includes('count') || name.includes('size') ||
        name.includes('limit') || name.includes('max') || name.includes('min') || name.includes('num') ||
        name.includes('workers') || name.includes('connections') || name.includes('processes') || name.includes('version')) {
        return 'number';
    }
    if (name.includes('enabled') || name.includes('enable') || name.includes('disabled') ||
        name.includes('is_') || name.includes('has_') || name.includes('use_') || name.includes('allow_')) {
        return 'boolean';
    }
    if (name.includes('hosts') || name.includes('servers') || name.includes('list') ||
        name.includes('tags') || name.includes('roles') || name.includes('groups')) {
        return 'list';
    }

    if (typeof defaultVal === 'number') return 'number';
    if (typeof defaultVal === 'boolean') return 'boolean';
    if (Array.isArray(defaultVal)) return 'list';

    const extracted = extractDefaultValue(defaultVal);
    if (extracted && /^\d+$/.test(extracted)) {
        return 'number';
    }

    return 'string';
};

export const parseListValue = (value: unknown, defaultValue: unknown): string[] => {
    let listVal: string[] = [];
    try {
        if (Array.isArray(value)) {
            listVal = value.map((v) => String(v));
        } else if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                listVal = parsed.map((v) => String(v));
            } else {
                listVal = [value];
            }
        }
    } catch {
        if (typeof value === 'string') listVal = value.split(',').filter(Boolean);
    }

    if (!value && !listVal.length) {
        if (Array.isArray(defaultValue)) {
            listVal = defaultValue.map((v) => typeof v === 'string' ? v : JSON.stringify(v));
        } else if (typeof defaultValue === 'string') {
            try {
                const parsed = JSON.parse(defaultValue);
                if (Array.isArray(parsed)) {
                    listVal = parsed.map((v) => typeof v === 'string' ? v : JSON.stringify(v));
                }
            } catch {
                // ignore parse error for non-json default string
            }
        }
    }

    return listVal;
};

const isRecord = (input: unknown): input is AutoHealing.JsonObject => {
    return typeof input === 'object' && input !== null && !Array.isArray(input);
};

export const parseObjectValue = (value: unknown, defaultValue: unknown): AutoHealing.JsonObject => {
    let objData: AutoHealing.JsonObject = {};
    try {
        if (isRecord(value)) {
            objData = value;
        } else if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            if (isRecord(parsed)) objData = parsed;
        }
    } catch {
        // ignore parse error
    }

    if (!value && Object.keys(objData).length === 0 && defaultValue) {
        if (isRecord(defaultValue)) {
            objData = defaultValue;
        } else if (typeof defaultValue === 'string') {
            try {
                const parsed = JSON.parse(defaultValue);
                if (isRecord(parsed)) objData = parsed;
            } catch {
                // ignore parse error
            }
        }
    }

    return isRecord(objData) ? objData : {};
};
