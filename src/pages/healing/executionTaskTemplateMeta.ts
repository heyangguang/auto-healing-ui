type ExecutionTaskTemplateFields = {
    task_id?: unknown;
    task_name?: unknown;
    task_template_id?: unknown;
    task_template_name?: unknown;
};

function getStringValue(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : undefined;
}

export function resolveExecutionTaskTemplateId(
    fields?: ExecutionTaskTemplateFields | null,
) {
    return getStringValue(fields?.task_template_id)
        || getStringValue(fields?.task_id);
}

export function resolveExecutionTaskTemplateName(
    fields?: ExecutionTaskTemplateFields | null,
) {
    return getStringValue(fields?.task_template_name)
        || getStringValue(fields?.task_name);
}

export function normalizeExecutionTaskTemplateFields<T extends Record<string, unknown>>(
    fields: T,
) {
    const taskTemplateId = resolveExecutionTaskTemplateId(fields);
    const taskTemplateName = resolveExecutionTaskTemplateName(fields);

    return {
        ...fields,
        ...(taskTemplateId ? { task_template_id: taskTemplateId } : {}),
        ...(taskTemplateName ? { task_template_name: taskTemplateName } : {}),
    };
}
