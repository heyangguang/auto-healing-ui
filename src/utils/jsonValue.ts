const isPlainObject = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const isJsonValue = (value: unknown): value is AutoHealing.JsonValue => {
    if (value === null) {
        return true;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return true;
    }
    if (Array.isArray(value)) {
        return value.every((item) => isJsonValue(item));
    }
    if (!isPlainObject(value)) {
        return false;
    }
    return Object.values(value).every((item) => item === undefined || isJsonValue(item));
};

export const toJsonValue = (value: unknown): AutoHealing.JsonValue | undefined => {
    if (value === undefined) {
        return undefined;
    }
    if (!isJsonValue(value)) {
        throw new TypeError('Expected JSON-serializable value');
    }
    return value;
};

export const toJsonObject = (value: Record<string, unknown>): AutoHealing.JsonObject => {
    const nextValue: AutoHealing.JsonObject = {};
    Object.entries(value).forEach(([key, currentValue]) => {
        nextValue[key] = toJsonValue(currentValue);
    });
    return nextValue;
};
