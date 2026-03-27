export function buildPlaybookQueryParams(params: Record<string, any>) {
    const queryParams: Record<string, any> = {};
    if (params.name__exact) queryParams.name__exact = params.name__exact;
    else if (params.name) queryParams.name = params.name;
    if (params.file_path__exact) queryParams.file_path__exact = params.file_path__exact;
    else if (params.file_path) queryParams.file_path = params.file_path;
    if (params.status) queryParams.status = params.status;
    if (params.config_mode) queryParams.config_mode = params.config_mode;
    if (params.has_variables) queryParams.has_variables = params.has_variables;
    if (params.has_required_vars) queryParams.has_required_vars = params.has_required_vars;
    if (params.repository_id) queryParams.repository_id = params.repository_id;
    if (params.created_from) queryParams.created_from = params.created_from;
    if (params.created_to) queryParams.created_to = params.created_to;
    return queryParams;
}

export function buildPlaybookSearchParams(advancedSearch?: Record<string, any>) {
    const raw = advancedSearch || {};
    const params: Record<string, any> = {};
    Object.entries(raw).forEach(([key, value]) => {
        if (!value && value !== false && value !== 0) return;
        const cleanKey = key.replace(/^__enum__/, '');
        params[cleanKey] = value;
    });
    return params;
}
