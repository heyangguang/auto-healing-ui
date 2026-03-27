type DataEnvelope<T> = {
  data?: T;
  code?: number;
  message?: string;
};

type PaginatedEnvelope<T> = {
  data?: T[] | { items?: T[]; total?: number; page?: number; page_size?: number };
  items?: T[];
  total?: number;
  page?: number;
  page_size?: number;
  pagination?: { total?: number; page?: number; page_size?: number };
};

type NestedPaginatedEnvelope<T> = {
  data?: T[] | { items?: T[] };
  items?: T[];
  total?: number;
  page?: number;
  page_size?: number;
};

function asNestedEnvelope<T>(value: unknown): NestedPaginatedEnvelope<T> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as NestedPaginatedEnvelope<T>;
}

export function unwrapData<T>(response: DataEnvelope<T> | T): T {
  return ((response as DataEnvelope<T>)?.data ?? response) as T;
}

export function unwrapItems<T>(response: PaginatedEnvelope<T> | T[]): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  const data = response?.data;
  if (Array.isArray(data)) {
    return data;
  }
  const nestedData = asNestedEnvelope<T>(data)?.data;
  if (Array.isArray(nestedData)) {
    return nestedData;
  }
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray((data as { items?: T[] } | undefined)?.items)) {
    return (data as { items?: T[] }).items || [];
  }
  if (Array.isArray(asNestedEnvelope<T>(data)?.items)) {
    return asNestedEnvelope<T>(data)?.items || [];
  }
  return [];
}

export function normalizePaginatedResponse<T>(
  response: PaginatedEnvelope<T> | T[],
): AutoHealing.PaginatedResponse<T> {
  const items = unwrapItems(response);
  const envelope = Array.isArray(response) ? {} : response;
  const nested = Array.isArray(envelope?.data) ? undefined : envelope?.data;
  const deeplyNested = asNestedEnvelope<T>(nested)?.data && !Array.isArray(asNestedEnvelope<T>(nested)?.data)
    ? undefined
    : asNestedEnvelope<T>(nested);

  return {
    data: items,
    total: Number(
      envelope?.total
      ?? envelope?.pagination?.total
      ?? nested?.total
      ?? deeplyNested?.total
      ?? items.length,
    ),
    page: Number(envelope?.page ?? envelope?.pagination?.page ?? nested?.page ?? deeplyNested?.page ?? 1),
    page_size: Number(
      envelope?.page_size
      ?? envelope?.pagination?.page_size
      ?? nested?.page_size
      ?? deeplyNested?.page_size
      ?? items.length,
    ),
  };
}
