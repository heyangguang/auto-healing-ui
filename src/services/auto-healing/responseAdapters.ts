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
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray((data as { items?: T[] } | undefined)?.items)) {
    return (data as { items?: T[] }).items || [];
  }
  return [];
}

export function normalizePaginatedResponse<T>(
  response: PaginatedEnvelope<T> | T[],
): AutoHealing.PaginatedResponse<T> {
  const items = unwrapItems(response);
  const envelope = Array.isArray(response) ? {} : response;
  const nested = Array.isArray(envelope?.data) ? undefined : envelope?.data;

  return {
    data: items,
    total: Number(
      envelope?.total
      ?? envelope?.pagination?.total
      ?? nested?.total
      ?? items.length,
    ),
    page: Number(envelope?.page ?? envelope?.pagination?.page ?? nested?.page ?? 1),
    page_size: Number(
      envelope?.page_size
      ?? envelope?.pagination?.page_size
      ?? nested?.page_size
      ?? items.length,
    ),
  };
}
