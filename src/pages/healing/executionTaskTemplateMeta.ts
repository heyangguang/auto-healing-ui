type ExecutionTaskTemplateFields = {
  task_template_id?: unknown;
  task_template_name?: unknown;
};

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function resolveExecutionTaskTemplateId(
  fields?: ExecutionTaskTemplateFields | null,
) {
  return getStringValue(fields?.task_template_id);
}

export function resolveExecutionTaskTemplateName(
  fields?: ExecutionTaskTemplateFields | null,
) {
  return getStringValue(fields?.task_template_name);
}

export function normalizeExecutionTaskTemplateFields<
  T extends Record<string, unknown>,
>(fields: T) {
  const taskTemplateId = resolveExecutionTaskTemplateId(fields);
  const taskTemplateName = resolveExecutionTaskTemplateName(fields);

  return {
    ...fields,
    ...(taskTemplateId ? { task_template_id: taskTemplateId } : {}),
    ...(taskTemplateName ? { task_template_name: taskTemplateName } : {}),
  };
}
